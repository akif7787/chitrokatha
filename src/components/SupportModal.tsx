import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldAlert,
  User,
  Mail,
  Phone,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportTicket } from '../types/user';

export const SupportModal: React.FC = () => {
  const { isSupportModalOpen, setIsSupportModalOpen, submitSupportTicket, supportTickets, user } = useAuth();
  const { language } = useLanguage();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('payment');
  const [message, setMessage] = useState('');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  if (!isSupportModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    submitSupportTicket(
      subject.trim() || 'জরুরী সাপোর্ট রিকোয়েস্ট',
      message,
      category
    );

    const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    setSubmittedTicketId(ticketNumber);
    setSubject('');
    setMessage('');
  };

  const whatsappText = encodeURIComponent(
    `হ্যালো চিত্রকথা অ্যাডমিন, আমার আইডি: ${user?.id || 'গেস্ট'}, নাম: ${user?.name || 'দর্শক'}। আমার সমস্যা: ${message || 'তাৎক্ষণিক সাহায্য প্রয়োজন'}`
  );
  const whatsappUrl = `https://wa.me/8801643442518?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsSupportModalOpen(false)} />

      <div className="relative z-10 w-full max-w-lg bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
                {language === 'bn' ? 'অ্যাডমিন হেল্প ও সাপোর্ট' : 'Instant Admin Support'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'আপনার যেকোনো সমস্যা অ্যাডমিনকে সরাসরি জানান'
                  : 'Send instant query with your User ID and phone'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Confirmation Card */}
        {submittedTicketId ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                আপনার বার্তা অ্যাডমিনের কাছে পৌঁছে গেছে!
              </h3>
              <p className="text-xs text-emerald-300 font-mono">
                টিকিট নম্বর: {submittedTicketId}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                আপনার ইউজার আইডি, মোবাইল নম্বর ও সমস্যার বিবরণ অ্যাডমিন ড্যাশবোর্ডে জমা হয়েছে। দ্রুত সমাধানের জন্য আপনি সরাসরি হোয়াটসঅ্যাপেও নক দিতে পারেন।
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>হোয়াটসঅ্যাপে যোগাযোগ (০১৬৪৩৪৪২৫১৮)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSubmittedTicketId(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                আরেকটি বার্তা পাঠান
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Auto-Attached User Details Preview Badge */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>মেসেজের সাথে স্বয়ংক্রিয়ভাবে পাঠানো হবে:</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                <div>
                  <span className="text-slate-500 block">User ID:</span>
                  <span className="text-white font-bold">{user ? `#${user.id.slice(-6)}` : 'গেস্ট (0)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ইমেইল:</span>
                  <span className="text-white truncate block">{user?.email || 'user@chitrokatha.com'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">নাম:</span>
                  <span className="text-white">{user?.name || 'দর্শক'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">সাপোর্ট নম্বর:</span>
                  <span className="text-rose-400 font-bold">০১৬৪৩৪৪২৫১৮</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সমস্যার ক্যাটাগরি (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="payment">পেমেন্ট / সাবস্ক্রিপশন / TrxID সংক্রান্ত</option>
                  <option value="video">ভিডিও প্লে হচ্ছে না বা লোডিং সমস্যা</option>
                  <option value="account">লগইন বা অ্যাকাউন্ট সমস্যা</option>
                  <option value="other">অন্যান্য সাহায্য</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  আপনার মোবাইল নম্বর (যেখানে অ্যাডমিন কল/মেসেজ দেবে)
                </label>
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="০১৭XXXXXXXX"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সমস্যার বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার কী সমস্যা হচ্ছে তা বিস্তারিত লিখুন..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 active:scale-98 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>মেসেজ সেন্ড করুন (Instant Send)</span>
              </button>
            </form>

            {/* Direct WhatsApp Quick Contact */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>জরুরী প্রয়োজনে হোয়াটসঅ্যাপ:</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 font-mono"
              >
                <span>০১৬৪৩৪৪২৫১৮</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
