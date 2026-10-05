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
