-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — Allow service_role caller in admin approval/rejection RPCs
-- Migration: 20261006000003_service_role_rpc_support.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_approve_payment(
  target_payment_id UUID,
  admin_note TEXT DEFAULT NULL
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
  
  -- Support service_role administrative execution
  IF v_admin_id IS NULL AND (auth.role() = 'service_role' OR current_user = 'service_role') THEN
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
  END IF;

  -- Strict Admin Verification
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
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
    target_payment_id,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = 'active',
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    payment_id = EXCLUDED.payment_id,
    updated_at = now();

  -- 3. Log administrative audit trail
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
      'trx_id', v_payment.trx_id,
      'user_id', v_payment.user_id,
      'plan', v_payment.plan,
      'amount', v_payment.amount,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'reason', admin_note
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', target_payment_id,
    'user_id', v_payment.user_id,
    'plan', v_payment.plan,
    'status', 'approved',
    'start_date', v_start_date,
    'end_date', v_end_date
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_payment(
  target_payment_id UUID,
  admin_note TEXT DEFAULT NULL
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
  
  -- Support service_role administrative execution
  IF v_admin_id IS NULL AND (auth.role() = 'service_role' OR current_user = 'service_role') THEN
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
  END IF;

  -- Strict Admin Verification
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
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
    RETURN jsonb_build_object('success', false, 'error', 'Cannot reject an already approved payment.');
  END IF;

  -- 1. Update payment request status
  UPDATE public.payment_requests
  SET 
    status = 'rejected',
    notes = COALESCE(admin_note, notes),
    reviewed_at = now(),
    reviewed_by = v_admin_id
  WHERE id = target_payment_id;

  -- 2. Log administrative audit trail
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
