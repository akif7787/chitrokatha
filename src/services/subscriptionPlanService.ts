import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminSubscriptionPlan } from '../admin/types/adminTypes';
import { initialSubscriptionPlans } from '../admin/data/adminMockData';

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  duration_label: string;
  features: string[];
  is_active: boolean;
  badge?: string;
  resolution?: string;
  ad_free?: boolean;
}

/**
 * Fetch all active/admin subscription plans from public.subscription_plans
 * Dynamically computes real subscriber counts from user_subscriptions.
 */
export async function fetchSubscriptionPlans(): Promise<AdminSubscriptionPlan[]> {
  if (!isSupabaseConfigured()) {
    return initialSubscriptionPlans;
  }

  try {
    // 1. Fetch plans from database
    const { data: plansData, error: plansErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (plansErr || !plansData || plansData.length === 0) {
      console.warn('[SubscriptionPlanService] Error or empty plans in DB, fallback:', plansErr?.message);
      return initialSubscriptionPlans;
    }

    // 2. Fetch active subscriptions to compute real subscriber counts dynamically
    const { data: activeSubs } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('status', 'active');

    const subCounts = new Map<string, number>();
    if (activeSubs) {
      for (const s of activeSubs) {
        const tier = (s.tier || '').toLowerCase();
        subCounts.set(tier, (subCounts.get(tier) || 0) + 1);
      }
    }

    return plansData.map((p: any) => {
      // Map plan ID to tier for counts (e.g. plan-7d -> basic/trial, plan-30d -> standard, plan-365d -> vip)
      let count = 0;
      if (p.id.includes('365') || p.id.includes('vip') || p.name.toLowerCase().includes('diamond') || p.name.toLowerCase().includes('annual')) {
        count = subCounts.get('vip') || 0;
      } else if (p.id.includes('30') || p.id.includes('standard') || p.name.toLowerCase().includes('standard')) {
        count = subCounts.get('standard') || 0;
      } else if (p.id.includes('7') || p.id.includes('basic') || p.name.toLowerCase().includes('pass')) {
        count = subCounts.get('basic') || 0;
      }

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        durationDays: p.duration_days,
        durationLabel: p.duration_label,
        features: Array.isArray(p.features) ? p.features : [],
        isActive: Boolean(p.is_active),
        badge: p.badge || undefined,
        subscribersCount: count,
        resolution: p.resolution || '1080p FHD',
        adFree: Boolean(p.ad_free),
      };
    });
  } catch (err: any) {
    console.error('[SubscriptionPlanService] Error fetching plans:', err?.message);
    return initialSubscriptionPlans;
  }
}

/**
 * Create or update a subscription plan in database
 */
export async function saveSubscriptionPlan(plan: AdminSubscriptionPlan): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await (supabase.from('subscription_plans') as any).upsert({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration_days: plan.durationDays,
      duration_label: plan.durationLabel,
      features: plan.features,
      is_active: plan.isActive,
      badge: plan.badge || null,
      resolution: plan.resolution || '1080p FHD',
      ad_free: plan.adFree ?? true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Toggle plan active state in database
 */
export async function togglePlanActiveState(planId: string, currentActive: boolean): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await (supabase.from('subscription_plans') as any)
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
