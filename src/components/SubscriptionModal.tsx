import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Copy,
  Smartphone,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Tag,
  Gift,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SubscriptionTier } from '../types/user';

interface CouponRule {
  codes: string[];
  type: 'percent' | 'flat';
  value: number;
  labelBn: string;
  labelEn: string;
}

const AVAILABLE_COUPONS: CouponRule[] = [
  {
    codes: ['AKIF', 'AKIF50', 'AHANAF', 'AHANAFAKIF'],
    type: 'percent',
    value: 50,
    labelBn: 'আহনাফ আকিফ ক্রিয়েটর ৫০% ছাড়',
    labelEn: 'Ahanaf Akif Creator 50% OFF',
  },
  {
    codes: ['CHITRO100', 'FREEVIP', 'FREE100'],
    type: 'percent',
    value: 100,
    labelBn: '১০০% ফ্রি ভিআইপি এক্সেস',
    labelEn: '100% Free VIP Trial Access',
  },
  {
    codes: ['VIP20', 'DISCOUNT20', 'EID2026'],
    type: 'percent',
    value: 20,
    labelBn: '২০% সাশ্রয়ী স্পেশাল ছাড়',
    labelEn: '20% Special Savings',
  },
  {
    codes: ['CINEMA50', 'CHITRO50'],
    type: 'flat',
    value: 50,
    labelBn: 'ফ্ল্যাট ৫০ টাকা ছাড়',
    labelEn: 'Flat ৳50 OFF',
  },
];

interface AppliedCoupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  labelBn: string;
  labelEn: string;
}

