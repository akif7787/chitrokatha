-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Phase 2 Core Database Schema
-- Migration: 20261006000004_phase2_core_schema.sql
-- Scope: Support replies, Ad campaigns, Admin notifications, Storage bucket policies
-- ==============================================================================

-- 1. Support Messages Enhancement & Support Replies
ALTER TABLE public.support_messages 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON public.support_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_replies_created ON public.support_replies(created_at ASC);

ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- Support replies RLS: Users can view replies on tickets they own; admins can view all
DROP POLICY IF EXISTS "support_replies_select_policy" ON public.support_replies;
CREATE POLICY "support_replies_select_policy"
  ON public.support_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_messages m 
      WHERE m.id = ticket_id AND (m.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Support replies insert policy: Users can reply to their own tickets; admins can reply to any
DROP POLICY IF EXISTS "support_replies_insert_policy" ON public.support_replies;
CREATE POLICY "support_replies_insert_policy"
  ON public.support_replies FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    (auth.uid() IS NOT NULL AND sender_role = 'user' AND EXISTS (
      SELECT 1 FROM public.support_messages m WHERE m.id = ticket_id AND m.user_id = auth.uid()
    ))
  );

-- 2. Advertisement Campaigns Table
CREATE TABLE IF NOT EXISTS public.advertisement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'pdf')),
  media_url TEXT NOT NULL,
  storage_path TEXT,
  target_url TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  placement TEXT NOT NULL CHECK (placement IN ('homepage', 'movie_page', 'drama_page', 'webseries_page', 'video_player', 'mobile', 'desktop', 'all')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON public.advertisement_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement ON public.advertisement_campaigns(placement);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON public.advertisement_campaigns(start_date, end_date);

ALTER TABLE public.advertisement_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can view active campaigns within validity period
DROP POLICY IF EXISTS "ad_campaigns_public_select" ON public.advertisement_campaigns;
CREATE POLICY "ad_campaigns_public_select"
  ON public.advertisement_campaigns FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR
    (status = 'active' AND CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date)
  );

-- Only admins can insert, update, or delete ad campaigns
DROP POLICY IF EXISTS "ad_campaigns_admin_modify" ON public.advertisement_campaigns;
CREATE POLICY "ad_campaigns_admin_modify"
  ON public.advertisement_campaigns FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Admin Notifications Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'support' CHECK (type IN ('support', 'payment', 'system', 'user')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin notifications RLS: Admins have full access
DROP POLICY IF EXISTS "admin_notifications_policy" ON public.admin_notifications;
CREATE POLICY "admin_notifications_policy"
  ON public.admin_notifications FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Support ticket update trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_support_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_messages_updated ON public.support_messages;
CREATE TRIGGER trg_support_messages_updated
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_support_message_updated_at();

-- 4. Storage Bucket Setup & Policies for Advertisements
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisements',
  'advertisements',
  true,
  52428800, -- 50 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm'];

-- Storage RLS: Public read access
DROP POLICY IF EXISTS "Public read advertisements" ON storage.objects;
CREATE POLICY "Public read advertisements"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertisements');

-- Storage RLS: Admins can upload, update, delete advertisement files
DROP POLICY IF EXISTS "Admin upload advertisements" ON storage.objects;
CREATE POLICY "Admin upload advertisements"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'advertisements' AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Admin update advertisements" ON storage.objects;
CREATE POLICY "Admin update advertisements"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'advertisements' AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role'))
  WITH CHECK (bucket_id = 'advertisements' AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Admin delete advertisements" ON storage.objects;
CREATE POLICY "Admin delete advertisements"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'advertisements' AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role'));

-- 5. Realtime Publication Enablement
ALTER TABLE public.support_replies REPLICA IDENTITY FULL;
ALTER TABLE public.advertisement_campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_replies'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_replies;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'advertisement_campaigns'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.advertisement_campaigns;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
  END IF;
END $$;

-- 6. Schema Grants for anon, authenticated and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

GRANT SELECT ON TABLE public.advertisement_campaigns TO anon;
GRANT SELECT ON TABLE public.support_messages TO anon;
