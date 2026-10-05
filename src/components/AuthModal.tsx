import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { OtpVerificationView } from './OtpVerificationView';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    pendingAuth,
    isOtpRequired,
    submitOtp,
    resendOtp,
    cancelPendingAuth,
    signInUser,
    signUpUser,
    resetPasswordEmail,
    changePassword,
    authError,
    setAuthError
  } = useAuth();

  const { language } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setResetSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'register') {
        if (!fullName.trim()) {
          setAuthError(language === 'bn' ? 'দয়া করে আপনার পুরো নাম লিখুন' : 'Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          setAuthError(language === 'bn' ? 'একটি বৈধ ইমেইল ঠিকানা দিন' : 'Please provide a valid email');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setAuthError(
            language === 'bn'
              ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'
              : 'Password must be at least 6 characters'
          );
          setIsSubmitting(false);
          return;
        }

        await signUpUser(email, password, fullName, phone);
      } else if (authModalMode === 'login') {
        if (!email.trim() || !password) {
          setAuthError(language === 'bn' ? 'ইমেইল ও পাসওয়ার্ড প্রদান করুন' : 'Please enter email and password');
          setIsSubmitting(false);
          return;
        }

        await signInUser(email, password);
      } else if (authModalMode === 'forgot_password') {
        if (!email.trim()) {
          setAuthError(language === 'bn' ? 'আপনার অ্যাকাউন্টের ইমেইল দিন' : 'Please enter your account email');
          setIsSubmitting(false);
          return;
        }

        const res = await resetPasswordEmail(email);
        if (res.success) {
          setResetSuccessMessage(
            language === 'bn'
              ? 'আপনার ইমেইলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। ইনবক্স চেক করুন।'
              : 'Password reset link sent to your email. Please check your inbox.'
          );
        }
      } else if (authModalMode === 'reset_password') {
        if (password.length < 6) {
          setAuthError(language === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'New password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setAuthError(language === 'bn' ? 'উভয় পাসওয়ার্ড একই হতে হবে' : 'Passwords do not match');
          setIsSubmitting(false);
          return;
        }

        await changePassword(password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isOtpRequired && pendingAuth) {
      if (pendingAuth.mode === 'signup') {
        return language === 'bn' ? 'ইমেইল ভেরিফিকেশন' : 'Verify Your Email';
      }
      return language === 'bn' ? 'লগইন ভেরিফিকেশন' : 'Two-Step Verification';
    }
    switch (authModalMode) {
      case 'login':
        return language === 'bn' ? 'চিত্রকথায় লগইন' : 'Sign In to ChitroKatha';
      case 'register':
        return language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account';
      case 'forgot_password':
        return language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password';
      case 'reset_password':
        return language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Reset Your Password';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsAuthModalOpen(false)} />

      <div className="relative z-10 w-full max-w-md bg-[#0d0f15] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-amber-500 flex items-center justify-center text-white font-cinzel font-bold text-sm shadow-md shadow-rose-950/40">
              চ
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">{getTitle()}</h2>
              <p className="text-[11px] text-slate-400">
                {isOtpRequired && pendingAuth
                  ? language === 'bn'
                    ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন'
                    : 'Secure your ChitroKatha account'
                  : language === 'bn'
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

        {isOtpRequired && pendingAuth ? (
          <OtpVerificationView
            email={pendingAuth.email}
            purpose={pendingAuth.mode}
            onVerify={submitOtp}
            onResend={resendOtp}
            onBack={cancelPendingAuth}
          />
        ) : (
          <>
            {/* Tab switcher (Login / Register) */}
            {(authModalMode === 'login' || authModalMode === 'register') && (
              <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
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
                    setAuthError(null);
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
            )}

            {/* Error message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs animate-in fade-in">
                {authError}
              </div>
            )}

            {/* Success message */}
            {resetSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authModalMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {authModalMode !== 'reset_password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {authModalMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile (Optional)'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {authModalMode !== 'forgot_password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {authModalMode === 'reset_password'
                          ? language === 'bn'
                            ? 'নতুন পাসওয়ার্ড'
                            : 'New Password'
                          : language === 'bn'
                          ? 'পাসওয়ার্ড'
                          : 'Password'}{' '}
                        *
                      </span>
                    </label>

                    {authModalMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthModalMode('forgot_password');
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {authModalMode === 'reset_password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'} *
                    </span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {authModalMode === 'login'
                        ? language === 'bn'
                          ? 'লগইন করুন'
                          : 'Sign In'
                        : authModalMode === 'register'
                        ? language === 'bn'
                          ? 'অ্যাকাউন্ট তৈরি করুন'
                          : 'Create Account'
                        : authModalMode === 'forgot_password'
                        ? language === 'bn'
                          ? 'রিসেট লিঙ্ক পাঠান'
                          : 'Send Reset Link'
                        : language === 'bn'
                        ? 'পাসওয়ার্ড পরিবর্তন করুন'
                        : 'Update Password'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {authModalMode === 'forgot_password' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthModalMode('login');
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← {language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Sign In'}
                  </button>
                </div>
              )}
            </form>

            {/* Benefits reminder */}
            <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'ওয়াচলিস্ট ও দেখা সিনেমার হিস্ট্রি স্বয়ংক্রিয় সংরক্ষণ'
                    : 'Automatic Watchlist & Cloud History Sync'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'যেকোনো সময় প্রিমিয়ামে আপগ্রেড করার সুযোগ'
                    : 'Upgrade to VIP Ad-Free anytime'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