export const SubscriptionModal: React.FC = () => {
  const {
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    user,
    submitSubscriptionPayment,
    approvePendingSubscription,
    upgradeSubscription,
  } = useAuth();
  const { language } = useLanguage();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('vip');
  const [paymentStep, setPaymentStep] = useState<'plans' | 'sendmoney' | 'pending_confirmation'>('plans');
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'upay'>('bkash');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);

  // Coupon state (Activated upon reaching payment step)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const PAYMENT_NUMBER = '01643442518';

  if (!isSubscriptionModalOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1: User picks plan -> transitions to payment step where coupon code option appears
  const handleSelectPlan = (chosen: SubscriptionTier) => {
    setSelectedTier(chosen);
    setPaymentStep('sendmoney');
  };

  // Base pricing
  const getBaseAmount = (planTier: SubscriptionTier = selectedTier) => (planTier === 'vip' ? 499 : 99);

  // Discount calculation
  const getDiscountAmount = (planTier: SubscriptionTier = selectedTier) => {
    if (!appliedCoupon) return 0;
    const base = getBaseAmount(planTier);
    if (appliedCoupon.type === 'percent') {
      return Math.round((base * appliedCoupon.value) / 100);
    }
    return Math.min(base, appliedCoupon.value);
  };

  // Final payable amount
  const getFinalAmount = (planTier: SubscriptionTier = selectedTier) => {
    const base = getBaseAmount(planTier);
    const discount = getDiscountAmount(planTier);
    return Math.max(0, base - discount);
  };

  // Apply coupon code (Available on payment step)
  const handleApplyCoupon = (codeToApply?: string) => {
    const raw = (codeToApply || couponInput).trim().toUpperCase();
    if (!raw) {
      setCouponError(language === 'bn' ? 'দয়া করে একটি কুপন কোড লিখুন' : 'Please enter a coupon code');
      setCouponSuccess(null);
      return;
    }

    const matched = AVAILABLE_COUPONS.find((c) => c.codes.includes(raw));

    if (matched) {
      setAppliedCoupon({
        code: raw,
        type: matched.type,
        value: matched.value,
        labelBn: matched.labelBn,
        labelEn: matched.labelEn,
      });
      setCouponInput(raw);
      setCouponError(null);
      setCouponSuccess(
        language === 'bn'
          ? `🎉 '${raw}' কুপন সফলভাবে প্রয়োগ করা হয়েছে! (${matched.labelBn})`
          : `🎉 Coupon '${raw}' applied successfully! (${matched.labelEn})`
      );
    } else {
      setCouponError(
        language === 'bn'
          ? 'ভুল কুপন কোড! অনুগ্রহ করে AKIF50, CHITRO100 বা VIP20 ব্যবহার করুন।'
          : 'Invalid coupon! Try AKIF50, CHITRO100, or VIP20.'
      );
      setCouponSuccess(null);
    }
  };

  // Remove coupon code
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  // Instant free VIP activation when 100% coupon applied
  const handleInstantFreeActivation = () => {
    upgradeSubscription(selectedTier);
    closeModal();
  };

  const handleSubmitTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (getFinalAmount() === 0) {
      handleInstantFreeActivation();
      return;
    }

    if (!senderPhone.trim()) {
      alert(language === 'bn' ? 'দয়া করে প্রেরক মোবাইল নম্বর দিন' : 'Please provide sender phone');
      return;
    }
    if (!trxId.trim()) {
      alert(language === 'bn' ? 'দয়া করে ট্রানজেকশন আইডি (TrxID) লিখুন' : 'Please provide TrxID');
      return;
    }

    submitSubscriptionPayment(selectedTier, getFinalAmount(), trxId, senderPhone, selectedMethod);
    setPaymentStep('pending_confirmation');
  };

  const closeModal = () => {
    setIsSubscriptionModalOpen(false);
    setPaymentStep('plans');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closeModal} />

      <div className="relative z-10 w-full max-w-3xl bg-[#0c0e15] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-cinzel tracking-wide">
                  {paymentStep === 'sendmoney'
                    ? language === 'bn'
                      ? 'পেমেন্ট ও সেন্ড মানি'
                      : 'Payment & Send Money'
                    : 'চিত্রকথা ভিআইপি মেম্বারশিপ'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  বিকাশ / নগদ / রকেট / উপায়
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {paymentStep === 'sendmoney'
                  ? language === 'bn'
                    ? 'কুপন কোড প্রয়োগ করে সেন্ড মানি সম্পন্ন করুন'
                    : 'Apply coupon code and complete send money'
                  : language === 'bn'
                  ? '১০০% বিজ্ঞাপনমুক্ত বিনোদন, ৪কে আল্ট্রা এইচডি এবং ডলবি সাউন্ড'
                  : '100% Ad-Free Cinematic Entertainment in 4K Ultra HD'}
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentStep === 'plans' ? (
          /* ==================================================== */
          /* Step 1: Clean Plan Selection (Coupon appears next)   */
          /* ==================================================== */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Plan 1: Standard Plan */}
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 hover:border-rose-500/40 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                      স্ট্যান্ডার্ড মাসিক
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      বিজ্ঞাপনমুক্ত
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl font-black text-white">৳৯৯</span>
                    <span className="text-xs text-slate-400 ml-1">/ ১ মাস</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                    <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>১০০% সম্পূর্ণ বিজ্ঞাপনমুক্ত</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>১০৮০p ফুল এইচডি কোয়ালিটি</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>২টি ডিভাইসে একসাথে দেখা যাবে</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('standard')}
                  className="mt-6 w-full py-2.5 bg-white/10 hover:bg-rose-600 hover:text-white text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>স্ট্যান্ডার্ড নিন (৳৯৯)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Plan 2: VIP All-Access Plan */}
              <div className="p-6 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/30 via-rose-950/20 to-black/80 flex flex-col justify-between relative shadow-xl shadow-amber-950/40">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-rose-600 rounded-full text-[10px] font-black uppercase text-black tracking-wider shadow-md">
                  ★ সেরা অফার (৫৮% সাশ্রয়)
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>ভিআইপি বার্ষিক মেম্বারশিপ</span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-amber-300">৳৪৯৯</span>
                      <span className="text-xs text-slate-400">/ ১ বছর</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-through">নিয়মিত মূল্য ৳১,১৯৮</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-200 pt-2 border-t border-amber-500/20">
                    <li className="flex items-center gap-2 text-amber-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>১০০% বিজ্ঞাপনমুক্ত + আর্লি প্রিমিয়ার</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>৪কে আল্ট্রা এইচডি (4K UHD) কোয়ালিটি</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>ডলবি ডিজিটাল সারাউন্ড সাউন্ড</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>৪টি ডিভাইসে একসাথে আনলিমিটেড স্ট্রিম</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('vip')}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-extrabold text-xs rounded-xl shadow-xl shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-black" />
                  <span>ভিআইপি নিন (৳৪৯৯ / ১ বছর)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>প্ল্যান পছন্দ করে পরবর্তী ধাপে পেমেন্ট ও কুপন ডিসকাউন্ট ব্যবহার করুন</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">০১৬৪৩৪৪২৫১৮</span>
            </div>
          </div>
        ) : paymentStep === 'sendmoney' ? (
          /* ==================================================== */
          /* Step 2: Payment Step — COUPON CODE APPEARS HERE!     */
          /* ==================================================== */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Selected Plan Bar & Back Button */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  {selectedTier === 'vip' ? <Crown className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-rose-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {selectedTier === 'vip' ? 'ভিআইপি বার্ষিক মেম্বারশিপ' : 'স্ট্যান্ডার্ড মাসিক মেম্বারশিপ'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      (মূল মূল্য: ৳{getBaseAmount()})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {selectedTier === 'vip' ? '১ বছর আনলিমিটেড ৪কে স্ট্রিমিং' : '১ মাস বিজ্ঞাপনমুক্ত ফুল এইচডি'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentStep('plans')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>প্ল্যান পরিবর্তন</span>
              </button>
            </div>

            {/* COUPON CODE BOX (Placed right here on the payment step) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-rose-950/20 to-black border border-amber-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-cinzel">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>{language === 'bn' ? 'কুপন কোড দিন (Promo / Coupon Code)' : 'Have a Promo / Coupon Code?'}</span>
                </div>
                {appliedCoupon && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {appliedCoupon.code} সক্রিয় (-৳{getDiscountAmount()})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="যেমন: AKIF50, CHITRO100, VIP20"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-amber-300 placeholder-slate-500 font-mono uppercase font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
                  </button>
                )}
              </div>

              {/* Clickable Quick Coupon Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  {language === 'bn' ? 'ক্লিক করে কুপন দিন:' : 'Click to use:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('AKIF50')}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                >
                  🏷️ AKIF50 (৫০% ছাড়)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('CHITRO100')}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  🎁 CHITRO100 (১০০% ফ্রি)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('VIP20')}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                >
                  ⚡ VIP20 (২০% ছাড়)
                </button>
              </div>

              {/* Success / Error Alerts */}
              {couponSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              {couponError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">মূল মূল্য: ৳{getBaseAmount()}</span>
                {appliedCoupon && (
                  <span className="text-emerald-400 font-bold font-mono">
                    কুপন ছাড় ({appliedCoupon.code}): -৳{getDiscountAmount()}
                  </span>
                )}
                <span className="text-amber-300 font-bold font-mono text-sm">
                  পরিশোধযোগ্য: ৳{getFinalAmount()}
                </span>
              </div>
            </div>

            {/* SEND MONEY OR INSTANT ACTIVATION */}
            {getFinalAmount() === 0 ? (
              /* 100% Free Activation (No money transfer needed) */
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/30 to-black border-2 border-emerald-500/60 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg">
                  <Gift className="w-7 h-7 text-emerald-400 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-cinzel">
                    ১০০% ফ্রি মেম্বারশিপ আনলক হয়েছে!
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    কুপন কোড: {appliedCoupon?.code} ({appliedCoupon?.labelBn})
                  </p>
                  <p className="text-xs text-slate-300">
                    কোনো টাকা বা সেন্ড মানি করতে হবে না। নিচের বাটনে ক্লিক করে সাথে সাথে ফ্রি অ্যাক্টিভেট করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstantFreeActivation}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950/60 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-black" />
                  <span>🎉 এখনই ফ্রি ভিআইপি সক্রিয় করুন</span>
                </button>
              </div>
            ) : (
              /* Regular Send Money Form */
              <form onSubmit={handleSubmitTrx} className="space-y-4">
                {/* Payment Number Callout Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-black border-2 border-amber-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                      সেন্ড মানি করার পার্সোনাল নম্বর (Send Money)
                    </span>
                    <div className="flex items-center gap-2">
                      {appliedCoupon && (
                        <span className="text-[10px] text-slate-400 line-through font-mono">
                          ৳{getBaseAmount()}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white bg-rose-600/40 px-2 py-0.5 rounded border border-rose-500/40 font-mono">
                        পরিশোধের পরিমাণ: ৳{getFinalAmount()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/70 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      <span className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider">
                        {PAYMENT_NUMBER}
                      </span>
                      <span className="text-[10px] text-slate-400">(পার্সোনাল)</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  {/* Supported Apps */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {(['bkash', 'nagad', 'rocket', 'upay'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMethod(m)}
                        className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                          selectedMethod === m
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m === 'bkash' && 'বিকাশ'}
                        {m === 'nagad' && 'নগদ'}
                        {m === 'rocket' && 'রকেট'}
                        {m === 'upay' && 'উপায়'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruction Steps */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">কিভাবে সেন্ড মানি করবেন:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>আপনার বিকাশ/নগদ/রকেট/উপায় অ্যাপে <strong>Send Money (সেন্ড মানি)</strong> অপশনে যান।</li>
                    <li>
                      প্রাপক নম্বর হিসেবে <strong>০১৬৪৩৪৪২৫১৮</strong> দিন এবং <strong>৳{getFinalAmount()}</strong> সেন্ড মানি করুন।
                    </li>
                    <li>টাকা পাঠানোর পর কনফার্মেশন এসএমএস থেকে <strong>Transaction ID (TrxID)</strong> কপি করে নিচের বক্সে দিন।</li>
                  </ol>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      প্রেরক মোবাইল নম্বর (Sender Number) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="০১XXXXXXXXX"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="যেমন: BL92X88K99"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('plans')}
                    className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    প্ল্যান পরিবর্তন
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black text-xs font-black rounded-xl transition-all shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>ট্রানজেকশন আইডি জমা দিন (৳{getFinalAmount()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ==================================================== */
          /* Step 3: Pending Confirmation View                    */
          /* ==================================================== */
          <div className="py-8 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border-2 border-amber-500/40 shadow-xl shadow-amber-950/60">
              <Clock className="w-8 h-8 text-amber-400 animate-spin" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-white font-cinzel">
                আপনার TrxID সফলভাবে জমা হয়েছে!
              </h3>
              <p className="text-xs text-amber-300 font-mono font-bold">
                TrxID: {trxId.toUpperCase()} (প্রেরক: {senderPhone}) — ৳{getFinalAmount()}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                অ্যাডমিন ০১৬৪৩৪৪২৫১৮ নম্বরে ট্রানজেকশন মিলিয়ে এক্সেপ্ট করলেই আপনার অ্যাকাউন্টে ভিআইপি মেম্বারশিপ ও ১০০% বিজ্ঞাপনমুক্ত স্ট্রিমিং চালু হয়ে যাবে।
              </p>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-4 border-t border-white/5 max-w-sm mx-auto space-y-2">
              <p className="text-[11px] text-slate-400 italic">
                (সিস্টেম ডেমো: এখনই ভিআইপি স্ট্যাটাস দেখতে নিচের বাটনে ক্লিক করুন)
              </p>
              <button
                type="button"
                onClick={() => {
                  approvePendingSubscription();
                  closeModal();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>অ্যাডমিন ভেরিফাই ও অনুমোদন করুন (Demo Approve)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
