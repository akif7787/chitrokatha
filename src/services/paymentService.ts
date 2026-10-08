import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PaymentRequest, SubscriptionTier } from '../types/user';
import { AdminPayment, PaymentStatus, PaymentMethod } from '../admin/types/adminTypes';
import { sendAdminNewPaymentAlert } from './subscriptionEmailService';

const STORED_PAYMENTS_KEY = 'chitrokatha_payment_requests_v1';
export const PAYMENT_STATUS_EVENT = 'chitrokatha_payment_status_changed';

export function notifyPaymentStatusChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PAYMENT_STATUS_EVENT));
  }
}

export function getStoredLocalPayments(): PaymentRequest[] {
  try {
    const raw = localStorage.getItem(STORED_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredLocalPayments(payments: PaymentRequest[]): void {
  try {
    localStorage.setItem(STORED_PAYMENTS_KEY, JSON.stringify(payments));
    notifyPaymentStatusChanged();
  } catch {}
}

export async function submitPaymentRequest(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  plan: SubscriptionTier;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'upay';
  senderPhone: string;
  trxId: string;
}): Promise<{ success: boolean; data?: PaymentRequest; error?: string }> {
  const cleanTrxId = params.trxId.trim().toUpperCase();

  // 1. Production Mode with Supabase
  if (isSupabaseConfigured()) {
    // A. Verify active Supabase auth session
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const sessionUser = sessionData?.session?.user;

    if (sessionErr || !sessionUser || !sessionUser.id) {
      return {
        success: false,
        error: 'Please log in and verify your account before submitting a payment request. (পেমেন্ট রিকোয়েস্ট পাঠানোর আগে অনুগ্রহ করে লগইন ও অ্যাকাউন্ট ভেরিফাই করুন।)'
      };
    }

    const effectiveUserId = sessionUser.id;

    // B. Check duplicate TrxID in database
    const { data: existingTrx } = await supabase
      .from('payment_requests')
      .select('id, status')
      .eq('trx_id', cleanTrxId)
      .maybeSingle();

    if (existingTrx) {
      return {
        success: false,
        error: 'এই ট্রানজেকশন আইডি (TrxID) দিয়ে ইতোমধ্যে একটি পেমেন্ট রিকোয়েস্ট জমা দেওয়া আছে। (A payment request with this TrxID already exists.)'
      };
    }

    // C. Strict database insert into public.payment_requests
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: effectiveUserId,
          user_email: params.userEmail || sessionUser.email || '',
          user_name: params.userName || sessionUser.user_metadata?.full_name || 'Subscriber',
          user_phone: params.userPhone || params.senderPhone.trim(),
          plan: params.plan,
          amount: params.amount,
          method: params.method,
          sender_phone: params.senderPhone.trim(),
          trx_id: cleanTrxId,
          status: 'pending'
        })
        .select()
        .single();

      if (error || !data) {
        console.error('[PaymentService] Database insert into payment_requests failed:', error?.message);
        // STRICT REQUIREMENT: DO NOT save locally. DO NOT mark pending locally.
        return {
          success: false,
          error: 'Payment request could not be submitted. Please try again. (পেমেন্ট রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।)'
        };
      }

      const newRequest: PaymentRequest = {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        userEmail: data.user_email,
        userPhone: data.user_phone,
        plan: data.plan as SubscriptionTier,
        amount: Number(data.amount),
        method: data.method,
        senderPhone: data.sender_phone,
        trxId: data.trx_id,
        status: data.status,
        submittedAt: data.created_at
      };

      // Dispatch server-side admin alert email
      sendAdminNewPaymentAlert({
        userId: newRequest.userId,
        userName: newRequest.userName,
        userEmail: newRequest.userEmail,
        userPhone: newRequest.userPhone,
        plan: newRequest.plan,
        amount: newRequest.amount,
        method: newRequest.method,
        senderPhone: newRequest.senderPhone,
        trxId: cleanTrxId,
        submittedAt: newRequest.submittedAt,
      }).catch((err) => console.warn('[PaymentService] Admin alert dispatch notice:', err));

      notifyPaymentStatusChanged();

      return { success: true, data: newRequest };
    } catch (err: any) {
      console.error('[PaymentService] Unexpected remote save exception:', err?.message);
      return {
        success: false,
        error: 'Payment request could not be submitted. Please try again. (পেমেন্ট রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।)'
      };
    }
  }

  // 2. Offline local preview mode (only if Supabase is completely unconfigured)
  const localList = getStoredLocalPayments();
  const existingPending = localList.find(
    (p) => p.status === 'pending' && (p.trxId === cleanTrxId || (p.userId === params.userId && p.plan === params.plan))
  );

  if (existingPending) {
    return {
      success: false,
      error: 'এই ট্রানজেকশন আইডি বা প্ল্যানের জন্য ইতোমধ্যে একটি রিকোয়েস্ট যাচাইাধীন রয়েছে। (A request is already pending verification.)'
    };
  }

  const demoRequest: PaymentRequest = {
    id: `pay_demo_${Date.now()}`,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    userPhone: params.userPhone,
    plan: params.plan,
    amount: params.amount,
    method: params.method,
    senderPhone: params.senderPhone.trim(),
    trxId: cleanTrxId,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  saveStoredLocalPayments([demoRequest, ...localList]);
  return { success: true, data: demoRequest };
}

