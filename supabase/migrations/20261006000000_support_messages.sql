-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Support Messages & Realtime Publications
-- Migration: 20261006000000_support_messages.sql
-- Scope: support_messages table, RLS policies, indexes, and Realtime replication
-- ==============================================================================

-- 1. Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('payment', 'video', 'account', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own support messages; Admins can view all messages
DROP POLICY IF EXISTS "support_messages_select_policy" ON public.support_messages;
CREATE POLICY "support_messages_select_policy"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Authenticated users or guest visitors can insert a message
DROP POLICY IF EXISTS "support_messages_insert_policy" ON public.support_messages;
CREATE POLICY "support_messages_insert_policy"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (auth.uid() IS NULL)
  );

-- Only admins can update ticket status or add admin notes
DROP POLICY IF EXISTS "support_messages_update_policy" ON public.support_messages;
CREATE POLICY "support_messages_update_policy"
  ON public.support_messages FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete support messages
DROP POLICY IF EXISTS "support_messages_delete_policy" ON public.support_messages;
CREATE POLICY "support_messages_delete_policy"
  ON public.support_messages FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 5. Set Replica Identity for Realtime tracking
ALTER TABLE public.payment_requests REPLICA IDENTITY FULL;
ALTER TABLE public.user_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;

-- 6. Add tables to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    END IF;
  END IF;
END $$;
