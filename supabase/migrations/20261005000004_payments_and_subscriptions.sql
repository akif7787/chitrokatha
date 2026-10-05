-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Payments & Subscriptions Security Architecture
-- Migration: 20261005000004_payments_and_subscriptions.sql
-- Scope: payment_requests, user_subscriptions, strict RLS, admin-only approval RPCs
-- ==============================================================================

-- 1. Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'vip')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('bkash', 'nagad', 'rocket', 'upay', 'card')),
  sender_phone TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_pending_user_trx UNIQUE (user_id, trx_id)
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'standard', 'vip')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  payment_id UUID REFERENCES public.payment_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for rapid lookups
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_trx ON public.payment_requests(trx_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. PAYMENT REQUESTS RLS POLICIES
-- Users can view their own payment requests; Admins can view all payment requests
DROP POLICY IF EXISTS "payment_requests_select_policy" ON public.payment_requests;
CREATE POLICY "payment_requests_select_policy"
  ON public.payment_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can submit a payment request for their own account, strictly with status = 'pending'
DROP POLICY IF EXISTS "payment_requests_insert_policy" ON public.payment_requests;
CREATE POLICY "payment_requests_insert_policy"
  ON public.payment_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending'
  );

-- Non-admin users are STRICTLY FORBIDDEN from updating payment status
-- Only authorized admins can update payment requests
DROP POLICY IF EXISTS "payment_requests_update_policy" ON public.payment_requests;
CREATE POLICY "payment_requests_update_policy"
  ON public.payment_requests FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete payment records
DROP POLICY IF EXISTS "payment_requests_delete_policy" ON public.payment_requests;
CREATE POLICY "payment_requests_delete_policy"
  ON public.payment_requests FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 6. USER SUBSCRIPTIONS RLS POLICIES
-- Users can view their own subscription status; Admins can view all
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_select_policy"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Normal users CANNOT insert or update subscriptions directly
-- Only admins or SECURITY DEFINER functions can modify subscriptions
DROP POLICY IF EXISTS "user_subscriptions_admin_modify_policy" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_admin_modify_policy"
  ON public.user_subscriptions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. Secure Admin RPC: Approve Payment and Activate Subscription
CREATE OR REPLACE FUNCTION public.admin_approve_payment(
  target_payment_id UUID,
  admin_note TEXT DEFAULT 'Payment verified by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_payment RECORD;
  v_duration_interval INTERVAL;
  v_start_date TIMESTAMPTZ := now();
  v_end_date TIMESTAMPTZ;
BEGIN
  v_admin_id := auth.uid();
  
  -- Strict Admin Verification
  IF NOT public.is_admin(v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required.');
  END IF;

  -- Fetch target payment request
  SELECT * INTO v_payment
  FROM public.payment_requests
  WHERE id = target_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment request not found.');
  END IF;

  IF v_payment.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment has already been approved.');
  END IF;

  -- Determine duration
  IF v_payment.plan = 'vip' THEN
    v_duration_interval := INTERVAL '365 days';
  ELSE
    v_duration_interval := INTERVAL '30 days';
  END IF;

  v_end_date := v_start_date + v_duration_interval;

  -- 1. Update payment request status
  UPDATE public.payment_requests
  SET 
    status = 'approved',
    notes = COALESCE(admin_note, notes),
    reviewed_at = now(),
    reviewed_by = v_admin_id
  WHERE id = target_payment_id;

  -- 2. Upsert user subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    start_date,
    end_date,
    payment_id,
    updated_at
  )
  VALUES (
    v_payment.user_id,
    v_payment.plan,
    'active',
    v_start_date,
    v_end_date,
    v_payment.id,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = 'active',
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    payment_id = EXCLUDED.payment_id,
    updated_at = now();

  -- 3. Log admin activity
  INSERT INTO public.admin_activity_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'approve_payment',
    'payment_request',
    target_payment_id::TEXT,
    jsonb_build_object(
      'amount', v_payment.amount,
      'plan', v_payment.plan,
      'trx_id', v_payment.trx_id,
      'user_id', v_payment.user_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', target_payment_id,
    'plan', v_payment.plan,
    'status', 'approved',
    'start_date', v_start_date,
    'end_date', v_end_date
  );
END;
$$;

-- 8. Secure Admin RPC: Reject Payment
CREATE OR REPLACE FUNCTION public.admin_reject_payment(
  target_payment_id UUID,
  admin_note TEXT DEFAULT 'Payment rejected by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_payment RECORD;
BEGIN
  v_admin_id := auth.uid();
  
  -- Strict Admin Verification
  IF NOT public.is_admin(v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required.');
  END IF;

  -- Fetch target payment request
  SELECT * INTO v_payment
  FROM public.payment_requests
  WHERE id = target_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment request not found.');
  END IF;

  -- Update payment request status to rejected
  UPDATE public.payment_requests
  SET 
    status = 'rejected',
    notes = COALESCE(admin_note, notes),
    reviewed_at = now(),
    reviewed_by = v_admin_id
  WHERE id = target_payment_id;

  -- Log admin activity
  INSERT INTO public.admin_activity_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'reject_payment',
    'payment_request',
    target_payment_id::TEXT,
    jsonb_build_object(
      'trx_id', v_payment.trx_id,
      'user_id', v_payment.user_id,
      'reason', admin_note
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', target_payment_id,
    'status', 'rejected'
  );
END;
$$;

-- 9. Table and Function Permissions
-- Note: Row Level Security (RLS) is fully active and protects actual row-level access.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payment_requests TO authenticated, service_role;
GRANT ALL ON TABLE public.user_subscriptions TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.admin_approve_payment(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(UUID, TEXT) TO authenticated, service_role;

