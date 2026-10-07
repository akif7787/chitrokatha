-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Real-Time Support Lifecycle & Notifications Migration
-- Migration: 20261007000001_support_and_notifications_realtime.sql
-- Scope: 
--   1. Add in_progress_at TIMESTAMPTZ to support_messages (preserves existing rows)
--   2. Ensure user_notifications INSERT RLS policy allows admins/service role to send notifications
--   3. Ensure full REPLICA IDENTITY and publication for user_notifications, support_messages, support_replies
-- ==============================================================================

-- 1. ADD in_progress_at COLUMN TO support_messages (NULLABLE, SAFE FOR EXISTING DATA)
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ;

-- 2. USER NOTIFICATIONS RLS POLICIES FOR INSERTION
-- Allow authenticated admins to insert notifications to any user
-- Allow users to insert notifications for themselves (e.g. client triggers)
-- Allow service_role full access
DROP POLICY IF EXISTS "user_notifications_insert_policy" ON public.user_notifications;
CREATE POLICY "user_notifications_insert_policy"
  ON public.user_notifications FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR auth.uid() = user_id))
    OR auth.role() = 'service_role'
  );

-- Ensure users can only SELECT their own notifications
DROP POLICY IF EXISTS "user_notifications_select_policy" ON public.user_notifications;
CREATE POLICY "user_notifications_select_policy"
  ON public.user_notifications FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid()) 
    OR auth.role() = 'service_role'
  );

-- Ensure users can UPDATE their own notifications (e.g., mark as read)
DROP POLICY IF EXISTS "user_notifications_update_policy" ON public.user_notifications;
CREATE POLICY "user_notifications_update_policy"
  ON public.user_notifications FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid()) 
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid()) 
    OR auth.role() = 'service_role'
  );

-- Ensure users can DELETE their own notifications (e.g., clear all)
DROP POLICY IF EXISTS "user_notifications_delete_policy" ON public.user_notifications;
CREATE POLICY "user_notifications_delete_policy"
  ON public.user_notifications FOR DELETE
  USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid()) 
    OR auth.role() = 'service_role'
  );

-- 3. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notifications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.support_messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.support_replies TO authenticated, service_role;

-- 4. REPLICA IDENTITY FULL FOR REALTIME POSTGRES CHANGES
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_replies REPLICA IDENTITY FULL;

-- 5. REALTIME PUBLICATION VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_replies'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_replies;
    END IF;
  END IF;
END $$;