export function mapPaymentRequestToAdminPayment(req: PaymentRequest): AdminPayment {
  return {
    id: req.id,
    trxId: req.trxId,
    userName: req.userName,
    userEmail: req.userEmail,
    userPhone: req.userPhone || req.senderPhone,
    userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.userName || req.userEmail)}`,
    planName: req.plan === 'vip' ? '365 Days Annual VIP' : '30 Days Standard',
    amount: req.amount,
    method: req.method as PaymentMethod,
    senderPhone: req.senderPhone,
    date: req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('bn-BD') : 'Just Now',
    status: req.status as PaymentStatus
  };
}

export async function fetchUserActiveSubscription(userId: string): Promise<{
  hasActiveSubscription: boolean;
  tier?: SubscriptionTier;
  startDate?: string;
  endDate?: string;
  status?: string;
} | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[PaymentService] Error fetching user subscription:', error.message);
      return null;
    }

    const now = new Date();
    const isExpired = data?.end_date ? new Date(data.end_date) <= now : false;

    if (data && data.status === 'active' && !isExpired) {
      return {
        hasActiveSubscription: true,
        tier: data.tier as SubscriptionTier,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
      };
    }
    return {
      hasActiveSubscription: false,
      tier: 'free',
      startDate: data?.start_date,
      endDate: data?.end_date,
      status: isExpired && data?.status === 'active' ? 'expired' : (data?.status || 'inactive'),
    };
  } catch (err: any) {
    console.warn('[PaymentService] Fetch active subscription error:', err?.message);
    return null;
  }
}

export async function fetchUserLatestPayment(userId: string): Promise<PaymentRequest | null> {
  if (!userId) return null;

  // 1. Try remote Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          userName: data.user_name,
          userEmail: data.user_email,
          userPhone: data.user_phone || '',
          plan: data.plan as SubscriptionTier,
          amount: Number(data.amount),
          method: data.method as 'bkash' | 'nagad' | 'rocket' | 'upay',
          senderPhone: data.sender_phone,
          trxId: data.trx_id,
          status: data.status as 'pending' | 'approved' | 'rejected',
          submittedAt: data.created_at,
        };
      }
    } catch (err: any) {
      console.warn('[PaymentService] Error fetching user latest payment from Supabase:', err?.message);
    }
    return null;
  }

  // 2. Fallback to local store
  const localList = getStoredLocalPayments();
  const found = localList.find((p) => p.userId === userId);
  return found || null;
}

export async function fetchUserAllPayments(userId: string): Promise<PaymentRequest[]> {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userEmail: d.user_email,
          userPhone: d.user_phone || '',
          plan: d.plan as SubscriptionTier,
          amount: Number(d.amount),
          method: d.method as 'bkash' | 'nagad' | 'rocket' | 'upay',
          senderPhone: d.sender_phone,
          trxId: d.trx_id,
          status: d.status as 'pending' | 'approved' | 'rejected',
          submittedAt: d.created_at,
        }));
      }
      return [];
    } catch (err: any) {
      console.warn('[PaymentService] Error fetching user all payments:', err?.message);
      return [];
    }
  }

  const localList = getStoredLocalPayments();
  return localList.filter((p) => p.userId === userId);
}

export async function adminApprovePaymentRequest(
  paymentId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('admin_approve_payment', {
        target_payment_id: paymentId,
        admin_note: note || 'Payment verified by admin'
      });
      if (error) {
        console.warn('[PaymentService] admin_approve_payment RPC warning:', error.message);
      } else if (data && !data.success) {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      console.warn('[PaymentService] admin_approve_payment error:', err?.message);
    }
  }

  // Update in local store
  const localList = getStoredLocalPayments();
  const targetReq = localList.find((p) => p.id === paymentId);
  const updated = localList.map((p) =>
    p.id === paymentId ? { ...p, status: 'approved' as const } : p
  );
  saveStoredLocalPayments(updated);

  // If the approved payment corresponds to currently active user profile in localStorage, activate their tier
  try {
    const rawUser = localStorage.getItem('chitrokatha_user_profile_v2');
    if (rawUser && targetReq) {
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser.id === targetReq.userId || parsedUser.email === targetReq.userEmail) {
        parsedUser.tier = targetReq.plan;
        parsedUser.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        parsedUser.pendingSubscription = undefined;
        localStorage.setItem('chitrokatha_user_profile_v2', JSON.stringify(parsedUser));
      }
    }
  } catch {}

  notifyPaymentStatusChanged();
  return { success: true };
}

export async function adminRejectPaymentRequest(
  paymentId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('admin_reject_payment', {
        target_payment_id: paymentId,
        admin_note: note || 'Payment rejected by admin'
      });
      if (error) {
        console.warn('[PaymentService] admin_reject_payment RPC warning:', error.message);
      } else if (data && !data.success) {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      console.warn('[PaymentService] admin_reject_payment error:', err?.message);
    }
  }

  // Update in local store
  const localList = getStoredLocalPayments();
  const updated = localList.map((p) =>
    p.id === paymentId ? { ...p, status: 'rejected' as const } : p
  );
  saveStoredLocalPayments(updated);
  notifyPaymentStatusChanged();

  return { success: true };
}
