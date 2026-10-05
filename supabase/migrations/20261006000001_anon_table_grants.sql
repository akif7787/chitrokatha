-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Grants for Support Messages, Payments & Subscriptions
-- Migration: 20261006000001_anon_table_grants.sql
-- ==============================================================================

-- Ensure anon role can query payment_requests and user_subscriptions through RLS
GRANT SELECT ON TABLE public.payment_requests TO anon;
GRANT SELECT ON TABLE public.user_subscriptions TO anon;

-- Ensure anon and authenticated roles have necessary access to support_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.support_messages TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.support_messages TO anon;
