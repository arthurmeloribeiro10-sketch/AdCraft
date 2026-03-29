-- ============================================================
-- 007 — Enable pgcrypto and re-seed plan keys
-- ============================================================
-- Fix: crypt() was unavailable because pgcrypto wasn't enabled.
-- This re-enables it and regenerates all plan key hashes.

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- Re-seed plan keys (drops old ones first so new hashes are generated)
-- Passwords: adcraftStarter2025# / adcraftPro2025# / adcraftElite2025#

DO $$
DECLARE
  v_starter_id UUID;
  v_pro_id     UUID;
  v_elite_id   UUID;
BEGIN
  SELECT id INTO v_starter_id FROM plans WHERE name = 'starter' LIMIT 1;
  SELECT id INTO v_pro_id     FROM plans WHERE name = 'pro'     LIMIT 1;
  SELECT id INTO v_elite_id   FROM plans WHERE name = 'elite'   LIMIT 1;

  -- Deactivate all existing keys
  UPDATE plan_keys SET is_active = false;

  -- Insert fresh keys with correct bcrypt hashes
  IF v_starter_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_starter_id, public.crypt('adcraftStarter2025#', public.gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_pro_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_pro_id, public.crypt('adcraftPro2025#', public.gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_elite_id IS NOT NULL THEN
    INSERT INTO plan_keys (plan_id, key_hash, is_active, notes)
    VALUES (v_elite_id, public.crypt('adcraftElite2025#', public.gen_salt('bf', 10)), true, 'Chave inicial')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Recreate validate_plan_key_auto with explicit public.crypt reference
CREATE OR REPLACE FUNCTION validate_plan_key_auto(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_rec        RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  FOR v_rec IN (
    SELECT pk.id, pk.key_hash, pk.expires_at,
           pk.plan_id, p.name AS plan_name, p.display_name
    FROM plan_keys pk
    JOIN plans p ON p.id = pk.plan_id
    WHERE pk.is_active = true
    ORDER BY p.sort_order DESC
  ) LOOP
    CONTINUE WHEN v_rec.expires_at IS NOT NULL AND v_rec.expires_at < now();

    IF public.crypt(p_key, v_rec.key_hash) = v_rec.key_hash THEN
      UPDATE profiles SET plan_id = v_rec.plan_id, updated_at = now() WHERE id = v_user_id;

      INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
      VALUES (v_user_id, 'plan_key_validated', 'plan', v_rec.plan_id::text,
              jsonb_build_object('plan_name', v_rec.plan_name));

      RETURN jsonb_build_object(
        'success',      true,
        'plan_name',    v_rec.plan_name,
        'plan_display', v_rec.display_name
      );
    END IF;
  END LOOP;

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, 'plan_key_failed', 'system', 'auto',
          jsonb_build_object('attempted', true));

  RETURN jsonb_build_object('success', false, 'error', 'invalid_key');
END;
$$;

-- Recreate validate_plan_key with explicit public.crypt reference
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

  IF public.crypt(p_key, v_key_hash) != v_key_hash THEN
    INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
    VALUES (v_user_id, 'plan_key_failed', 'plan', v_plan_id::text,
            jsonb_build_object('plan_name', p_plan_name));
    RETURN jsonb_build_object('success', false, 'error', 'invalid_key');
  END IF;

  UPDATE profiles SET plan_id = v_plan_id, updated_at = now() WHERE id = v_user_id;

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, 'plan_key_validated', 'plan', v_plan_id::text,
          jsonb_build_object('plan_name', p_plan_name));

  RETURN jsonb_build_object('success', true, 'plan_name', p_plan_name);
END;
$$;

-- Recreate admin_set_plan_key with explicit public.crypt reference
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

  v_hash := public.crypt(p_new_key, public.gen_salt('bf', 10));

  UPDATE plan_keys SET is_active = false WHERE plan_id = v_plan_id AND is_active = true;

  INSERT INTO plan_keys (plan_id, key_hash, is_active, expires_at, created_by, notes)
  VALUES (v_plan_id, v_hash, true, p_expires_at, v_admin_id, p_notes);

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_admin_id, 'plan_key_rotated', 'plan', v_plan_id::text,
          jsonb_build_object('plan_name', p_plan_name, 'expires_at', p_expires_at));

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION validate_plan_key_auto TO authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_key      TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_plan_key     TO authenticated;
