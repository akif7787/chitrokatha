-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Supabase PostgreSQL Initial Migration
-- Migration: 20261005000000_initial_schema.sql
-- Scope: Foundational Tables, RLS, Auth Triggers, Admin Role Security
-- ==============================================================================

-- 1. Enable pgcrypto / uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. Foundational Tables
-- ==============================================================================

-- PROFILES TABLE
-- References auth.users(id) with cascading deletion
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  country TEXT DEFAULT 'Bangladesh',
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'bn' CHECK (language IN ('bn', 'en')),
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  autoplay BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WATCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie',
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_watchlist_content UNIQUE (user_id, content_id)
);

-- FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_favorites_content UNIQUE (user_id, content_id)
);

-- USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. Indexes for Query Performance & Lookups
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_content ON public.watch_history(content_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_logs(created_at DESC);

-- ==============================================================================
-- 4. Helper Security Functions (SECURITY DEFINER)
-- ==============================================================================

-- Check if current authenticated user has admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role IN ('admin', 'super_admin') AND status = 'active'
  );
$$;

-- Check if current authenticated user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role = 'super_admin' AND status = 'active'
  );
$$;

-- ==============================================================================
-- 5. Automatic Profile & Preferences Creation Trigger
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(digest(NEW.email, 'sha256'), 'hex')
  );

  extracted_phone := NEW.raw_user_meta_data->>'phone';

  -- 1. Insert into public.profiles
  -- SECURITY NOTE: Always default to role = 'user' and status = 'active'
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
    -- Prevent auth signup failure if profile insert encounters non-fatal issue
    RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. Role Escalation Prevention Trigger
-- Prevents ordinary users from modifying their own role or status
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role or status is being changed
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Only allow if current calling session is an active admin or super_admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role or status.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ==============================================================================
-- 7. Row Level Security (RLS) Enablement & Strict Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
-- Users can view their own profile; Admins can view all profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Users can update only their own profile (trigger blocks role/status elevation)
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Inserts are handled by trigger, but admins can also insert if needed
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- USER PREFERENCES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "user_preferences_select_policy"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_policy"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_policy"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_delete_policy"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- WATCH HISTORY POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "watch_history_select_policy"
  ON public.watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "watch_history_insert_policy"
  ON public.watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watch_history_update_policy"
  ON public.watch_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watch_history_delete_policy"
  ON public.watch_history FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- WATCHLIST POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "watchlist_select_policy"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "watchlist_insert_policy"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist_delete_policy"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- FAVORITES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "favorites_select_policy"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_policy"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_policy"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- USER NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "user_notifications_select_policy"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_notifications_update_policy"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- ADMIN ACTIVITY LOGS POLICIES
-- -----------------------------------------------------------------------------
-- Strictly admin and super_admin access only
CREATE POLICY "admin_logs_select_policy"
  ON public.admin_activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_logs_insert_policy"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
