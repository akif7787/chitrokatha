import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();
  const { language } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authModalMode === 'register') {
      if (!name.trim()) {
        setError(language === 'bn' ? 'দয়া করে আপনার নাম লিখুন' : 'Please enter your name');
        return;
      }
      if (!email.trim() && !phone.trim()) {
        setError(language === 'bn' ? 'ইমেইল বা মোবাইল নম্বর দিন' : 'Please provide email or phone');
        return;
      }
      register(name, email || `${phone}@chitrokatha.com`, phone);
    } else {
      if (!email.trim()) {
        setError(language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর দিন' : 'Please provide email or phone');
        return;
      }
      login(email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsAuthModalOpen(false)} />

      <div className="relative z-10 w-full max-w-md bg-[#0d0f15] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-amber-500 flex items-center justify-center text-white font-cinzel font-bold text-sm shadow-md shadow-rose-950/40">
              চ
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">
                {authModalMode === 'login'
                  ? (language === 'bn' ? 'চিত্রকথায় লগইন' : 'Sign In to ChitroKatha')
                  : (language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'আপনার পছন্দের চলচ্চিত্র ও নাটক উপভোগ করুন'
                  : 'Stream movies, series & natok seamlessly'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModalMode('login');
            }}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'login'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'লগইন' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModalMode('register');
            }}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'register'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'}</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email or Mobile'}</span>
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com / 017xxxxxxxx"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 active:scale-98 flex items-center justify-center gap-2"
          >
            <span>
              {authModalMode === 'login'
                ? (language === 'bn' ? 'লগইন করুন' : 'Sign In')
                : (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Benefits reminder */}
        <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'bn' ? 'ওয়াচলিস্ট ও দেখা সিনেমার হিস্ট্রি সংরক্ষণ' : 'Save Watchlist & Watch Progress'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'bn' ? 'যেকোনো সময় প্রিমিয়ামে আপগ্রেড করার সুযোগ' : 'Upgrade to VIP Ad-Free anytime'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
