import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminCoupon } from '../admin/types/adminTypes';
import { initialCoupons } from '../admin/data/adminMockData';

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  type?: 'percent' | 'flat';
  value?: number;
  labelBn?: string;
  labelEn?: string;
  error?: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  discount: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'disabled';
  created_at?: string;
  updated_at?: string;
}

/**
 * Predefined fallback promo coupons
 */
const FALLBACK_COUPONS = [
  {
    codes: ['AKIF50', 'AKIF', 'AHANAF', 'AHANAFAKIF'],
    type: 'percent' as const,
    value: 50,
    labelBn: 'আহনাফ আকিফ ৫০% স্পেশাল ছাড়',
    labelEn: 'Ahanaf Akif Special 50% OFF',
  },
  {
    codes: ['CHITRO100', 'FREEVIP', 'FREE100'],
    type: 'percent' as const,
    value: 100,
    labelBn: '১০০% ফ্রি ভিআইপি ট্রায়াল অ্যাক্সেস',
    labelEn: '100% Free VIP Trial Access',
  },
  {
    codes: ['VIP20', 'DISCOUNT20'],
    type: 'percent' as const,
    value: 20,
    labelBn: '২০% সাশ্রয়ী স্পেশাল ছাড়',
    labelEn: '20% Special Savings',
  },
  {
    codes: ['WELCOME50'],
    type: 'percent' as const,
    value: 50,
    labelBn: 'নতুন সদস্য ৫০% ছাড়',
    labelEn: 'Welcome Member 50% OFF',
  },
  {
    codes: ['VIPSPECIAL'],
    type: 'percent' as const,
    value: 30,
    labelBn: 'ভিআইপি স্পেশাল ৩০% ছাড়',
    labelEn: 'VIP Special 30% OFF',
  },
  {
    codes: ['EID2026', 'EID100'],
    type: 'flat' as const,
    value: 100,
    labelBn: 'ঈদ স্পেশাল ১০০ টাকা ছাড়',
    labelEn: 'Eid Special ৳100 OFF',
  },
  {
    codes: ['CINEMA50', 'CHITRO50'],
    type: 'flat' as const,
    value: 50,
    labelBn: 'ফ্ল্যাট ৫০ টাকা ছাড়',
    labelEn: 'Flat ৳50 OFF',
  },
];

/**
 * Fetch all coupons from Supabase public.coupons for Admin View
 */
export async function fetchAdminCoupons(): Promise<AdminCoupon[]> {
  if (!isSupabaseConfigured()) {
    return initialCoupons;
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((c: any) => ({
        id: c.id,
        code: c.code,
        discount: c.discount,
        discountType: c.discount_type as 'percentage' | 'fixed',
        discountValue: Number(c.discount_value),
        usageLimit: c.usage_limit,
        usedCount: c.used_count || 0,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status as 'active' | 'expired' | 'disabled',
      }));
    } else if (error) {
      console.warn('[CouponService] Error fetching admin coupons:', error.message);
      return [];
    }
  } catch (err: any) {
    console.warn('[CouponService] Error fetching admin coupons:', err?.message);
    return [];
  }

  return [];
}

/**
 * Save or create a coupon in Supabase public.coupons
 */
export async function saveCoupon(coupon: AdminCoupon): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await (supabase.from('coupons') as any).upsert({
      id: coupon.id,
      code: coupon.code.trim().toUpperCase(),
      discount: coupon.discount,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      usage_limit: coupon.usageLimit,
      used_count: coupon.usedCount || 0,
      start_date: coupon.startDate,
      end_date: coupon.endDate,
      status: coupon.status,
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
 * Increment coupon usage count upon successful subscription redemption
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const norm = (code || '').trim().toUpperCase();
    const { data } = await supabase.from('coupons').select('id, used_count').eq('code', norm).maybeSingle();
    if (data) {
      await (supabase.from('coupons') as any)
        .update({ used_count: (data.used_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    }
  } catch {}
}

/**
 * Validates a coupon code entered manually by a user against Supabase DB and fallbacks.
 */
export async function validateCouponCodeAsync(
  rawCode: string,
  language: 'bn' | 'en' = 'bn'
): Promise<CouponValidationResult> {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return {
      valid: false,
      error: language === 'bn' ? 'দয়া করে একটি কুপন কোড লিখুন' : 'Please enter a coupon code',
    };
  }

  // 1. Check live Supabase public.coupons table
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (!error && data) {
        // Check active status
        if (data.status !== 'active') {
          return {
            valid: false,
            error: language === 'bn' ? 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।' : 'This coupon code has expired.',
          };
        }

        // Check date range
        const today = new Date().toISOString().split('T')[0];
        if (data.start_date && today < data.start_date) {
          return {
            valid: false,
            error: language === 'bn' ? 'এই কুপনটি এখনো সক্রিয় হয়নি।' : 'This coupon code is not active yet.',
          };
        }
        if (data.end_date && today > data.end_date) {
          return {
            valid: false,
            error: language === 'bn' ? 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।' : 'This coupon code has expired.',
          };
        }

        // Check usage limit
        if (data.usage_limit && data.used_count >= data.usage_limit) {
          return {
            valid: false,
            error: language === 'bn' ? 'এই কুপনের সর্বোচ্চ ব্যবহারের সীমা শেষ হয়েছে।' : 'This coupon has reached its usage limit.',
          };
        }

        const isPercent = data.discount_type === 'percentage';
        const val = Number(data.discount_value);
        return {
          valid: true,
          code: data.code,
          type: isPercent ? 'percent' : 'flat',
          value: val,
          labelBn: isPercent ? `${val}% স্পেশাল ছাড়` : `৳${val} ফ্ল্যাট ছাড়`,
          labelEn: isPercent ? `${val}% Special Discount` : `Flat ৳${val} OFF`,
        };
      }
    } catch (err: any) {
      console.warn('[CouponService] DB validation check failed:', err?.message);
    }
  }

  // 2. Check predefined active coupons fallback
  const fallbackMatch = FALLBACK_COUPONS.find((c) => c.codes.includes(code));
  if (fallbackMatch) {
    return {
      valid: true,
      code,
      type: fallbackMatch.type,
      value: fallbackMatch.value,
      labelBn: fallbackMatch.labelBn,
      labelEn: fallbackMatch.labelEn,
    };
  }

  return {
    valid: false,
    error:
      language === 'bn'
        ? 'প্রদত্ত কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।'
        : 'The coupon code entered is invalid or has expired.',
  };
}

/**
 * Synchronous wrapper for backwards compatibility
 */
export function validateCouponCode(
  rawCode: string,
  language: 'bn' | 'en' = 'bn'
): CouponValidationResult {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return {
      valid: false,
      error: language === 'bn' ? 'দয়া করে একটি কুপন কোড লিখুন' : 'Please enter a coupon code',
    };
  }

  // Check fallback list
  const fallbackMatch = FALLBACK_COUPONS.find((c) => c.codes.includes(code));
  if (fallbackMatch) {
    return {
      valid: true,
      code,
      type: fallbackMatch.type,
      value: fallbackMatch.value,
      labelBn: fallbackMatch.labelBn,
      labelEn: fallbackMatch.labelEn,
    };
  }

  return {
    valid: false,
    error:
      language === 'bn'
        ? 'প্রদত্ত কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।'
        : 'The coupon code entered is invalid or has expired.',
  };
}
