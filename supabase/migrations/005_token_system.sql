-- ============================================================
-- 005 — Token System + Auto Plan Key Detection
-- ============================================================

-- ─── Update plan limits ────────────────────────────────────
-- Starter: 50 tokens/month
UPDATE plans SET
  api_limit_daily   = 50,
  api_limit_monthly = 50,
  features = jsonb_build_object(
    'scriptGenerator', true,
    'copyGenerator',   true,
    'videoAnalyzer',   false,
    'creativeIdeas',   true,
    'winnersLibrary',  false,
    'trendsRadar',     false,
    'projectHistory',  true,
    'maxScripts',      -1,
    'maxCopies',       -1,
    'maxAnalyses',     0,
    'maxIdeas',        -1
  )
WHERE name = 'starter';

-- Pro: 200 tokens/month
UPDATE plans SET
  api_limit_daily   = 200,
  api_limit_monthly = 200,
  features = jsonb_build_object(
    'scriptGenerator', true,
    'copyGenerator',   true,
    'videoAnalyzer',   false,
    'creativeIdeas',   true,
    'winnersLibrary',  true,
    'trendsRadar',     false,
    'projectHistory',  true,
    'maxScripts',      -1,
    'maxCopies',       -1,
    'maxAnalyses',     0,
    'maxIdeas',        -1
  )
WHERE name = 'pro';

-- Elite: unlimited (-1)
UPDATE plans SET
  api_limit_daily   = -1,
  api_limit_monthly = -1,
  features = jsonb_build_object(
    'scriptGenerator', true,
    'copyGenerator',   true,
    'videoAnalyzer',   true,
    'creativeIdeas',   true,
    'winnersLibrary',  true,
    'trendsRadar',     true,
    'projectHistory',  true,
    'maxScripts',      -1,
    'maxCopies',       -1,
    'maxAnalyses',     -1,
    'maxIdeas',        -1
  )
WHERE name = 'elite';

