-- ==============================================================================
-- ChitroKatha (চিত্রকথা) — P0 Subscription Lifecycle & Admin Plan Management Fix
-- Migration: 20261008000000_p0_subscription_management.sql
-- Scope:
-- 1. Fix prevent_role_escalation() trigger to allow trusted service_role operations
--    while preserving strict user block and admin self-protection.
-- 2. Create secure SECURITY DEFINER RPC public.admin_update_user_subscription()
--    for atomic subscription modifications directly by administrators.
-- 3. Ensure idempotency and grant execute privileges to authenticated and service_role.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX ROLE ESCALATION TRIGGER (Allow service_role backend operations)
-- ------------------------------------------------------------------------------
-- Root Cause: When admin-users Edge Function or server-side scripts update profiles
-- using the service_role key, auth.uid() is NULL. Calling is_admin(NULL) returned false,
-- raising 'Unauthorized: Users cannot modify their own role or status.'
-- Solution: Safely allow auth.role() = 'service_role'. For non-service_role callers,
-- preserve the existing check ensuring only active admins can update role/status.
-- Also protect admin self-demotion/deactivation.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Trusted backend service_role operations bypass this check
  IF (auth.role() = 'service_role') THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  -- 2. If role or status is being changed by an authenticated client
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Calling session must be an active admin or super_admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role or status.';
    END IF;

    -- Self-protection: An admin cannot accidentally demote or suspend/deactivate themselves
    IF auth.uid() = OLD.id THEN
      IF (NEW.role IS DISTINCT FROM OLD.role AND NEW.role NOT IN ('admin', 'super_admin'))
         OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'active') THEN
        RAISE EXCEPTION 'Unauthorized: Administrators cannot demote or suspend their own account.';
      END IF;
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ------------------------------------------------------------------------------
-- 2. SECURE ADMIN RPC: Manage User Subscription (Free / Standard / VIP)
-- ------------------------------------------------------------------------------
-- Allows authorized administrators to set any user's subscription tier without
-- mixing subscription updates with profile role/status modifications.
-- Sources duration from public.subscription_plans if available, or sensible defaults.

CREATE OR REPLACE FUNCTION public.admin_update_user_subscription(
  target_user_id UUID,
  target_plan TEXT,
  admin_note TEXT DEFAULT 'Subscription updated by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_start_date TIMESTAMPTZ := now();
  v_end_date TIMESTAMPTZ;
  v_duration_days INTEGER;
  v_plan_record RECORD;
BEGIN
  v_admin_id := auth.uid();

  -- Strict Authorization: Caller must be an active admin or service_role
  IF auth.role() != 'service_role' AND NOT public.is_admin(v_admin_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin privileges required.'
    );
  END IF;

  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user profile not found.'
    );
  END IF;

  -- Validate target plan input
  target_plan := lower(trim(target_plan));
  IF target_plan NOT IN ('free', 'standard', 'vip') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid plan. Allowed plans: free, standard, vip.'
    );
  END IF;

  -- ---------------------------------------------------------
  -- CASE A: Plan = FREE (Revoke / Cancel current subscription)
  -- ---------------------------------------------------------
  IF target_plan = 'free' THEN
    UPDATE public.user_subscriptions
    SET
      tier = 'free',
      status = 'cancelled',
      end_date = now(),
      updated_at = now()
    WHERE user_id = target_user_id;

    -- If no record existed, insert an explicit cancelled record
    IF NOT FOUND THEN
      INSERT INTO public.user_subscriptions (
        user_id,
        tier,
        status,
        start_date,
        end_date,
        updated_at
      )
      VALUES (
        target_user_id,
        'free',
        'cancelled',
        now(),
        now(),
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        tier = 'free',
        status = 'cancelled',
        end_date = now(),
        updated_at = now();
    END IF;

    -- Audit log
    IF v_admin_id IS NOT NULL THEN
      INSERT INTO public.admin_activity_logs (
        admin_user_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES (
        v_admin_id,
        'admin_cancel_subscription',
        'user_subscription',
        target_user_id::TEXT,
        jsonb_build_object(
          'target_plan', 'free',
          'note', admin_note,
          'timestamp', now()
        )
      );
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'user_id', target_user_id,
      'tier', 'free',
      'status', 'cancelled',
      'message', 'Subscription successfully cancelled. User is now on Free tier.'
    );
  END IF;

  -- ---------------------------------------------------------
  -- CASE B: Plan = STANDARD or VIP (Activate subscription)
  -- ---------------------------------------------------------
  -- Look up duration from public.subscription_plans if available
  SELECT duration_days INTO v_duration_days
  FROM public.subscription_plans
  WHERE is_active = true
    AND (
      (target_plan = 'vip' AND (id ILIKE '%365%' OR id ILIKE '%vip%' OR name ILIKE '%annual%'))
      OR
      (target_plan = 'standard' AND (id ILIKE '%30%' OR id ILIKE '%standard%' OR name ILIKE '%standard%'))
    )
  ORDER BY duration_days DESC
  LIMIT 1;

  -- Fallback defaults if table record not present
  IF v_duration_days IS NULL OR v_duration_days <= 0 THEN
    IF target_plan = 'vip' THEN
      v_duration_days := 365;
    ELSE
      v_duration_days := 30;
    END IF;
  END IF;

  v_end_date := v_start_date + (v_duration_days || ' days')::INTERVAL;

  -- Upsert single active subscription record per user
  INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    start_date,
    end_date,
    updated_at
  )
  VALUES (
    target_user_id,
    target_plan,
    'active',
    v_start_date,
    v_end_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = 'active',
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = now();

  -- Audit log
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_activity_logs (
      admin_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES (
      v_admin_id,
      'admin_activate_subscription',
      'user_subscription',
      target_user_id::TEXT,
      jsonb_build_object(
        'target_plan', target_plan,
        'duration_days', v_duration_days,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'note', admin_note,
        'timestamp', now()
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'tier', target_plan,
    'status', 'active',
    'start_date', v_start_date,
    'end_date', v_end_date,
    'duration_days', v_duration_days,
    'message', 'Subscription successfully updated to ' || upper(target_plan) || '.'
  );
END;
$$;

-- Grant execution permission
REVOKE ALL ON FUNCTION public.admin_update_user_subscription(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_subscription(UUID, TEXT, TEXT) TO authenticated, service_role;
