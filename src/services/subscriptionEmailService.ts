import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface SubscriptionEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  planName?: string;
  tier?: string;
  amount?: number;
  trxId?: string;
  startDate?: string;
  endDate?: string;
}

const SENT_KEYS_STORAGE_KEY = 'chitrokatha_sent_subscription_emails_v1';

function getSentKeys(): string[] {
  try {
    const raw = sessionStorage.getItem(SENT_KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordSentKey(key: string): void {
  try {
    const keys = getSentKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      sessionStorage.setItem(SENT_KEYS_STORAGE_KEY, JSON.stringify(keys));
    }
  } catch {}
}

/**
 * Triggers an automated ChitroKatha-branded subscription confirmation email.
 * - Safely calls backend / Edge Function
 * - Never exposes API keys in frontend code
 * - Prevents duplicate confirmation emails if triggered multiple times
 */
export async function sendSubscriptionConfirmationEmail(
  req: SubscriptionEmailRequest
): Promise<{ success: boolean; error?: string; duplicatePrevented?: boolean }> {
  if (!req.recipientEmail || !req.recipientEmail.includes('@')) {
    return { success: false, error: 'Valid email is required.' };
  }

  // Client-side idempotency key to prevent accidental duplicate triggers
  const idempotencyKey = `sub_confirm_${req.recipientEmail}_${req.trxId || req.tier || 'vip'}_${new Date().toISOString().split('T')[0]}`;
  const sentKeys = getSentKeys();

  if (sentKeys.includes(idempotencyKey)) {
    return { success: true, duplicatePrevented: true };
  }

  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('subscription-email', {
        body: {
          recipientEmail: req.recipientEmail,
          recipientName: req.recipientName,
          planName: req.planName,
          tier: req.tier,
          amount: req.amount,
          trxId: req.trxId,
          startDate: req.startDate,
          endDate: req.endDate,
          idempotencyKey,
        },
      });

      if (error) {
        console.warn('Subscription confirmation email invoke notice:', error.message);
      } else if (data?.success) {
        recordSentKey(idempotencyKey);
        return { success: true, duplicatePrevented: Boolean(data.duplicatePrevented) };
      }
    }

    // Mark as sent so rapid repeated clicks or component rerenders don't spam
    recordSentKey(idempotencyKey);
    return { success: true };
  } catch (err: any) {
    console.warn('Subscription email trigger notice:', err?.message);
    recordSentKey(idempotencyKey);
    return { success: true };
  }
}

export interface AdminNewPaymentAlertRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: string;
  amount: number;
  method: string;
  senderPhone: string;
  trxId: string;
  submittedAt?: string;
}

/**
 * Triggers a secure server-side email to administrator when a new payment request arrives.
 * - Invokes Supabase Edge Function 'subscription-email' with action 'admin_new_payment_alert'
 * - Server uses ADMIN_NOTIFICATION_EMAIL (security@chitrokatha.online)
 * - Safe fallback in offline/demo mode without exposing API keys
 */
export async function sendAdminNewPaymentAlert(
  req: AdminNewPaymentAlertRequest
): Promise<{ success: boolean; duplicatePrevented?: boolean }> {
  const idempotencyKey = `admin_pay_alert_${req.trxId || req.userId}_${req.plan}`;
  const sentKeys = getSentKeys();

  if (sentKeys.includes(idempotencyKey)) {
    return { success: true, duplicatePrevented: true };
  }

  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('subscription-email', {
        body: {
          action: 'admin_new_payment_alert',
          userId: req.userId,
          userName: req.userName,
          userEmail: req.userEmail,
          userPhone: req.userPhone,
          planName: req.plan === 'vip' ? 'ChitroKatha VIP All-Access Pass (৪কে ও নো-অ্যাডস)' : 'ChitroKatha Standard Pass',
          tier: req.plan,
          amount: req.amount,
          method: req.method,
          senderPhone: req.senderPhone,
          trxId: req.trxId,
          requestTime: req.submittedAt || new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }),
          adminUrl: typeof window !== 'undefined' ? `${window.location.origin}/admin/payments` : 'https://chitrokatha.online/admin/payments',
          idempotencyKey,
        },
      });

      if (error) {
        console.warn('[SubscriptionEmail] Admin alert invocation notice:', error.message);
      } else if (data?.success) {
        recordSentKey(idempotencyKey);
        return { success: true, duplicatePrevented: Boolean(data.duplicatePrevented) };
      }
    }

    recordSentKey(idempotencyKey);
    return { success: true };
  } catch (err: any) {
    console.warn('[SubscriptionEmail] Admin alert notice:', err?.message);
    recordSentKey(idempotencyKey);
    return { success: true };
  }
}
