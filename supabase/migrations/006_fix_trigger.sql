-- ============================================================
-- 006 — Fix handle_new_user trigger with error handling
-- ============================================================
-- Prevents "Database error saving new user" caused by trigger
-- exceptions propagating to GoTrue and blocking account creation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starter_plan_id UUID;
BEGIN
  BEGIN
    SELECT id INTO v_starter_plan_id
    FROM public.plans WHERE name = 'starter' LIMIT 1;

    INSERT INTO public.profiles (id, email, full_name, role, plan_id)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'user',
      v_starter_plan_id
    )
    ON CONFLICT (id) DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    -- Log warning but never block user creation
    RAISE WARNING 'handle_new_user error (non-fatal): % %', SQLERRM, SQLSTATE;
  END;

  RETURN new;
END;
$$;

-- Recreate trigger fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
