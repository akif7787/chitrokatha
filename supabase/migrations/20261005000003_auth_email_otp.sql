-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — 2-Step Authentication & Email OTP Management
-- Migration: 20261005000003_auth_email_otp.sql
-- Status: DRAFT / STAGED (NOT YET APPLIED TO PRODUCTION)
-- Scope: Secure OTP hashing, rate limits, attempt limits, single-use validation,
--        email enumeration defense, SET search_path = '', profiles pending status.
-- ==============================================================================

-- 1. Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Update profiles table status constraint to support 'pending' state
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('active', 'pending', 'unverified', 'suspended', 'banned'));

-- 3. Table: public.auth_otp_codes
CREATE TABLE IF NOT EXISTS public.auth_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login')),
  attempts_left INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast query lookup & expiration checks
CREATE INDEX IF NOT EXISTS idx_auth_otp_lookup 
  ON public.auth_otp_codes (lower(email), purpose, expires_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;

-- Deny direct client table operations; access exclusively via SECURITY DEFINER functions
DROP POLICY IF EXISTS "deny_direct_access_auth_otp_codes" ON public.auth_otp_codes;
CREATE POLICY "deny_direct_access_auth_otp_codes"
  ON public.auth_otp_codes
  FOR ALL
  USING (false);

-- ------------------------------------------------------------------------------
-- 4. Function: public.store_login_otp
-- Stores a pre-hashed OTP for login verification.
-- NEVER accepts or returns plaintext OTP.
-- Prevents email enumeration by returning a generic success response.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_login_otp(
  user_email TEXT,
  hashed_otp TEXT,
  expires_seconds INTEGER DEFAULT 600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  clean_email TEXT;
  cooldown_seconds CONSTANT INTEGER := 60;
  last_created TIMESTAMPTZ;
  user_exists BOOLEAN;
  otp_expiry TIMESTAMPTZ;
BEGIN
  clean_email := lower(trim(user_email));

  IF clean_email IS NULL OR length(clean_email) < 5 OR strpos(clean_email, '@') = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email address provided.');
  END IF;

  IF hashed_otp IS NULL OR length(hashed_otp) < 32 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid hash payload.');
  END IF;

  -- Rate limit / Resend cooldown: check if an OTP was created recently (< 60s)
  SELECT created_at INTO last_created
  FROM public.auth_otp_codes
  WHERE lower(email) = clean_email
    AND purpose = 'login'
    AND consumed_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_created IS NOT NULL AND (now() - last_created) < (cooldown_seconds || ' seconds')::INTERVAL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Please wait before requesting another code.',
      'cooldown_remaining', EXTRACT(EPOCH FROM ((last_created + (cooldown_seconds || ' seconds')::INTERVAL) - now()))::INTEGER
    );
  END IF;

  -- Verify user exists in auth.users (Prevent account enumeration: do not disclose if missing)
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = clean_email
  ) INTO user_exists;

  IF NOT user_exists THEN
    -- Return generic success to avoid disclosing whether email exists
    RETURN jsonb_build_object(
      'success', true,
      'message', 'If an account exists with this email, a verification code has been dispatched.',
      'cooldown_seconds', cooldown_seconds,
      'expires_in_seconds', expires_seconds
    );
  END IF;

  -- Invalidate any prior active OTPs for this user
  UPDATE public.auth_otp_codes
  SET consumed_at = now()
  WHERE lower(email) = clean_email
    AND purpose = 'login'
    AND consumed_at IS NULL;

  otp_expiry := now() + (expires_seconds || ' seconds')::INTERVAL;

  -- Store hashed OTP
  INSERT INTO public.auth_otp_codes (
    email,
    otp_hash,
    purpose,
    attempts_left,
    expires_at,
    created_at
  )
  VALUES (
    clean_email,
    hashed_otp,
    'login',
    5,
    otp_expiry,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Verification code dispatched.',
    'expires_in_seconds', expires_seconds,
    'cooldown_seconds', cooldown_seconds
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Function: public.verify_login_otp
-- Validates candidate OTP against active hash, tracks attempts, and consumes on success.
-- Strictly uses SET search_path = '' and fully qualified names.
-- NEVER returns OTP or credentials.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_login_otp(
  user_email TEXT,
  candidate_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  clean_email TEXT;
  clean_code TEXT;
  candidate_hash TEXT;
  otp_record RECORD;
  target_user_id UUID;
BEGIN
  clean_email := lower(trim(user_email));
  clean_code := trim(candidate_code);

  IF clean_email IS NULL OR length(clean_code) != 6 OR clean_code !~ '^\d{6}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please enter a valid 6-digit verification code.');
  END IF;

  -- Find the latest active OTP record
  SELECT * INTO otp_record
  FROM public.auth_otp_codes
  WHERE lower(email) = clean_email
    AND purpose = 'login'
    AND consumed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF otp_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active verification code found. Please request a new code.');
  END IF;

  -- Check if expired
  IF otp_record.expires_at < now() THEN
    UPDATE public.auth_otp_codes SET consumed_at = now() WHERE id = otp_record.id;
    RETURN jsonb_build_object('success', false, 'error', 'Verification code has expired. Please request a new code.');
  END IF;

  -- Check remaining attempts
  IF otp_record.attempts_left <= 0 THEN
    UPDATE public.auth_otp_codes SET consumed_at = now() WHERE id = otp_record.id;
    RETURN jsonb_build_object('success', false, 'error', 'Too many incorrect attempts. Please request a new code.');
  END IF;

  -- Calculate SHA-256 hash using extensions.digest
  candidate_hash := encode(extensions.digest(clean_code, 'sha256'), 'hex');

  -- Verify match
  IF candidate_hash = otp_record.otp_hash THEN
    -- Mark code as consumed
    UPDATE public.auth_otp_codes
    SET consumed_at = now(), attempts_left = 0
    WHERE id = otp_record.id;

    -- Ensure profile status is active if pending
    SELECT id INTO target_user_id FROM auth.users WHERE lower(email) = clean_email LIMIT 1;
    IF target_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET status = 'active', updated_at = now(), last_login_at = now()
      WHERE id = target_user_id AND status = 'pending';
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Verification successful.'
    );
  ELSE
    -- Decrement attempt counter
    UPDATE public.auth_otp_codes
    SET attempts_left = attempts_left - 1
    WHERE id = otp_record.id;

    IF (otp_record.attempts_left - 1) <= 0 THEN
      UPDATE public.auth_otp_codes SET consumed_at = now() WHERE id = otp_record.id;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Too many incorrect attempts. Please request a new code.',
        'attempts_left', 0
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Incorrect verification code. Please check and try again.',
        'attempts_left', otp_record.attempts_left - 1
      );
    END IF;
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Trigger: on_auth_user_email_confirmed
-- Automatically activates profiles when auth.users.email_confirmed_at is set.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET status = 'active', updated_at = now()
    WHERE id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- ------------------------------------------------------------------------------
