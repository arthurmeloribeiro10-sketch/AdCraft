-- ============================================================
-- 004 — Plan Keys, System Settings, Blocked Emails
-- ============================================================

-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── plan_keys ────────────────────────────────────────────
-- Stores bcrypt-hashed plan passwords. Only one active key per plan at a time.
-- Old keys are kept (is_active=false) for audit trail.
CREATE TABLE IF NOT EXISTS plan_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  key_hash    TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,
  notes       TEXT,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce only one active key per plan
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_key_per_plan
  ON plan_keys (plan_id) WHERE is_active = true;

-- ─── system_settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── blocked_emails ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_emails (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  reason      TEXT,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────
ALTER TABLE plan_keys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_emails  ENABLE ROW LEVEL SECURITY;

-- Only admins can directly query these tables
CREATE POLICY "Admins manage plan_keys"
  ON plan_keys FOR ALL USING (is_admin());

CREATE POLICY "Admins manage system_settings"
  ON system_settings FOR ALL USING (is_admin());

CREATE POLICY "Admins manage blocked_emails"
  ON blocked_emails FOR ALL USING (is_admin());

-- ─── SEED: initial plan keys (bcrypt hashed) ──────────────
DO $$
DECLARE
  v_starter_id UUID;
  v_pro_id     UUID;
  v_elite_id   UUID;
BEGIN
  SELECT id INTO v_starter_id FROM plans WHERE name = 'starter' LIMIT 1;
  SELECT id INTO v_pro_id     FROM plans WHERE name = 'pro'     LIMIT 1;
  SELECT id INTO v_elite_id   FROM plans WHERE name = 'elite'   LIMIT 1;

  IF v_starter_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_starter_id, crypt('adcraftStarter2025#', gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_pro_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_pro_id, crypt('adcraftPro2025#', gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_elite_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_elite_id, crypt('adcraftElite2025#', gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ─── SEED: default system settings ────────────────────────
INSERT INTO system_settings (key, value) VALUES
  ('registration_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─── FUNCTION: validate_plan_key ──────────────────────────
-- Called by authenticated user to unlock a plan.
-- Compares bcrypt, assigns plan to caller's profile, logs audit.
CREATE OR REPLACE FUNCTION validate_plan_key(p_plan_name TEXT, p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_plan_id    UUID;
  v_key_hash   TEXT;
  v_key_id     UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT id INTO v_plan_id FROM plans WHERE name = p_plan_name AND is_active = true LIMIT 1;
  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_plan');
  END IF;

  SELECT id, key_hash, expires_at
  INTO v_key_id, v_key_hash, v_expires_at
  FROM plan_keys
  WHERE plan_id = v_plan_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;

  IF v_key_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_key');
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'key_expired');
  END IF;

  -- Bcrypt comparison
  IF crypt(p_key, v_key_hash) != v_key_hash THEN
    -- Log failed attempt
    INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
    VALUES (v_user_id, 'plan_key_failed', 'plan', v_plan_id::text,
            jsonb_build_object('plan_name', p_plan_name));
    RETURN jsonb_build_object('success', false, 'error', 'invalid_key');
  END IF;

  -- Assign plan to user
  UPDATE profiles SET plan_id = v_plan_id, updated_at = now() WHERE id = v_user_id;

  -- Audit success
  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, 'plan_key_validated', 'plan', v_plan_id::text,
          jsonb_build_object('plan_name', p_plan_name));

  RETURN jsonb_build_object('success', true, 'plan_name', p_plan_name);
END;
$$;

-- ─── FUNCTION: check_registration_allowed ─────────────────
-- Public function (callable by anon). Returns whether email can register.
CREATE OR REPLACE FUNCTION check_registration_allowed(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled   JSONB;
  v_blocked   BOOLEAN;
BEGIN
  SELECT value INTO v_enabled FROM system_settings WHERE key = 'registration_enabled';
  IF v_enabled IS NOT NULL AND v_enabled = 'false'::jsonb THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'registration_disabled');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM blocked_emails WHERE lower(email) = lower(p_email)
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'email_blocked');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', null);
END;
$$;

-- ─── FUNCTION: admin_set_plan_key ─────────────────────────
CREATE OR REPLACE FUNCTION admin_set_plan_key(
  p_plan_name  TEXT,
  p_new_key    TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes      TEXT        DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_plan_id  UUID;
  v_hash     TEXT;
BEGIN
  v_admin_id := auth.uid();
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  SELECT id INTO v_plan_id FROM plans WHERE name = p_plan_name LIMIT 1;
  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_plan');
  END IF;

  v_hash := crypt(p_new_key, gen_salt('bf', 10));

  -- Deactivate current key
  UPDATE plan_keys SET is_active = false WHERE plan_id = v_plan_id AND is_active = true;

  -- Insert new key
  INSERT INTO plan_keys (plan_id, key_hash, is_active, expires_at, created_by, notes)
  VALUES (v_plan_id, v_hash, true, p_expires_at, v_admin_id, p_notes);

  -- Audit
  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_admin_id, 'plan_key_rotated', 'plan', v_plan_id::text,
          jsonb_build_object('plan_name', p_plan_name, 'expires_at', p_expires_at));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── FUNCTION: admin_get_plan_key_status ──────────────────
CREATE OR REPLACE FUNCTION admin_get_plan_key_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('error', 'not_admin');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'plan_id',           p.id,
      'plan_name',         p.name,
      'plan_display_name', p.display_name,
      'has_active_key',    (pk.id IS NOT NULL),
      'expires_at',        pk.expires_at,
      'created_at',        pk.created_at,
      'is_expired',        (pk.expires_at IS NOT NULL AND pk.expires_at < now()),
      'notes',             pk.notes
    ) ORDER BY p.sort_order
  )
  INTO v_result
  FROM plans p
  LEFT JOIN LATERAL (
    SELECT id, expires_at, created_at, notes
    FROM plan_keys
    WHERE plan_id = p.id AND is_active = true
    ORDER BY created_at DESC LIMIT 1
  ) pk ON true;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ─── FUNCTION: admin_update_system_setting ────────────────
CREATE OR REPLACE FUNCTION admin_update_system_setting(p_key TEXT, p_value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  INSERT INTO system_settings (key, value, updated_at, updated_by)
  VALUES (p_key, p_value, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
    SET value = p_value, updated_at = now(), updated_by = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── FUNCTION: admin_block_email ──────────────────────────
CREATE OR REPLACE FUNCTION admin_block_email(p_email TEXT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  INSERT INTO blocked_emails (email, reason, created_by)
  VALUES (lower(p_email), p_reason, auth.uid())
  ON CONFLICT (email) DO UPDATE SET reason = p_reason;

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), 'email_blocked', 'system', p_email,
          jsonb_build_object('email', p_email, 'reason', p_reason));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── FUNCTION: admin_unblock_email ────────────────────────
CREATE OR REPLACE FUNCTION admin_unblock_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  DELETE FROM blocked_emails WHERE lower(email) = lower(p_email);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── Grant execute to roles ────────────────────────────────
GRANT EXECUTE ON FUNCTION check_registration_allowed TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_key           TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_plan_key          TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_plan_key_status   TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION admin_block_email           TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unblock_email         TO authenticated;
