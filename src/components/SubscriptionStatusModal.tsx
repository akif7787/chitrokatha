import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Phone,
  Hash,
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentRequest } from '../types/user';
import { fetchUserAllPayments, fetchUserActiveSubscription } from '../services/paymentService';

export const SubscriptionStatusModal: React.FC = () => {
  const {
    isSubscriptionStatusModalOpen,
    setIsSubscriptionStatusModalOpen,
    user,
    openSubscriptionModal,
    openSupportModal,
    refreshSubscriptionStatus,
    isPremium
  } = useAuth();
  const { language } = useLanguage();

  const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (refreshSubscriptionStatus) {
        await refreshSubscriptionStatus();
      }
      const history = await fetchUserAllPayments(user.id);
      setPaymentHistory(history);
    } catch (err) {
      console.warn('Error loading subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSubscriptionStatusModalOpen && user?.id) {
      loadData();
    }
  }, [isSubscriptionStatusModalOpen, user?.id]);

  if (!isSubscriptionStatusModalOpen) return null;

  const currentTier = user?.tier || 'free';
  const pendingPayment = user?.pendingSubscription || paymentHistory.find((p) => p.status === 'pending');
  const latestPayment = paymentHistory[0] || pendingPayment;

  // Calculate remaining days
  let remainingDaysText = '';
  if (user?.subscriptionEndDate) {
    const endMs = new Date(user.subscriptionEndDate).getTime();
    const nowMs = Date.now();
    const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      remainingDaysText = language === 'bn' ? `${diffDays} দিন বাকি` : `${diffDays} days remaining`;
    } else {
      remainingDaysText = language === 'bn' ? 'মেয়াদ শেষ হয়েছে' : 'Expired';
    }
  }

  const getTierBadge = () => {
    if (currentTier === 'vip') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg shadow-amber-500/20">
          <Crown className="w-3.5 h-3.5 text-black" />
          VIP ALL-ACCESS
        </span>
      );
    }
    if (currentTier === 'standard') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/30 text-blue-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          STANDARD PASS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-white/5">
        FREE ACCOUNT
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsSubscriptionStatusModalOpen(false)} />

      <div className="relative z-10 w-full max-w-xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-['Cinzel',serif]">
                {language === 'bn' ? 'সাবস্ক্রিপশন ও পেমেন্ট স্ট্যাটাস' : 'Subscription & Payment Status'}
              </h3>
              <p className="text-xs text-zinc-400">
                {language === 'bn' ? 'আপনার বর্তমান প্ল্যান ও লেনদেন সংক্রান্ত তথ্য' : 'Real-time billing, tier validity & transaction verification'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadData}
              disabled={loading}
              title={language === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh status'}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsSubscriptionStatusModalOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'status'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'সারসংক্ষেপ (Overview)' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'পেমেন্ট হিস্ট্রি (History)' : 'Payment History'}
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-5 pr-1 text-sm custom-scrollbar">
          {activeTab === 'status' ? (
            <>
              {/* CURRENT SUBSCRIPTION CARD */}
              <div className="bg-gradient-to-b from-[#141724] to-[#0f111c] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 block mb-1">
                      {language === 'bn' ? 'বর্তমান সদস্যপদ' : 'Current Membership'}
                    </span>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {currentTier === 'vip'
                          ? 'ChitroKatha VIP All-Access'
                          : currentTier === 'standard'
                          ? 'ChitroKatha Standard'
                          : 'ফ্রি অ্যাকাউন্ট (Free Account)'}
                      </h4>
                    </div>
                  </div>
                  {getTierBadge()}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">{language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                    <span className={`font-semibold ${isPremium ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {isPremium ? (language === 'bn' ? 'সক্রিয় (ACTIVE)' : 'ACTIVE') : (language === 'bn' ? 'ফ্রি সংস্করণ' : 'Free Tier')}
                    </span>
                  </div>
                  {user?.subscriptionEndDate && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">{language === 'bn' ? 'মেয়াদ শেষ:' : 'Valid Until:'}</span>
                      <span className="font-semibold text-amber-300">
                        {new Date(user.subscriptionEndDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        {remainingDaysText && <span className="text-emerald-400">({remainingDaysText})</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Plan upgrade or renew action */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {currentTier === 'vip'
                      ? (language === 'bn' ? '৪কে আল্ট্রা এইচডি ও ১০০% বিজ্ঞাপনমুক্ত' : '4K Ultra HD & 100% Ad-Free')
                      : (language === 'bn' ? 'ভিআইপি মেম্বারশিপে আপগ্রেড করুন' : 'Upgrade to VIP for ad-free 4K')}
                  </span>
                  {currentTier !== 'vip' && (
                    <button
                      onClick={() => {
                        setIsSubscriptionStatusModalOpen(false);
                        openSubscriptionModal();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'আপগ্রেড করুন' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>

              {/* LATEST PAYMENT VERIFICATION STATUS CARD */}
              <div className="border border-white/10 rounded-2xl p-4 sm:p-5 bg-[#0e111a] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {language === 'bn' ? 'সর্বশেষ পেমেন্ট ভেরিফিকেশন' : 'Latest Payment Verification'}
                  </span>
                  {pendingPayment && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                      <Clock className="w-3 h-3" />
                      PENDING
                    </span>
                  )}
                </div>

                {latestPayment ? (
                  <div className="space-y-3">
                    {/* Status Banner */}
                    {latestPayment.status === 'pending' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-300">
                            {language === 'bn' ? 'পেমেন্ট যাচাইকরণ চলমান' : 'Payment Verification In Progress'}
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            {language === 'bn'
                              ? 'আমাদের অ্যাডমিন টিম আপনার ট্রানজেকশন আইডি যাচাই করছেন। অনুমোদন সম্পন্ন হলেই স্বয়ংক্রিয়ভাবে ভিআইপি সাবস্ক্রিপশন চালু হয়ে যাবে।'
                              : 'Payment verification is pending. Our admin team will review your request and activate your VIP subscription shortly.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {latestPayment.status === 'approved' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            {language === 'bn' ? 'পেমেন্ট অনুমোদিত ও সক্রিয়' : 'Payment Approved & Subscription Active'}
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            {language === 'bn'
                              ? 'আপনার পেমেন্ট সফলভাবে যাচাই ও সাবস্ক্রিপশন সক্রিয় করা হয়েছে। ধন্যবাদ!'
                              : 'Your transaction was verified by admin and your VIP membership is active.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {latestPayment.status === 'rejected' && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-rose-300">
                            {language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যাত হয়েছে' : 'Payment Request Rejected'}
                          </p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            {language === 'bn'
                              ? 'প্রদত্ত TrxID বা নম্বরের সাথে লেনদেন মেলানো যায়নি। অনুগ্রহ করে সঠিক TrxID দিয়ে পুনরায় চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।'
                              : 'Payment could not be verified. Please submit again with the correct TrxID or contact support.'}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsSubscriptionStatusModalOpen(false);
                                openSubscriptionModal();
                              }}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all"
                            >
                              {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Payment'}
                            </button>
                            <button
                              onClick={() => {
                                setIsSubscriptionStatusModalOpen(false);
                                openSupportModal();
                              }}
                              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
                            >
                              {language === 'bn' ? 'সাপোর্টে লিখুন' : 'Contact Support'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Details Table */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 rounded-xl p-3 border border-white/5">
                      <div>
                        <span className="text-zinc-500 block">{language === 'bn' ? 'প্ল্যান:' : 'Plan:'}</span>
                        <span className="text-white font-semibold">{latestPayment.plan.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">{language === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
                        <span className="text-amber-400 font-bold font-mono">৳{latestPayment.amount}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">{language === 'bn' ? 'পদ্ধতি:' : 'Method:'}</span>
                        <span className="text-white font-semibold uppercase">{latestPayment.method}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">{language === 'bn' ? 'প্রেরক নম্বর:' : 'Sender Phone:'}</span>
                        <span className="text-zinc-300 font-mono">{latestPayment.senderPhone}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/5">
                        <span className="text-zinc-500 block">{language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID:'}</span>
                        <span className="text-rose-400 font-mono font-bold tracking-wider select-all">{latestPayment.trxId}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-400 text-xs">
                    <p>{language === 'bn' ? 'এখনও কোনো পেমেন্ট অনুরোধ পাঠানো হয়নি।' : 'No payment requests submitted yet.'}</p>
                    <button
                      onClick={() => {
                        setIsSubscriptionStatusModalOpen(false);
                        openSubscriptionModal();
                      }}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-black font-bold text-xs shadow-md inline-flex items-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'ভিআইপি মেম্বারশিপ নিন' : 'Get VIP Membership'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* PAYMENT HISTORY TAB */
            <div className="space-y-3">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  {language === 'bn' ? 'কোনো পেমেন্ট হিস্ট্রি পাওয়া যায়নি।' : 'No payment history found.'}
                </div>
              ) : (
                paymentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.plan.toUpperCase()} PASS</span>
                        <span className="text-amber-400 font-mono font-semibold">৳{item.amount}</span>
                        <span className="text-zinc-400 uppercase">({item.method})</span>
                      </div>
                      <div className="text-zinc-400 font-mono mt-1 text-[11px]">
                        TrxID: <span className="text-zinc-200 select-all">{item.trxId}</span>
                      </div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') : ''}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {item.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          APPROVED
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          PENDING
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Support Prompt */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>{language === 'bn' ? 'পেমেন্ট নিয়ে কোনো প্রশ্ন আছে?' : 'Need billing support?'}</span>
          <button
            onClick={() => {
              setIsSubscriptionStatusModalOpen(false);
              openSupportModal();
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {language === 'bn' ? 'সাপোর্ট সেন্টারে লিখুন' : 'Contact Support'}
          </button>
        </div>
      </div>
    </div>
  );
};
