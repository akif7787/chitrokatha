-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Phase 2 Master Production Fix
-- Migration: 20261006000005_phase2_fixes.sql
-- Scope: User directory email sync, get_admin_users RPC, subscription_plans table,
--        coupons table, RLS and Realtime publication
-- ==============================================================================

-- 1. Profiles email column & trigger sync
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email != u.email);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Non-recursive profiles RLS policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    (auth.uid() = id) 
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles admin_p 
      WHERE admin_p.id = auth.uid() AND admin_p.role IN ('admin', 'super_admin') AND admin_p.status = 'active'
    ))
    OR (auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    (auth.uid() = id) 
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles admin_p 
      WHERE admin_p.id = auth.uid() AND admin_p.role IN ('admin', 'super_admin') AND admin_p.status = 'active'
    ))
    OR (auth.role() = 'service_role')
  )
  WITH CHECK (
    (auth.uid() = id) 
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles admin_p 
      WHERE admin_p.id = auth.uid() AND admin_p.role IN ('admin', 'super_admin') AND admin_p.status = 'active'
    ))
    OR (auth.role() = 'service_role')
  );

-- 3. Secure Admin Users Fetch RPC Function
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  username TEXT,
  phone TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  sub_tier TEXT,
  sub_status TEXT,
  sub_start_date TIMESTAMPTZ,
  sub_end_date TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.email, u.email) AS email,
    p.full_name,
    p.username,
    p.phone,
    p.role,
    p.status,
    p.created_at,
    p.last_login_at,
    s.tier AS sub_tier,
    s.status AS sub_status,
    s.start_date AS sub_start_date,
    s.end_date AS sub_end_date
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN LATERAL (
    SELECT us.tier, us.status, us.start_date, us.end_date
    FROM public.user_subscriptions us
    WHERE us.user_id = p.id
    ORDER BY us.created_at DESC
    LIMIT 1
  ) s ON true
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated, service_role;

-- 4. Subscription Plans Table & Policies
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  duration_label TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  badge TEXT,
  resolution TEXT DEFAULT '1080p FHD',
  ad_free BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_plans_public_read" ON public.subscription_plans;
CREATE POLICY "subscription_plans_public_read"
  ON public.subscription_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "subscription_plans_admin_manage" ON public.subscription_plans;
CREATE POLICY "subscription_plans_admin_manage"
  ON public.subscription_plans FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. Coupons Table & Policies
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  discount TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  usage_limit INTEGER NOT NULL DEFAULT 500,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '60 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
CREATE POLICY "coupons_public_read"
  ON public.coupons FOR SELECT
  USING (status = 'active' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "coupons_admin_manage" ON public.coupons;
CREATE POLICY "coupons_admin_manage"
  ON public.coupons FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO authenticated, service_role;
GRANT ALL ON public.coupons TO authenticated, service_role;

-- 6. Ad Campaigns & Storage Bucket RLS Updates
DROP POLICY IF EXISTS "ad_campaigns_admin_modify" ON public.advertisement_campaigns;
CREATE POLICY "ad_campaigns_admin_modify"
  ON public.advertisement_campaigns FOR ALL
  USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin upload advertisements" ON storage.objects;
CREATE POLICY "Admin upload advertisements"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'advertisements' AND (public.is_admin(auth.uid()) OR auth.role() = 'service_role' OR auth.role() = 'authenticated'));

-- 7. Realtime Publication
ALTER TABLE public.subscription_plans REPLICA IDENTITY FULL;
ALTER TABLE public.coupons REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'subscription_plans'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_plans;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupons'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
    END IF;
  END IF;
END $$;
