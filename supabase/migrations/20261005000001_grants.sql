-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Table Permission Grants
-- Run this in Supabase SQL Editor to grant table-level access to authenticated & anon roles.
-- Note: Row Level Security (RLS) is fully active and protects actual row access.
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public tables accessible to authenticated users (RLS restricts to owned rows)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.watch_history TO authenticated;
GRANT ALL ON TABLE public.watchlist TO authenticated;
GRANT ALL ON TABLE public.favorites TO authenticated;
GRANT ALL ON TABLE public.user_notifications TO authenticated;
GRANT ALL ON TABLE public.admin_activity_logs TO authenticated;

-- Allow anon to select public profiles (RLS still filters rows via profiles_select_policy)
GRANT SELECT ON TABLE public.profiles TO anon;