-- ─── Feature token costs ────────────────────────────────────
-- Stored in system_settings so admin can change them
INSERT INTO system_settings (key, value)
VALUES ('feature_token_costs', '{
  "copyGenerator":   5,
  "scriptGenerator": 10,
  "creativeIdeas":   15,
  "winnersLibrary":  2,
  "videoAnalyzer":   10,
  "trendsRadar":     5
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ─── consume_tokens(feature) ────────────────────────────────
-- Called before each AI generation. Deducts tokens from user's monthly balance.
-- Returns {success, cost, used, limit} or {success:false, error}
CREATE OR REPLACE FUNCTION consume_tokens(p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_profile      profiles%ROWTYPE;
  v_monthly_limit INT;
  v_costs        JSONB;
  v_token_cost   INT;
  v_now_used     INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  -- Get monthly limit from plan
  SELECT api_limit_monthly INTO v_monthly_limit
  FROM plans WHERE id = v_profile.plan_id;

  -- Auto-reset monthly counter if needed
  IF v_profile.api_reset_monthly IS NULL OR v_profile.api_reset_monthly <= now() THEN
    UPDATE profiles
    SET api_calls_month   = 0,
        api_reset_monthly = date_trunc('month', now()) + interval '1 month'
    WHERE id = v_user_id;
    v_profile.api_calls_month := 0;
  END IF;

  -- Get token cost for this feature
  SELECT value INTO v_costs FROM system_settings WHERE key = 'feature_token_costs';
  v_token_cost := COALESCE((v_costs ->> p_feature)::int, 1);

  -- Elite / unlimited: skip limit check
  IF v_monthly_limit = -1 THEN
    UPDATE profiles
    SET api_calls_month = COALESCE(api_calls_month, 0) + v_token_cost
    WHERE id = v_user_id;

    INSERT INTO api_usage_logs (user_id, endpoint, tokens_used)
    VALUES (v_user_id, p_feature, v_token_cost);

    RETURN jsonb_build_object(
      'success',    true,
      'cost',       v_token_cost,
      'used',       COALESCE(v_profile.api_calls_month, 0) + v_token_cost,
      'limit',      -1,
      'unlimited',  true
    );
  END IF;

  v_now_used := COALESCE(v_profile.api_calls_month, 0);

  -- Check if user has enough tokens
  IF v_now_used + v_token_cost > v_monthly_limit THEN
    RETURN jsonb_build_object(
      'success',   false,
      'error',     'token_limit_reached',
      'cost',      v_token_cost,
      'used',      v_now_used,
      'limit',     v_monthly_limit,
      'remaining', GREATEST(v_monthly_limit - v_now_used, 0)
    );
  END IF;

  -- Deduct tokens
  UPDATE profiles
  SET api_calls_month = v_now_used + v_token_cost
  WHERE id = v_user_id;

  INSERT INTO api_usage_logs (user_id, endpoint, tokens_used)
  VALUES (v_user_id, p_feature, v_token_cost);

  RETURN jsonb_build_object(
    'success',   true,
    'cost',      v_token_cost,
    'used',      v_now_used + v_token_cost,
    'limit',     v_monthly_limit,
    'remaining', v_monthly_limit - v_now_used - v_token_cost
  );
END;
$$;

-- ─── get_token_status() ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_token_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_profile      profiles%ROWTYPE;
  v_monthly_limit INT;
  v_plan_name    TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  SELECT api_limit_monthly, name INTO v_monthly_limit, v_plan_name
  FROM plans WHERE id = v_profile.plan_id;

  -- Auto-reset check
  IF v_profile.api_reset_monthly IS NULL OR v_profile.api_reset_monthly <= now() THEN
    UPDATE profiles
    SET api_calls_month   = 0,
        api_reset_monthly = date_trunc('month', now()) + interval '1 month'
    WHERE id = v_user_id
    RETURNING api_calls_month, api_reset_monthly
    INTO v_profile.api_calls_month, v_profile.api_reset_monthly;
  END IF;

  RETURN jsonb_build_object(
    'used',       COALESCE(v_profile.api_calls_month, 0),
    'limit',      v_monthly_limit,
    'unlimited',  v_monthly_limit = -1,
    'remaining',  CASE WHEN v_monthly_limit = -1 THEN -1
                       ELSE GREATEST(v_monthly_limit - COALESCE(v_profile.api_calls_month, 0), 0) END,
    'reset_date', v_profile.api_reset_monthly,
    'plan_name',  v_plan_name
  );
END;
$$;

-- ─── validate_plan_key_auto(key) ────────────────────────────
-- Auto-detects which plan the key belongs to, assigns it to the caller.
-- No need for user to manually pick a plan.
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

  -- Try each active, non-expired key (elite → pro → starter order for correctness)
  FOR v_rec IN (
    SELECT pk.id, pk.key_hash, pk.expires_at,
           pk.plan_id, p.name AS plan_name, p.display_name
    FROM plan_keys pk
    JOIN plans p ON p.id = pk.plan_id
    WHERE pk.is_active = true
    ORDER BY p.sort_order DESC
  ) LOOP
    -- Skip expired keys
    CONTINUE WHEN v_rec.expires_at IS NOT NULL AND v_rec.expires_at < now();

    -- Bcrypt comparison
    IF crypt(p_key, v_rec.key_hash) = v_rec.key_hash THEN
      UPDATE profiles SET plan_id = v_rec.plan_id, updated_at = now() WHERE id = v_user_id;

      INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
      VALUES (v_user_id, 'plan_key_validated', 'plan', v_rec.plan_id::text,
              jsonb_build_object('plan_name', v_rec.plan_name));

      RETURN jsonb_build_object(
        'success',       true,
        'plan_name',     v_rec.plan_name,
        'plan_display',  v_rec.display_name
      );
    END IF;
  END LOOP;

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, 'plan_key_failed', 'system', 'auto',
          jsonb_build_object('attempted', true));

  RETURN jsonb_build_object('success', false, 'error', 'invalid_key');
END;
$$;

-- ─── admin_reset_user_tokens(user_id) ───────────────────────
CREATE OR REPLACE FUNCTION admin_reset_user_tokens(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  UPDATE profiles
  SET api_calls_month   = 0,
      api_calls_today   = 0,
      api_reset_monthly = date_trunc('month', now()) + interval '1 month',
      api_reset_daily   = now() + interval '1 day'
  WHERE id = p_user_id;

  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), 'profileUpdated', 'user', p_user_id::text,
          jsonb_build_object('action', 'tokens_reset'));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── admin_update_feature_costs(costs JSONB) ────────────────
CREATE OR REPLACE FUNCTION admin_update_feature_costs(p_costs JSONB)
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
  VALUES ('feature_token_costs', p_costs, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
    SET value = p_costs, updated_at = now(), updated_by = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── Grants ─────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION consume_tokens             TO authenticated;
GRANT EXECUTE ON FUNCTION get_token_status           TO authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_key_auto     TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_user_tokens    TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_feature_costs TO authenticated;
