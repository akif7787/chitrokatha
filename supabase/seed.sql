-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Admin Bootstrap & Seed Guidance
-- File: supabase/seed.sql
-- ==============================================================================
-- IMPORTANT SECURITY NOTICE:
-- Never hardcode production passwords or secrets in seed scripts.
--
-- HOW TO PROMOTE A REGISTERED USER TO SUPER ADMIN:
-- 1. Sign up a new user via the ChitroKatha web interface or Supabase Auth Dashboard.
-- 2. Run the SQL snippet below in the Supabase SQL Editor, replacing 'admin@chitrokatha.com'
--    with the actual registered email address:

/*
UPDATE public.profiles
SET
  role = 'super_admin',
  status = 'active',
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
);
*/

-- HOW TO VERIFY AN ADMIN'S PRIVILEGES:
/*
SELECT id, full_name, role, status
FROM public.profiles
WHERE role IN ('admin', 'super_admin');
*/
