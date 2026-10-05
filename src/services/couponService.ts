export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  type?: 'percent' | 'flat';
  value?: number;
  labelBn?: string;
  labelEn?: string;
  error?: string;
}

interface InternalCoupon {
  codes: string[];
  type: 'percent' | 'flat';
  value: number;
  labelBn: string;
  labelEn: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
}

// Internal coupon definitions
// NEVER exposed directly to client UI suggestions or autocomplete dropdowns
const ACTIVE_COUPONS: InternalCoupon[] = [
  {
    codes: ['AKIF50', 'AKIF', 'AHANAF', 'AHANAFAKIF'],
    type: 'percent',
    value: 50,
    labelBn: 'আহনাফ আকিফ ৫০% স্পেশাল ছাড়',
    labelEn: 'Ahanaf Akif Special 50% OFF',
    isActive: true,
  },
  {
    codes: ['CHITRO100', 'FREEVIP', 'FREE100'],
    type: 'percent',
    value: 100,
    labelBn: '১০০% ফ্রি ভিআইপি ট্রায়াল অ্যাক্সেস',
    labelEn: '100% Free VIP Trial Access',
    isActive: true,
  },
  {
    codes: ['VIP20', 'DISCOUNT20'],
    type: 'percent',
    value: 20,
    labelBn: '২০% সাশ্রয়ী স্পেশাল ছাড়',
    labelEn: '20% Special Savings',
    isActive: true,
  },
  {
    codes: ['WELCOME50'],
    type: 'percent',
    value: 50,
    labelBn: 'নতুন সদস্য ৫০% ছাড়',
    labelEn: 'Welcome Member 50% OFF',
    isActive: true,
  },
  {
    codes: ['VIPSPECIAL'],
    type: 'percent',
    value: 30,
    labelBn: 'ভিআইপি স্পেশাল ৩০% ছাড়',
    labelEn: 'VIP Special 30% OFF',
    isActive: true,
  },
  {
    codes: ['CINEMA50', 'CHITRO50'],
    type: 'flat',
    value: 50,
    labelBn: 'ফ্ল্যাট ৫০ টাকা ছাড়',
    labelEn: 'Flat ৳50 OFF',
    isActive: true,
  },
];

/**
 * Validates a coupon code entered manually by a user.
 * Does not expose the list of valid coupons.
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

  // Check admin-created coupons stored in localStorage (if any)
  try {
    const storedAdminCoupons = localStorage.getItem('chitrokatha_admin_coupons_v1');
    if (storedAdminCoupons) {
      const parsed = JSON.parse(storedAdminCoupons);
      if (Array.isArray(parsed)) {
        const foundAdmin = parsed.find(
          (c: any) => c.code && c.code.trim().toUpperCase() === code
        );
        if (foundAdmin) {
          if (foundAdmin.status !== 'active') {
            return {
              valid: false,
              error:
                language === 'bn'
                  ? 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।'
                  : 'This coupon code has expired.',
            };
          }
          if (foundAdmin.usageLimit && foundAdmin.usedCount >= foundAdmin.usageLimit) {
            return {
              valid: false,
              error:
                language === 'bn'
                  ? 'এই কুপনের সর্বোচ্চ ব্যবহারের সীমা শেষ হয়েছে।'
                  : 'This coupon code has reached its usage limit.',
            };
          }
          return {
            valid: true,
            code: foundAdmin.code,
            type: foundAdmin.discountType === 'percentage' ? 'percent' : 'flat',
            value: Number(foundAdmin.discountValue) || 20,
            labelBn: `অ্যাডমিন প্রোমো (${foundAdmin.discount})`,
            labelEn: `Admin Promo (${foundAdmin.discount})`,
          };
        }
      }
    }
  } catch {}

  // Check predefined active coupons
  const matched = ACTIVE_COUPONS.find((c) => c.isActive && c.codes.includes(code));

  if (!matched) {
    return {
      valid: false,
      error:
        language === 'bn'
          ? 'প্রদত্ত কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।'
          : 'The coupon code entered is invalid or has expired.',
    };
  }

  // Check expiration if set
  if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
    return {
      valid: false,
      error:
        language === 'bn'
          ? 'এই কুপনটির মেয়াদ শেষ হয়ে গেছে।'
          : 'This coupon code has expired.',
    };
  }

  // Check usage limit if set
  if (matched.maxUses && (matched.usedCount || 0) >= matched.maxUses) {
    return {
      valid: false,
      error:
        language === 'bn'
          ? 'এই কুপনের ব্যবহারের সীমা শেষ হয়ে গেছে।'
          : 'This coupon has reached its usage limit.',
    };
  }

  return {
    valid: true,
    code,
    type: matched.type,
    value: matched.value,
    labelBn: matched.labelBn,
    labelEn: matched.labelEn,
  };
}
