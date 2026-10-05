import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  Globe,
  User,
  Crown,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Film,
  MessageSquare,
  HelpCircle,
  Tv,
  Clapperboard,
  Clock,
  Tag,
  Bookmark,
  MoreHorizontal,
  Bell,
  Check,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ContentType, ContentIndustry } from '../types/movie';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';

export type MainTab = 'home' | 'movies' | 'drama' | 'series' | 'favorites' | 'watchlist';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  selectedIndustryFilter: ContentIndustry | 'all';
  setSelectedIndustryFilter: (filter: ContentIndustry | 'all') => void;
  onOpenSearch: () => void;
  onOpenBestOffer?: () => void;
  onGoHome?: () => void;
  onSelectMovieById?: (movieId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedIndustryFilter,
  setSelectedIndustryFilter,
  onOpenSearch,
  onOpenBestOffer,
  onGoHome,
  onSelectMovieById,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { favorites } = useFavorites();
  const { watchlist } = useWatchlist();
  const {
    user,
    isLoggedIn,
    isPremium,
    logout,
    openLoginModal,
    openSubscriptionModal,
    openProfileModal,
    openRequestModal,
    openSupportModal,
  } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileUserDropdownOpen, setMobileUserDropdownOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [moreSubView, setMoreSubView] = useState<'main' | 'notifications'>('main');
  const [activeDropdown, setActiveDropdown] = useState<'movies' | 'drama' | 'series' | null>(null);

  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const mobileUserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
        setMoreSubView('main');
      }
      if (mobileUserRef.current && !mobileUserRef.current.contains(e.target as Node)) {
        setMobileUserDropdownOpen(false);
      }
    };
    if (mobileMoreOpen || mobileUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMoreOpen, mobileUserDropdownOpen]);

  const handleSelectCategory = (tab: MainTab, industry: ContentIndustry | 'all' = 'all') => {
    setActiveTab(tab);
    setSelectedIndustryFilter(industry);
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08090d]/95 backdrop-blur-md border-b border-white/5 transition-colors">
      <div className="w-full px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-16 flex items-center justify-between gap-2 xs:gap-4">
        
        {/* Brand wordmark - Click to immediately navigate to Home from anywhere */}
        <button
          type="button"
          onClick={() => {
            if (onGoHome) {
              onGoHome();
            } else {
              handleSelectCategory('home', 'all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 xs:gap-2.5 group shrink-0 cursor-pointer text-left focus:outline-none"
          title="হোম পেজে ফিরে যান"
          aria-label="ChitroKatha Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50 text-white font-cinzel font-bold text-sm tracking-wider group-hover:scale-105 group-hover:shadow-rose-600/50 transition-all shrink-0">
            চ
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-lg xs:text-xl font-extrabold tracking-wider text-white group-hover:text-rose-400 transition-colors whitespace-nowrap">
              চিত্রকথা
            </span>
          </div>
        </button>

        {/* Navigation links with Structured Categories & Sub-options */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium text-slate-300">
          {/* Home */}
          <button
            onClick={() => handleSelectCategory('home', 'all')}
            className={`transition-colors hover:text-white whitespace-nowrap pb-1 ${
              activeTab === 'home'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {t('navHome')}
          </button>

          {/* 1. Movie - Bangla, Hindi, English */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('movies')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => handleSelectCategory('movies', 'all')}
              className={`flex items-center gap-1 transition-colors hover:text-white whitespace-nowrap pb-1 ${
                activeTab === 'movies'
                  ? 'text-white border-b-2 border-rose-500 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <span>{language === 'bn' ? 'মুভি' : 'Movies'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeDropdown === 'movies' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleSelectCategory('movies', 'all')}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/5 rounded-xl font-semibold"
                >
                  সকল মুভি (All Movies)
                </button>
                <button
                  onClick={() => handleSelectCategory('movies', 'bangla')}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>বাংলা মুভি (Bangla)</span>
                  <span className="text-[10px] text-slate-500 font-mono">তুফান, হাওয়া</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('movies', 'hindi')}
                  className="w-full px-3 py-1.5 text-left text-xs text-amber-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>হিন্দি মুভি (Hindi)</span>
                  <span className="text-[10px] text-slate-500 font-mono">জওয়ান, 3 Idiots</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('movies', 'english')}
                  className="w-full px-3 py-1.5 text-left text-xs text-emerald-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>ইংরেজি / হলিউড (English)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Oppenheimer</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Drama - Bangla, Pakistani, Korean */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('drama')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => handleSelectCategory('drama', 'all')}
              className={`flex items-center gap-1 transition-colors hover:text-white whitespace-nowrap pb-1 ${
                activeTab === 'drama'
                  ? 'text-white border-b-2 border-rose-500 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <span>{language === 'bn' ? 'নাটক ও ড্রামা' : 'Drama'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeDropdown === 'drama' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleSelectCategory('drama', 'all')}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/5 rounded-xl font-semibold"
                >
                  সকল ড্রামা ও নাটক (All Drama)
                </button>
                <button
                  onClick={() => handleSelectCategory('drama', 'bangla')}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>বাংলা নাটক (Bangla Natok)</span>
                  <span className="text-[10px] text-slate-500 font-mono">বড় ছেলে</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('drama', 'pakistani')}
                  className="w-full px-3 py-1.5 text-left text-xs text-emerald-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>পাকিস্তানি ড্রামা (Pakistani)</span>
                  <span className="text-[10px] text-slate-500 font-mono">তেরে বিন</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('drama', 'korean')}
                  className="w-full px-3 py-1.5 text-left text-xs text-cyan-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>কে-ড্রামা (Korean Drama)</span>
                  <span className="text-[10px] text-slate-500 font-mono">CLOY, Squid Game</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Web Series - Bangla, Hindi, English */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('series')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => handleSelectCategory('series', 'all')}
              className={`flex items-center gap-1 transition-colors hover:text-white whitespace-nowrap pb-1 ${
                activeTab === 'series'
                  ? 'text-white border-b-2 border-rose-500 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <span>{language === 'bn' ? 'ওয়েব সিরিজ' : 'Web Series'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeDropdown === 'series' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleSelectCategory('series', 'all')}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/5 rounded-xl font-semibold"
                >
                  সকল সিরিজ (All Series)
                </button>
                <button
                  onClick={() => handleSelectCategory('series', 'bangla')}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>বাংলা সিরিজ (Bangla)</span>
                  <span className="text-[10px] text-slate-500 font-mono">কারাগার, মহানগর</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('series', 'hindi')}
                  className="w-full px-3 py-1.5 text-left text-xs text-amber-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>হিন্দি সিরিজ (Hindi)</span>
                  <span className="text-[10px] text-slate-500 font-mono">মির্জাপুর, ফ্যামিলি ম্যান</span>
                </button>
                <button
                  onClick={() => handleSelectCategory('series', 'english')}
                  className="w-full px-3 py-1.5 text-left text-xs text-emerald-300 hover:bg-white/5 rounded-xl flex items-center justify-between"
                >
                  <span>ইংরেজি সিরিজ (English)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Stranger Things</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Right Action Controls (Unchanged) */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Best Offer Button (Hidden on < md to preserve space) */}
          {onOpenBestOffer && (
            <button
              onClick={onOpenBestOffer}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all shadow-md active:scale-95 cursor-pointer"
              title={language === 'bn' ? '৫৮% স্পেশাল অফার দেখুন' : 'View 58% Special Promo'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'bn' ? 'সেরা অফার' : 'Best Offer'}</span>
            </button>
          )}

          {/* 4. VIP / Subscription Button (Adaptive size for mobile vs desktop) */}
          {user?.pendingSubscription ? (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-bold shadow-md hover:bg-amber-900/60 transition-all animate-pulse cursor-pointer"
              title="পেমেন্ট যাচাইকরণাধীন"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">{language === 'bn' ? 'যাচাই চলছে' : 'Pending'}</span>
            </button>
          ) : isPremium ? (
            <button
              onClick={openSubscriptionModal}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-600/20 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-bold shadow-md hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline font-mono">VIP</span>
            </button>
          ) : (
            <button
              onClick={openSubscriptionModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black text-[11px] sm:text-xs font-black shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-black" />
              <span className="hidden xs:inline">{language === 'bn' ? 'ভিআইপি নিন' : 'Go VIP'}</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            aria-label="Search movies"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Center Dropdown */}
          <NotificationDropdown onSelectMovieById={onSelectMovieById} />

          {/* Language Switcher */}
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <LanguageSwitcher compact={true} className="sm:hidden" />

          {/* Theme Toggle */}
          <ThemeToggle compact={true} />

          {/* User Account Button / Dropdown */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 pl-1.5 pr-1.5 sm:pr-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg bg-rose-600/30 object-cover shrink-0"
                />
                <span className="text-xs font-semibold text-white hidden md:inline max-w-[80px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#0f1118] border border-white/10 rounded-2xl shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
                      {isPremium ? '★ VIP সদস্য' : user.pendingSubscription ? 'যাচাইকরণাধীন' : 'ফ্রি অ্যাকাউন্ট'}
                    </div>
                  </div>

                  {/* User Details Link */}
                  <button
                    onClick={openProfileModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-rose-400" />
                    <span>ইউজার তথ্য ও এডিট প্রোফাইল</span>
                  </button>

                  {/* Movie Request Link */}
                  <button
                    onClick={openRequestModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Film className="w-4 h-4 text-rose-400" />
                    <span>মুভি ও নাটক রিকোয়েস্ট</span>
                  </button>

                  {/* Instant Admin Support */}
                  <button
                    onClick={openSupportModal}
                    className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>অ্যাডমিনকে মেসেজ / হেল্প</span>
                  </button>

                  {/* Subscription info */}
                  <button
                    onClick={openSubscriptionModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{isPremium ? 'মেম্বারশিপ তথ্য' : 'ভিআইপিতে আপগ্রেড'}</span>
                  </button>

                  {/* Favorites */}
                  <button
                    onClick={() => handleSelectCategory('favorites', 'all')}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span>আমার ফেভারিটস ({favorites.length})</span>
                  </button>

                  {/* Watchlist */}
                  <button
                    onClick={() => handleSelectCategory('watchlist', 'all')}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>আমার ওয়াচলিস্ট ({watchlist.length})</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 transition-colors font-medium border-t border-white/5 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'bn' ? 'লগইন' : 'Sign In'}</span>
            </button>
          )}
        </div>

        {/* Mobile Right Action Controls (Exactly 3 primary items: VIP/Offer, ⋯ More, Login/Profile) */}
        <div className="lg:hidden flex items-center gap-1.5 xs:gap-2 shrink-0">
          {/* 1. VIP / Offer button */}
          {user?.pendingSubscription ? (
            <button
              type="button"
              onClick={openProfileModal}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-md hover:bg-amber-900/60 transition-all animate-pulse cursor-pointer shrink-0"
              title="পেমেন্ট যাচাইকরণাধীন"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'bn' ? 'যাচাই' : 'Pending'}</span>
            </button>
          ) : isPremium ? (
            <button
              type="button"
              onClick={openSubscriptionModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-600/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-md hover:bg-amber-500/30 transition-all cursor-pointer shrink-0"
              title="VIP মেম্বারশিপ"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">VIP</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenBestOffer) {
                  onOpenBestOffer();
                } else {
                  openSubscriptionModal();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black text-[11px] font-black shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer shrink-0"
              title={language === 'bn' ? 'ভিআইপি / স্পেশাল অফার' : 'VIP / Special Promo'}
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{language === 'bn' ? 'অফার' : 'Offer'}</span>
            </button>
          )}

          {/* 2. ⋯ More Button with Notification Indicator & Popover Menu */}
          <div className="relative" ref={mobileMoreRef}>
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(!mobileMoreOpen);
                setMoreSubView('main');
              }}
              className={`relative p-2 rounded-xl transition-all cursor-pointer active:scale-95 border ${
                mobileMoreOpen
                  ? 'bg-rose-600/20 text-white border-rose-500/40 shadow-lg'
                  : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
              }`}
              title={language === 'bn' ? 'আরও অপশন' : 'More Options'}
              aria-label="More options"
              aria-expanded={mobileMoreOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-[#08090d]"></span>
                </span>
              )}
            </button>

            {/* Mobile More Popover Menu */}
            {mobileMoreOpen && (
              <div className="fixed top-16 right-3 w-[290px] xs:w-[320px] max-w-[calc(100vw-1.5rem)] bg-[#0c0e18]/98 border border-white/15 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl p-3 space-y-1.5 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                {moreSubView === 'main' ? (
                  <>
                    {/* Search Bar Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMoreOpen(false);
                        onOpenSearch();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-rose-400" />
                        <span>{language === 'bn' ? 'মুভি বা সিরিজ খুঁজুন...' : 'Search movies & series...'}</span>
                      </div>
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">⌘K</kbd>
                    </button>

                    {/* Language & Theme Controls Row */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {language === 'bn' ? 'ভাষা' : 'Lang'}
                        </span>
                        <LanguageSwitcher compact={true} />
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                          {language === 'bn' ? 'থিম' : 'Theme'}
                        </span>
                        <ThemeToggle compact={true} />
                      </div>
                    </div>

                    <div className="border-t border-white/10 my-1" />

                    {/* Notifications Center Trigger */}
                    <button
                      type="button"
                      onClick={() => setMoreSubView('notifications')}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center justify-between transition-colors font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Bell className="w-4 h-4 text-rose-400" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                          )}
                        </div>
                        <span>{language === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notifications'}</span>
                      </div>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
                          {unreadCount} {language === 'bn' ? 'নতুন' : 'new'}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {/* Favorites Link */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMoreOpen(false);
                        handleSelectCategory('favorites', 'all');
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center justify-between transition-colors font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        <span>{language === 'bn' ? 'আমার ফেভারিটস' : 'My Favorites'}</span>
                      </div>
                      {favorites.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {favorites.length}
                        </span>
                      )}
                    </button>

                    {/* Watchlist Link */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMoreOpen(false);
                        handleSelectCategory('watchlist', 'all');
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center justify-between transition-colors font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <span>{language === 'bn' ? 'আমার ওয়াচলিস্ট' : 'My Watchlist'}</span>
                      </div>
                      {watchlist.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {watchlist.length}
                        </span>
                      )}
                    </button>

                    {/* Movie Request */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMoreOpen(false);
                        openRequestModal();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-rose-400" />
                      <span>{language === 'bn' ? 'মুভি ও নাটক রিকোয়েস্ট' : 'Request Movie / Drama'}</span>
                    </button>

                    {/* Help & Support */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMoreOpen(false);
                        openSupportModal();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>{language === 'bn' ? 'অ্যাডমিন সাপোর্ট ও হেল্প' : 'Help & Admin Support'}</span>
                    </button>

                    {/* Best Offer Promo */}
                    {onOpenBestOffer && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMoreOpen(false);
                          onOpenBestOffer();
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl flex items-center justify-between transition-colors font-semibold border border-amber-500/30 cursor-pointer mt-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>{language === 'bn' ? '৫৮% স্পেশাল অফার' : 'Special 58% Promo'}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          HOT
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  /* Subview: Notifications */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => setMoreSubView('main')}
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer font-medium"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="p-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                            title={language === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={clearNotifications}
                            className="p-1 text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                            title={language === 'bn' ? 'সব মুছুন' : 'Clear all'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 space-y-1">
                          <Bell className="w-6 h-6 mx-auto text-slate-600" />
                          <p className="text-xs">
                            {language === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No notifications yet'}
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const title = language === 'bn' ? item.titleBn : item.titleEn;
                          const message = language === 'bn' ? item.messageBn : item.messageEn;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                markAsRead(item.id);
                                if (item.movieId && onSelectMovieById) {
                                  onSelectMovieById(item.movieId);
                                  setMobileMoreOpen(false);
                                }
                              }}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                item.read
                                  ? 'bg-white/[0.02] border-white/5 opacity-70'
                                  : 'bg-rose-950/30 border-rose-500/30'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {item.poster && (
                                  <img
                                    src={item.poster}
                                    alt={item.movieTitle || 'Poster'}
                                    className="w-8 h-11 rounded object-cover shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-white truncate">{title}</p>
                                  <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">{message}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Login / Profile Button */}
          {isLoggedIn && user ? (
            <div className="relative" ref={mobileUserRef}>
              <button
                type="button"
                onClick={() => setMobileUserDropdownOpen(!mobileUserDropdownOpen)}
                className="flex items-center gap-1 p-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shrink-0"
                title={user.name}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg bg-rose-600/30 object-cover shrink-0"
                />
              </button>

              {mobileUserDropdownOpen && (
                <div
                  className="fixed top-16 right-3 w-64 max-w-[calc(100vw-1.5rem)] bg-[#0f1118]/98 border border-white/15 rounded-2xl shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl ring-1 ring-white/10"
                  onClick={() => setMobileUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
                      {isPremium ? '★ VIP সদস্য' : user.pendingSubscription ? 'যাচাইকরণাধীন' : 'ফ্রি অ্যাকাউন্ট'}
                    </div>
                  </div>

                  <button
                    onClick={openProfileModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-rose-400" />
                    <span>ইউজার তথ্য ও এডিট প্রোফাইল</span>
                  </button>

                  <button
                    onClick={openRequestModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Film className="w-4 h-4 text-rose-400" />
                    <span>মুভি ও নাটক রিকোয়েস্ট</span>
                  </button>

                  <button
                    onClick={openSupportModal}
                    className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>অ্যাডমিনকে মেসেজ / হেল্প</span>
                  </button>

                  <button
                    onClick={openSubscriptionModal}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{isPremium ? 'মেম্বারশিপ তথ্য' : 'ভিআইপিতে আপগ্রেড'}</span>
                  </button>

                  <button
                    onClick={() => handleSelectCategory('favorites', 'all')}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span>আমার ফেভারিটস ({favorites.length})</span>
                  </button>

                  <button
                    onClick={() => handleSelectCategory('watchlist', 'all')}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>আমার ওয়াচলিস্ট ({watchlist.length})</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 transition-colors font-medium border-t border-white/5 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold transition-all border border-white/10 active:scale-95 cursor-pointer shrink-0"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'bn' ? 'লগইন' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav row with Home, Movies, Drama, Series - Clean and focused, no duplicate Favorites/Watchlist */}
      <div className="lg:hidden border-t border-white/5 px-2 py-1.5 flex items-center justify-around overflow-x-auto no-scrollbar gap-1 text-[11px] text-slate-400 bg-[#08090d]">
        <button
          onClick={() => handleSelectCategory('home', 'all')}
          className={`px-2 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'home' ? 'text-rose-500 font-bold' : 'hover:text-white'}`}
        >
          {t('navHome')}
        </button>
        <button
          onClick={() => handleSelectCategory('movies', 'all')}
          className={`px-2 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'movies' ? 'text-rose-500 font-bold' : 'hover:text-white'}`}
        >
          {language === 'bn' ? 'মুভি' : 'Movies'}
        </button>
        <button
          onClick={() => handleSelectCategory('drama', 'all')}
          className={`px-2 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'drama' ? 'text-rose-500 font-bold' : 'hover:text-white'}`}
        >
          {language === 'bn' ? 'ড্রামা' : 'Drama'}
        </button>
        <button
          onClick={() => handleSelectCategory('series', 'all')}
          className={`px-2 py-1 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'series' ? 'text-rose-500 font-bold' : 'hover:text-white'}`}
        >
          {language === 'bn' ? 'সিরিজ' : 'Series'}
        </button>
      </div>
    </header>
  );
};