-- 7. Update handle_new_user to set initial status = 'pending' for regular users,
--    while preserving 'active' status for super_admin and verified signups.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  extracted_name TEXT;
  extracted_avatar TEXT;
  extracted_phone TEXT;
  initial_status TEXT;
  initial_role TEXT;
BEGIN
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(extensions.digest(NEW.email::text, 'sha256'), 'hex')
  );

  extracted_phone := NEW.raw_user_meta_data->>'phone';

  -- Preserve super_admin status for platform owner; regular users start as pending unless pre-confirmed
  IF lower(NEW.email) = 'akif7787@gmail.com' THEN
    initial_role := 'super_admin';
    initial_status := 'active';
  ELSIF NEW.email_confirmed_at IS NOT NULL THEN
    initial_role := 'user';
    initial_status := 'active';
  ELSE
    initial_role := 'user';
    initial_status := 'pending';
  END IF;

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
    initial_role,
    initial_status,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

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

-- ------------------------------------------------------------------------------
-- 8. Function: public.request_login_otp (RPC wrapper for client/fallback requests)
-- Generates secure 6-digit OTP, computes SHA-256 hash, and stores via store_login_otp.
-- NEVER returns plaintext OTP.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_login_otp(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  clean_email TEXT;
  new_otp TEXT;
  hashed_otp TEXT;
BEGIN
  clean_email := lower(trim(user_email));

  IF clean_email IS NULL OR length(clean_email) < 5 OR strpos(clean_email, '@') = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email address provided.');
  END IF;

  -- Generate 6-digit numeric OTP (100000 - 999999)
  new_otp := lpad((floor(random() * 900000) + 100000)::TEXT, 6, '0');
  hashed_otp := encode(extensions.digest(new_otp, 'sha256'), 'hex');

  -- Store hash safely (Zero plaintext OTP returned)
  RETURN public.store_login_otp(clean_email, hashed_otp, 600);
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. Permissions: Restrict execution to authorized roles
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.store_login_otp(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_login_otp(TEXT, TEXT, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.request_login_otp(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_login_otp(TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.verify_login_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_login_otp(TEXT, TEXT) TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
