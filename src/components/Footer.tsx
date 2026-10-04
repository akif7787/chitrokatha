import React, { useState } from 'react';
import {
  Film,
  Globe,
  Heart,
  Sparkles,
  Code2,
  Mail,
  Send,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ThemeToggle } from './ThemeToggle';
import { dispatchAppNotification } from '../context/NotificationContext';

interface FooterProps {
  onSelectTab: (tab: 'home' | 'bangla' | 'movies' | 'series' | 'favorites' | 'watchlist') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'already'>('idle');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    try {
      const stored = localStorage.getItem('chitrokatha_newsletter_emails');
      const list: string[] = stored ? JSON.parse(stored) : [];

      if (list.includes(cleanEmail)) {
        setNewsletterStatus('already');
        return;
      }

      list.push(cleanEmail);
      localStorage.setItem('chitrokatha_newsletter_emails', JSON.stringify(list));
      setNewsletterStatus('success');
      setNewsletterEmail('');

      // Dispatch real toast notification
      dispatchAppNotification({
        type: 'system',
        titleBn: '📬 নিউজলেটার সাবস্ক্রিপশন সম্পন্ন হয়েছে!',
        titleEn: '📬 Newsletter Subscribed Successfully!',
        messageBn: `"${cleanEmail}" ঠিকানায় চিত্রকথার নতুন রিলিজ ও প্ল্যাটফর্মের খবরের নিয়মিত আপডেট পাঠানো হবে।`,
        messageEn: `You will now receive regular updates on new releases and cinema news at "${cleanEmail}".`,
      });
    } catch {
      setNewsletterStatus('success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="border-t border-white/5 bg-[#06070a] text-slate-400 text-xs mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ==================================================== */}
        {/* Newsletter Signup Banner                             */}
        {/* ==================================================== */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-amber-950/20 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left Info Column */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-950/60">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white font-cinzel">
                    {language === 'bn'
                      ? 'নতুন সিনেমা ও প্ল্যাটফর্মের আপডেট পান'
                      : 'Stay Updated on New Releases & News'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase hidden sm:inline">
                    NEWSLETTER
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  {language === 'bn'
                    ? 'চিত্রকথায় নতুন বাংলা ও আন্তর্জাতিক সিনেমা, ওয়েব সিরিজ এবং প্ল্যাটফর্ম খবরের নোটিফিকেশন পেতে বিনামূল্যে সাবস্ক্রাইব করুন।'
                    : 'Subscribe for free to get weekly curated releases, early trailers, and exclusive cinema platform updates directly in your inbox.'}
                </p>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="w-full lg:w-auto shrink-0">
              {newsletterStatus === 'success' ? (
                <div className="px-5 py-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'ধন্যবাদ! আপনি সফলভাবে নিউজলেটার সাবস্ক্রাইব করেছেন।'
                      : 'Thank you! You are now subscribed to ChitroKatha updates.'}
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md w-full"
                >
                  <div className="relative flex-1 min-w-[240px]">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus !== 'idle') setNewsletterStatus('idle');
                      }}
                      placeholder={
                        language === 'bn'
                          ? 'আপনার ইমেইল দিন (user@gmail.com)'
                          : 'Enter your email (user@gmail.com)'
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 font-mono transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}</span>
                  </button>
                </form>
              )}

              {newsletterStatus === 'already' && (
                <p className="text-[11px] text-amber-400 mt-1.5 text-center sm:text-left">
                  {language === 'bn'
                    ? '⚠️ আপনি ইতিমধ্যে আমাদের নিউজলেটারে সাবস্ক্রাইব করে আছেন!'
                    : '⚠️ You are already subscribed to our newsletter!'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Main Footer Links & Info Grid                       */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <button
              type="button"
              onClick={() => {
                onSelectTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
              title="হোম পেজে ফিরে যান"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-cinzel font-bold text-xs shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform">
                চ
              </div>
              <span className="font-cinzel text-lg font-bold text-white tracking-wide group-hover:text-rose-400 transition-colors">
                চিত্রকথা · ChitroKatha
              </span>
            </button>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {language === 'bn'
                ? 'বাংলা ও বিশ্ব সিনেমার এক অনন্য মোহনা। সত্যজিৎ রায়ের চিরায়ত ক্লাসিক থেকে শুরু করে হালের হাওয়া, তুফান কিংবা আন্তর্জাতিক অস্কারজয়ী চলচ্চিত্র—সবকিছু এক প্ল্যাটফর্মে।'
                : 'A curated destination for Bengali & global cinema. From Satyajit Ray masterpieces to modern hits like Hawa, Toofan, and international cinematic jewels.'}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              {t('footerTribute')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {language === 'bn' ? 'বিভাগসমূহ' : 'Categories'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTab('bangla')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navBangla')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('movies')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navMovies')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('series')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navSeries')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('favorites')}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                  <span>{language === 'bn' ? 'টপ ফেভারিটস' : 'Top Favorites'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('watchlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('navWatchlist')}
                </button>
              </li>
              <li className="pt-1">
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/admin');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Language & Accessibility */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {language === 'bn' ? 'ভাষা ও থিম' : 'Language & Theme'}
            </h4>
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {language === 'bn' ? 'English' : 'বাংলা'}
                </span>
              </button>

              <ThemeToggle />
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              {language === 'bn'
                ? 'চিত্রকথা · কালজয়ী বাংলা ও আন্তর্জাতিক চলচ্চিত্রের ডিজিটাল আর্কাইভ।'
                : 'ChitroKatha · Curated digital cinema archive for Bengali & global cinema.'}
            </p>
          </div>
        </div>

        {/* Creator Attribution Section */}
        <div className="border-t border-white/10 pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-black border border-rose-500/30 text-xs shadow-lg shadow-rose-950/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-300">
                {language === 'bn' ? 'ক্রিয়েটর ও ডেভেলপার: ' : 'Created & Developed by '}
                <strong className="text-white font-extrabold tracking-wide font-cinzel text-sm bg-gradient-to-r from-rose-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                  Ahanaf Akif
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-slate-500">
            <span>{t('rightsReserved')} © 2026 ChitroKatha</span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              <span>{t('madeWithLove')}</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
