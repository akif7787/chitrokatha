-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Phase 2 Root-Cause Production Infrastructure Fix
-- Migration: 20261007000000_phase2_root_cause_fixes.sql
-- Scope:
-- 1. Fix infinite recursion in public.profiles RLS policies (42P17)
-- 2. Restore advertisements storage bucket & storage RLS policies
-- 3. Grant table privileges on public.admin_notifications to authenticated (42501)
-- 4. Grant table privileges on public.admin_activity_logs to authenticated (42501)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX PROFILES RLS RECURSION (Eliminate 42P17)
-- ------------------------------------------------------------------------------
-- Previous policy in 20261006000005_phase2_fixes.sql executed a subquery directly
-- querying public.profiles, causing infinite recursion.
-- We replace it with public.is_admin(auth.uid()), which is a SECURITY DEFINER function.

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    (auth.uid() = id) 
    OR public.is_admin(auth.uid())
    OR (auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    (auth.uid() = id) 
    OR public.is_admin(auth.uid())
    OR (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.uid() = id) 
    OR public.is_admin(auth.uid())
    OR (auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (auth.uid() = id) 
    OR public.is_admin(auth.uid())
    OR (auth.role() = 'service_role')
  );

-- ------------------------------------------------------------------------------
-- 2. RESTORE ADVERTISEMENTS STORAGE BUCKET & RLS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisements',
  'advertisements',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm'];

-- Storage object policies
DROP POLICY IF EXISTS "Public read advertisements" ON storage.objects;
CREATE POLICY "Public read advertisements"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertisements');

DROP POLICY IF EXISTS "Admin upload advertisements" ON storage.objects;
CREATE POLICY "Admin upload advertisements"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'advertisements' 
    AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "Admin update advertisements" ON storage.objects;
CREATE POLICY "Admin update advertisements"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'advertisements' 
    AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  )
  WITH CHECK (
    bucket_id = 'advertisements' 
    AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "Admin delete advertisements" ON storage.objects;
CREATE POLICY "Admin delete advertisements"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'advertisements' 
    AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  );

-- ------------------------------------------------------------------------------
-- 3. ADMIN NOTIFICATIONS PRIVILEGES & RLS (Eliminate 42501)
-- ------------------------------------------------------------------------------
GRANT SELECT, UPDATE, INSERT ON TABLE public.admin_notifications TO authenticated;
GRANT ALL ON TABLE public.admin_notifications TO service_role;

DROP POLICY IF EXISTS "admin_notifications_policy" ON public.admin_notifications;
CREATE POLICY "admin_notifications_policy"
  ON public.admin_notifications FOR ALL
  USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 4. ADMIN ACTIVITY LOGS PRIVILEGES & RLS (Eliminate 42501)
-- ------------------------------------------------------------------------------
GRANT SELECT, INSERT ON TABLE public.admin_activity_logs TO authenticated;
GRANT ALL ON TABLE public.admin_activity_logs TO service_role;

DROP POLICY IF EXISTS "admin_activity_logs_policy" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_policy"
  ON public.admin_activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_activity_logs_insert_policy" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_insert_policy"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR auth.uid() = admin_user_id))
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- 5. REALTIME VERIFICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
    END IF;
  END IF;
END $$;
