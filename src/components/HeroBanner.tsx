import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Film,
  Heart,
  Bookmark,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Crown,
  Eye,
  Star,
  Info,
  Search,
  X,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie, mode?: 'stream' | 'trailer') => void;
  onOpenDetails: (movie: Movie) => void;
  onExploreAll?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  onPlay,
  onOpenDetails,
}) => {
  const { t, getTitle, getSynopsis, getGenres, getDirector, language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isPremium, openSubscriptionModal } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoPreviewActive, setVideoPreviewActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // In-hero quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter movies based on hero search query
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return movies
      .filter((m) => {
        const matchTitleBn = m.titleBn?.toLowerCase().includes(q);
        const matchTitleEn = m.titleEn?.toLowerCase().includes(q);
        const matchDirector =
          m.director?.toLowerCase().includes(q) || m.directorBn?.toLowerCase().includes(q);
        const matchCast =
          m.cast?.some((c) => c.toLowerCase().includes(q)) ||
          m.castBn?.some((c) => c.toLowerCase().includes(q));
        const matchGenre =
          m.genres?.some((g) => g.toLowerCase().includes(q)) ||
          m.genresBn?.some((g) => g.toLowerCase().includes(q));
        return matchTitleBn || matchTitleEn || matchDirector || matchCast || matchGenre;
      })
      .slice(0, 6);
  }, [searchQuery, movies]);

  // Popular trending search tags
  const trendingTags = [
    { label: 'তুফান', en: 'Toofan' },
    { label: 'হাওয়া', en: 'Hawa' },
    { label: 'প্রিয়তমা', en: 'Priyotoma' },
    { label: 'জওয়ান', en: 'Jawan' },
    { label: 'Oppenheimer', en: 'Oppenheimer' },
    { label: 'কারাগার', en: 'Karagar' },
  ];

  // Top featured titles
  const featured = movies.filter((m) => m.isFeatured || m.rating >= 8.4).slice(0, 5);
  const total = featured.length > 0 ? featured.length : 1;
  const currentMovie = featured[currentIndex] || movies[0];

  const inWatchlist = currentMovie ? isInWatchlist(currentMovie.id) : false;
  const favorited = currentMovie ? isFavorite(currentMovie.id) : false;

  // Auto carousel with 7-second slide progress bar
  useEffect(() => {
    setProgress(0);
    setVideoPreviewActive(false);

    // After 2.5s on slide, activate video preview
    const videoTimer = setTimeout(() => {
      setVideoPreviewActive(true);
    }, 2200);

    const stepMs = 50;
    const totalMs = 7000;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % total);
          return 0;
        }
        return prev + (stepMs / totalMs) * 100;
      });
    }, stepMs);

    return () => {
      clearInterval(interval);
      clearTimeout(videoTimer);
    };
  }, [currentIndex, total]);

  const handleSelectSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  };

  if (!currentMovie) return null;

  return (
    <div className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[740px] flex items-end pb-14 pt-28 overflow-hidden bg-[#050609] select-none">
      
      {/* Background Theatrical Canvas with Ken-Burns Motion & Video Preview */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {videoPreviewActive && currentMovie.directStreamUrl ? (
          /* Subtle Animated Video Backdrop Preview */
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            src={currentMovie.directStreamUrl}
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-105 scale-105 transition-all duration-1000 ease-out animate-in fade-in"
          />
        ) : (
          /* High-Res Backdrop with Smooth Zoom */
          <img
            key={currentMovie.id}
            src={currentMovie.backdrop || currentMovie.poster}
            alt={getTitle(currentMovie)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.80] contrast-110 scale-100 hover:scale-105 transition-all duration-1000 ease-out animate-in fade-in zoom-in-95"
          />
        )}

        {/* Ambient Cinema Lighting & Multi-Layer Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/65 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/85 to-transparent max-w-5xl" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08090d]/80 to-transparent" />

        {/* Ambient Glow Aura */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        
        {/* Left Column: Movie Title, Badges, Synopsis & CTAs */}
        <div className="max-w-2xl space-y-4">
          
          {/* Top Live Trending Ticker & Category Badge */}
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-lg shadow-rose-950/50">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
              <span>{language === 'bn' ? '#১ শীর্ষ ট্রেন্ডিং' : '#1 Trending Now'}</span>
            </span>

            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-400" />
              <span>{currentMovie.viewsCount || '৩.৮ মিলিয়ন'} {language === 'bn' ? 'দর্শক দেখেছেন' : 'views'}</span>
            </span>

            {currentMovie.category === 'natok' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                বাংলা নাটক
              </span>
            ) : currentMovie.category === 'series' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                ওয়েব সিরিজ
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                সিনেমা
              </span>
            )}
          </div>

          {/* Unboxed Metadata with Typographic Separators */}
          <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-slate-300">
            <span className="text-amber-400 font-bold tracking-wider font-mono flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{currentMovie.rating.toFixed(1)} IMDb</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-300">{currentMovie.year}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">{currentMovie.runtime}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-rose-400 font-mono font-bold">{currentMovie.quality}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{getGenres(currentMovie).slice(0, 3).join(' / ')}</span>
          </div>

          {/* Primary Movie Title with Cinematic Styling */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-cinzel text-balance drop-shadow-2xl">
            {getTitle(currentMovie)}
          </h1>

          {/* Director & Lead Cast Inline */}
          <div className="text-xs sm:text-sm text-slate-300 flex items-center flex-wrap gap-2">
            <span className="text-slate-400">{t('director')}:</span>
            <span className="text-white font-medium">{getDirector(currentMovie)}</span>
            {currentMovie.castBn && currentMovie.castBn.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400">অভিনয়ে:</span>
                <span className="text-slate-300">{currentMovie.castBn.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>

          {/* Synopsis with clamped lines for clean presentation */}
          <p className="text-xs sm:text-sm md:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-xl font-light">
            {getSynopsis(currentMovie)}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center flex-wrap gap-3">
            {/* Primary Watch Button */}
            <button
              onClick={() => onPlay(currentMovie, 'stream')}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm transition-all shadow-xl shadow-rose-950/60 active:scale-95 whitespace-nowrap"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <span>{t('watchNow')}</span>
            </button>

            {/* Trailer & Cast Details */}
            <button
              onClick={() => onOpenDetails(currentMovie)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition-all border border-white/10 active:scale-95 whitespace-nowrap backdrop-blur-md"
            >
              <Film className="w-4 h-4 text-slate-300" />
              <span>{language === 'bn' ? 'ট্রেইলার ও কাস্ট' : 'Trailer & Details'}</span>
            </button>

            {/* Top-Tier Favorite Toggle */}
            <button
              onClick={() => toggleFavorite(currentMovie)}
              className={`p-3.5 rounded-2xl border transition-all active:scale-90 backdrop-blur-md ${
                favorited
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/60 ring-2 ring-rose-400/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:text-rose-400 hover:bg-white/15 border-white/10'
              }`}
              title={favorited ? 'টপ ফেভারিট থেকে সরান' : 'শীর্ষ ফেভারিটে যোগ করুন (Favorite)'}
              aria-label="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 transition-transform ${favorited ? 'fill-current scale-110' : ''}`} />
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => toggleWatchlist(currentMovie)}
              className={`p-3.5 rounded-2xl border transition-all active:scale-90 backdrop-blur-md ${
                inWatchlist
                  ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:text-white border-white/10 hover:bg-white/15'
              }`}
              title={inWatchlist ? t('inWatchlist') : t('addToWatchlist')}
              aria-label="Toggle Watchlist"
            >
              {inWatchlist ? <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          {/* Prominent In-Banner Quick Search Bar */}
          <div ref={searchContainerRef} className="relative pt-2 max-w-xl z-30">
            {/* Search Input Box */}
            <div
              className={`relative flex items-center rounded-2xl bg-[#090b10]/90 border backdrop-blur-xl transition-all shadow-2xl ${
                isSearchFocused
                  ? 'border-rose-500/80 ring-2 ring-rose-500/30 shadow-rose-950/50 bg-[#090b10]/98'
                  : 'border-white/20 hover:border-white/40 shadow-black/70'
              }`}
            >
              <div className="pl-4 pr-2 text-rose-500">
                <Search className="w-5 h-5 shrink-0" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={
                  language === 'bn'
                    ? 'দ্রুত সিনেমা বা শিল্পী খুঁজুন... (যেমন: তুফান, হাওয়া, শাহরুখ)'
                    : 'Quick search movies or cast... (e.g. Toofan, Hawa, Jawan)'
                }
                className="w-full py-3.5 pr-10 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Trending Keyword Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400 fill-rose-400/40" />
                <span>{language === 'bn' ? 'ট্রেন্ডিং:' : 'Popular:'}</span>
              </span>
              {trendingTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag.label);
                    setIsSearchFocused(true);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-rose-600/30 text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/40 font-medium shrink-0 transition-all cursor-pointer active:scale-95"
                >
                  {language === 'bn' ? tag.label : tag.en}
                </button>
              ))}
            </div>

            {/* Floating Instant Search Results Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0e17]/98 border border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10 max-h-[380px] overflow-y-auto">
                <div className="flex items-center justify-between px-2.5 py-1 mb-1 border-b border-white/10 text-xs font-semibold text-slate-400">
                  <span>
                    {language === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Matches'} ({searchResults.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-1.5">
                    {searchResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          onOpenDetails(movie);
                          setIsSearchFocused(false);
                        }}
                        className="group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={movie.poster}
                            alt={getTitle(movie)}
                            className="w-10 h-14 object-cover rounded-lg bg-slate-900 border border-white/10 shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate font-cinzel">
                              {getTitle(movie)}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="flex items-center gap-0.5 text-amber-400 font-mono font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {movie.rating.toFixed(1)}
                              </span>
                              <span>·</span>
                              <span className="font-mono">{movie.year}</span>
                              <span>·</span>
                              <span className="text-rose-400 font-mono font-bold">{movie.quality}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {getGenres(movie).slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(movie, 'stream');
                            setIsSearchFocused(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-950/60 transition-transform active:scale-95 shrink-0"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span className="hidden sm:inline">{language === 'bn' ? 'দেখুন' : 'Watch'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 px-4 text-center space-y-2">
                    <p className="text-xs sm:text-sm text-slate-400">
                      {language === 'bn'
                        ? `‘${searchQuery}’-এর সাথে মিল পাওয়া যায়নি।`
                        : `No movies found matching "${searchQuery}".`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {language === 'bn'
                        ? 'সঠিক বানান যাচাই করুন অথবা ট্রেন্ডিং কীওয়ার্ডে ক্লিক করুন।'
                        : 'Check spelling or try clicking one of the trending titles above.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Thumbnail Selector with Progress Countdown & Sound Toggle */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          
          {/* Sound Mute/Unmute Ambient Button */}
          {videoPreviewActive && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs border border-white/15 backdrop-blur-md transition-all shadow-lg active:scale-95"
              title={isMuted ? 'সাউন্ড চালু করুন' : 'মিউট করুন'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
              <span className="text-[11px] font-medium">{isMuted ? 'সাউন্ড বন্ধ' : 'সাউন্ড চালু'}</span>
            </button>
          )}

          {/* Interactive Thumbnail Carousel Strip with Keyboard Navigation */}
          <div
            role="region"
            aria-label="Featured slides carousel"
            className="flex lg:flex-col items-center gap-2.5 overflow-x-auto no-scrollbar max-w-full pb-2 lg:pb-0 focus:outline-none"
          >
            {featured.map((item, index) => {
              const isActive = currentIndex === index;
              return (
                <div
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`Slide ${index + 1}: ${item.titleBn}. Press Enter to view slide.`}
                  onClick={() => handleSelectSlide(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSlide(index);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      handleNext();
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      handlePrev();
                    }
                  }}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex items-center gap-3 p-1.5 border select-none outline-none focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:scale-105 ${
                    isActive
                      ? 'w-52 sm:w-56 bg-white/15 border-rose-500/60 shadow-xl shadow-rose-950/40 scale-102'
                      : 'w-12 lg:w-44 bg-black/40 hover:bg-white/10 border-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Thumbnail Poster */}
                  <div className="w-9 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                    <img
                      src={item.poster}
                      alt={item.titleBn}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Rating (Visible on desktop) */}
                  <div className="hidden lg:block truncate flex-1 pr-1">
                    <p className="text-xs font-bold text-white truncate font-cinzel">
                      {item.titleBn}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="text-amber-400">★ {item.rating.toFixed(1)}</span>
                      <span>·</span>
                      <span>{item.year}</span>
                    </div>
                  </div>

                  {/* Active Slide Timer Progress Line */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next & Previous Arrow Controls */}
          <div className="hidden lg:flex items-center gap-2 pt-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
