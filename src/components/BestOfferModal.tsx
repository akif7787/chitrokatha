import React from 'react';
import { X, Crown, Sparkles, Check, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface BestOfferModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const BestOfferModal: React.FC<BestOfferModalProps> = ({
  isOpen = false,
  onClose,
}) => {
  const { openSubscriptionModal } = useAuth();
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleClaim = () => {
    handleClose();
    openSubscriptionModal();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-lg bg-gradient-to-b from-[#14121a] via-[#0d0f17] to-[#07080d] border-2 border-amber-500/60 rounded-3xl shadow-2xl p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[92vh]">
        {/* Top Glow Radiance */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-20"
          aria-label="Close offer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Offer Badge Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-[11px] uppercase tracking-wider shadow-lg shadow-amber-950/50">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>সীমিত সময়ের স্পেশাল অফার · ৫৮% ছাড়</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-wide leading-tight">
            চিত্রকথা ভিআইপি মেম্বারশিপে <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              ৫৮% মেগা ছাড়!
            </span>
          </h2>

          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            কোনো বিজ্ঞাপন ছাড়া ৪কে আল্ট্রা এইচডি কোয়ালিটিতে সকল সিনেমা, নাটক ও ওয়েব সিরিজ উপভোগ করুন আকর্ষণীয় অফারে।
          </p>
        </div>

        {/* Pricing Box */}
        <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              বার্ষিক ভিআইপি অল-অ্যাক্সেস
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">৳৪৯৯</span>
              <span className="text-xs text-slate-400">/ ১ বছর</span>
              <span className="text-xs text-slate-500 line-through">৳১,১৯৮</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold block">
              সাশ্রয় ৳৬৯৯
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              (মাসিক মাত্র ৳৪১!)
            </span>
          </div>
        </div>

        {/* Perks list */}
        <ul className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>১০০% সম্পূর্ণ বিজ্ঞাপনমুক্ত</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>৪কে আল্ট্রা এইচডি স্ট্রিমিং</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>ডলবি সারাউন্ড সাউন্ড</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>৪টি ডিভাইসে একসাথে দেখা যাবে</span>
          </li>
        </ul>

        {/* Payment reminder with number */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>বিকাশ / নগদ / রকেট / উপায় সেন্ড মানি:</span>
          <span className="font-mono text-amber-400 font-bold">০১৬৪৩৪৪২৫১৮</span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleClaim}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 text-black" />
            <span>অফারটি এখনই গ্রহণ করুন (৳৪৯৯)</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            পরে দেখব (Maybe Later)
          </button>
        </div>
      </div>
    </div>
  );
};
