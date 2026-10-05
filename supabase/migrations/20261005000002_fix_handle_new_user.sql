-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Fix handle_new_user Trigger Function
-- Migration: 20261005000002_fix_handle_new_user.sql
-- Issue: digest() is installed in the 'extensions' schema in Supabase.
-- Setting search_path = public caused digest() to fail silently due to EXCEPTION block,
-- preventing public.profiles and public.user_preferences creation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  extracted_name TEXT;
  extracted_avatar TEXT;
  extracted_phone TEXT;
BEGIN
  -- Extract user metadata safely
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Use extensions.digest safely with schema qualification
  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(extensions.digest(NEW.email::text, 'sha256'), 'hex')
  );

  extracted_phone := NEW.raw_user_meta_data->>'phone';

  -- 1. Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    avatar_url,
    phone,
    role,
    status,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    extracted_name,
    NULL,
    extracted_avatar,
    extracted_phone,
    'user',
    'active',
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    language,
    theme,
    autoplay,
    email_notifications
  )
  VALUES (
    NEW.id,
    'bn',
    'dark',
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user trigger error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
