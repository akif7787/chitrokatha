import React, { useState, useMemo, useEffect } from 'react';
import AdminApp from './admin/AdminApp';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { RatingProvider } from './context/RatingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Movie, ContentType, ContentIndustry } from './types/movie';
import { Actor } from './data/actorsData';
import { curatedMovies } from './data/moviesData';
import { getAdminMovies } from './services/movieStorage';
import { Header, MainTab } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { TrendingTop10Row } from './components/TrendingTop10Row';
import { ActorSection } from './components/ActorSection';
import { ActorFilmographyModal } from './components/ActorFilmographyModal';
import { MovieRow } from './components/MovieRow';
import { MovieCard } from './components/MovieCard';
import { FilterBar, GenreFilter, SortOption } from './components/FilterBar';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchModal } from './components/SearchModal';
import { WatchlistView } from './components/WatchlistView';
import { FavoritesView } from './components/FavoritesView';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SubscriptionStatusModal } from './components/SubscriptionStatusModal';
import { UserProfileModal } from './components/UserProfileModal';
import { MovieRequestModal } from './components/MovieRequestModal';
import { SupportModal } from './components/SupportModal';
import { BestOfferModal } from './components/BestOfferModal';
import { CinematicIntro } from './components/CinematicIntro';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RecentlyWatchedRow } from './components/RecentlyWatchedRow';
import { GenreCloud } from './components/GenreCloud';
import { ComingSoonSection } from './components/ComingSoonSection';
import { recordMovieInteraction } from './services/recentlyWatched';
import { Footer } from './components/Footer';
import { Film, Sparkles, Crown, Clapperboard, Tv, Play } from 'lucide-react';

function ChitroKathaApp() {
  const { t, language } = useLanguage();
  const { isPremium, openSubscriptionModal, requireAuthForPlayback } = useAuth();

  // Theatrical Intro on Load / Refresh (shortened, runs once per browsing session)
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('chitrokatha_intro_shown');
  });

  // Best offer modal (manual trigger only, never automatically popped up)
  const [isBestOfferModalOpen, setIsBestOfferModalOpen] = useState(false);

  // Navigation Tabs: 'home' | 'movies' | 'drama' | 'series' | 'watchlist'
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<ContentIndustry | 'all'>('all');

  // Sub-tabs on Home Page Rows
  const [homeMovieFilter, setHomeMovieFilter] = useState<ContentIndustry | 'all'>('all');
  const [homeDramaFilter, setHomeDramaFilter] = useState<ContentIndustry | 'all'>('all');
  const [homeSeriesFilter, setHomeSeriesFilter] = useState<ContentIndustry | 'all'>('all');

  // Movies State
  const [syncedMovies] = useState<Movie[]>(() => getAdminMovies());

  // Modal States
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playerInitialMode, setPlayerInitialMode] = useState<'stream' | 'trailer'>('trailer');
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filters & Sorting
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('trending');

  // Unified Catalog
  const allMovies = useMemo(() => {
    return [...syncedMovies, ...curatedMovies];
  }, [syncedMovies]);

  // Player Handlers
  const handleOpenPlay = (movie: Movie, mode: 'stream' | 'trailer' = 'trailer') => {
    if (!requireAuthForPlayback()) return;
    setSelectedMovie(movie);
    setPlayerInitialMode(mode);
    recordMovieInteraction(movie);
  };

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovie(movie);
    setPlayerInitialMode('trailer');
    recordMovieInteraction(movie);
  };

  // Deep linking: Automatically open movie if URL contains ?movie=id
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const movieId = params.get('movie');
      if (movieId && allMovies.length > 0) {
        const found = allMovies.find((m) => String(m.id) === String(movieId));
        if (found) {
          setSelectedMovie(found);
          setPlayerInitialMode('trailer');
        }
      }
    } catch {}
  }, [allMovies]);

  const { showToast } = useNotifications();

  const handleSelectMovieById = (movieId: string) => {
    const found = allMovies.find((m) => String(m.id) === String(movieId));
    if (found) {
      handleOpenDetails(found);
    }
  };



  // Navigate directly to Home from anywhere on clicking the brand logo
  const handleGoHome = () => {
    setActiveTab('home');
    setSelectedIndustryFilter('all');
    setSelectedMovie(null);
    setSelectedActor(null);
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Grouped rows for Home Tab:
  // 1. Movies (Bangla, Hindi, English)
  const homeMovies = useMemo(() => {
    const base = allMovies.filter((m) => m.contentType === 'movie' || (!m.contentType && (m.category === 'bangla' || m.category === 'bollywood' || m.category === 'hollywood')));
    if (homeMovieFilter === 'all') return base;
    return base.filter((m) => m.industry === homeMovieFilter);
  }, [allMovies, homeMovieFilter]);

  // 2. Drama (Bangla Natok, Pakistani, Korean)
  const homeDramas = useMemo(() => {
    const base = allMovies.filter((m) => m.contentType === 'drama' || (!m.contentType && m.category === 'natok'));
    if (homeDramaFilter === 'all') return base;
    return base.filter((m) => m.industry === homeDramaFilter);
  }, [allMovies, homeDramaFilter]);

  // 3. Web Series (Bangla, Hindi, English)
  const homeSeries = useMemo(() => {
    const base = allMovies.filter((m) => m.contentType === 'series' || (!m.contentType && m.category === 'series'));
    if (homeSeriesFilter === 'all') return base;
    return base.filter((m) => m.industry === homeSeriesFilter);
  }, [allMovies, homeSeriesFilter]);

  // Filtered & Sorted movies for dedicated category tabs
  const filteredCategoryMovies = useMemo(() => {
    let result = [...allMovies];

    // Filter by Active Tab
    if (activeTab === 'movies') {
      result = result.filter((m) => m.contentType === 'movie' || (!m.contentType && (m.category === 'bangla' || m.category === 'bollywood' || m.category === 'hollywood')));
    } else if (activeTab === 'drama') {
      result = result.filter((m) => m.contentType === 'drama' || (!m.contentType && m.category === 'natok'));
    } else if (activeTab === 'series') {
      result = result.filter((m) => m.contentType === 'series' || (!m.contentType && m.category === 'series'));
    }

    // Filter by Selected Industry (Bangla, Hindi, English, Pakistani, Korean)
    if (selectedIndustryFilter !== 'all') {
      result = result.filter((m) => m.industry === selectedIndustryFilter);
    }

    // Filter by Genre
    if (selectedGenre !== 'all') {
      result = result.filter((m) => {
        const gEn = m.genres.map((g) => g.toLowerCase());
        const gBn = m.genresBn?.map((g) => g.toLowerCase()) || [];
        const target = selectedGenre.toLowerCase();
        return gEn.some((g) => g.includes(target)) || gBn.some((g) => g.includes(target));
      });
    }

    // Sorting
    if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'newest') {
      result.sort((a, b) => b.year - a.year);
    }

    return result;
  }, [allMovies, activeTab, selectedIndustryFilter, selectedGenre, selectedSort]);

  return (
    <div className="min-h-screen bg-[#08090d] text-[#e2e8f0] flex flex-col selection:bg-rose-600 selection:text-white">
      {/* Theatrical Cinematic Intro on Load / Refresh */}
      {showIntro && (
        <CinematicIntro
          onComplete={() => {
            sessionStorage.setItem('chitrokatha_intro_shown', 'true');
            setShowIntro(false);
          }}
        />
      )}

      {/* 100% Clean OTT Header with Structured Categories */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedIndustryFilter={selectedIndustryFilter}
        setSelectedIndustryFilter={setSelectedIndustryFilter}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBestOffer={() => setIsBestOfferModalOpen(true)}
        onGoHome={handleGoHome}
        onSelectMovieById={handleSelectMovieById}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'watchlist' ? (
          <WatchlistView
            onSelectMovie={handleOpenDetails}
            onExplore={() => setActiveTab('home')}
          />
        ) : activeTab === 'favorites' ? (
          <FavoritesView
            onSelectMovie={handleOpenDetails}
            onExplore={() => setActiveTab('home')}
          />
        ) : activeTab === 'home' ? (
          /* Home Screen with Structured Categorical Rows */
          <div className="space-y-6">
            {/* Featured Dynamic Full-Bleed Hero Banner */}
            <HeroBanner
              movies={allMovies}
              onPlay={handleOpenPlay}
              onOpenDetails={handleOpenDetails}
              onExploreAll={() => {
                setActiveTab('movies');
                setSelectedIndustryFilter('all');
              }}
            />

            {/* Recently Watched / Continue Watching Row (Local Storage) */}
            <RecentlyWatchedRow
              onSelectMovie={handleOpenDetails}
              onPlay={(m) => handleOpenPlay(m, 'stream')}
            />

            {/* Top 10 Trending Countdown in Bangladesh */}
            <TrendingTop10Row
              movies={allMovies}
              onSelectMovie={handleOpenDetails}
              onPlay={(m) => handleOpenPlay(m, 'stream')}
            />

            {/* Interactive D3 Dynamic Genre Cloud */}
            <GenreCloud
              movies={allMovies}
              onSelectMovie={handleOpenDetails}
              onPlayMovie={(m) => handleOpenPlay(m, 'stream')}
            />

            {/* Star Cast & Actor/Actress Row */}
            <ActorSection
              onSelectActor={(actor) => setSelectedActor(actor)}
            />

            {/* VIP Ad-Free Callout Banner for Free Users */}
            {!isPremium && (
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-rose-950/40 to-black border border-amber-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base sm:text-lg font-black text-white font-cinzel">
                        চিত্রকথা ভিআইপি মেম্বারশিপে আপগ্রেড করুন
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      সকল বিজ্ঞাপন চিরতরে বন্ধ করুন, ৪কে আল্ট্রা এইচডি কোয়ালিটি এবং ডলবি সারাউন্ড সাউন্ড উপভোগ করুন মাত্র ৳৯৯ থেকে!
                    </p>
                  </div>

                  <button
                    onClick={openSubscriptionModal}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-extrabold text-xs rounded-xl shadow-xl shadow-amber-950/60 transition-all active:scale-95 shrink-0"
                  >
                    প্ল্যানগুলো দেখুন (Get VIP)
                  </button>
                </div>
              </div>
            )}

            {/* COMING SOON / UPCOMING RELEASES SECTION */}
            <ComingSoonSection
              movies={allMovies}
              onSelectMovie={handleOpenDetails}
              onPlayTrailer={(m) => handleOpenPlay(m, 'trailer')}
            />

            {/* SECTION 1: MOVIES (BANGLA, HINDI, ENGLISH) */}
            <div className="space-y-2">
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
                    <Clapperboard className="w-5 h-5 text-rose-500" />
                    <span>মুভি ও চলচ্চিত্র (Movie)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    বাংলা, হিন্দি ও হলিউডের জনপ্রিয় সব ব্লকবাস্টার সিনেমা
                  </p>
                </div>

                {/* Sub-Tabs: Bangla, Hindi, English */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
                  <button
                    onClick={() => setHomeMovieFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeMovieFilter === 'all'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    সব
                  </button>
                  <button
                    onClick={() => setHomeMovieFilter('bangla')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeMovieFilter === 'bangla'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    বাংলা (Bangla)
                  </button>
                  <button
                    onClick={() => setHomeMovieFilter('hindi')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeMovieFilter === 'hindi'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    হিন্দি (Hindi)
                  </button>
                  <button
                    onClick={() => setHomeMovieFilter('english')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeMovieFilter === 'english'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ইংরেজি (English)
                  </button>
                </div>
              </div>

              <MovieRow
                title=""
                badgeText="MOVIES"
                movies={homeMovies}
                onSelectMovie={handleOpenDetails}
                onPlayTrailer={(m) => handleOpenPlay(m, 'trailer')}
              />
            </div>

            {/* SECTION 2: DRAMA (BANGLA, PAKISTANI, KOREAN) */}
            <div className="space-y-2">
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
                    <Tv className="w-5 h-5 text-amber-500" />
                    <span>নাটক ও ড্রামা (Drama)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    বাংলা জনপ্রিয় নাটক, পাকিস্তানি মেগা ড্রামা এবং কোরিয়ান কে-ড্রামা (K-Drama)
                  </p>
                </div>

                {/* Sub-Tabs: Bangla, Pakistani, Korean */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
                  <button
                    onClick={() => setHomeDramaFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeDramaFilter === 'all'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    সব
                  </button>
                  <button
                    onClick={() => setHomeDramaFilter('bangla')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeDramaFilter === 'bangla'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    বাংলা নাটক (Bangla)
                  </button>
                  <button
                    onClick={() => setHomeDramaFilter('pakistani')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeDramaFilter === 'pakistani'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    পাকিস্তানি (Pakistani)
                  </button>
                  <button
                    onClick={() => setHomeDramaFilter('korean')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeDramaFilter === 'korean'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    কে-ড্রামা (Korean)
                  </button>
                </div>
              </div>

              <MovieRow
                title=""
                badgeText="DRAMA"
                movies={homeDramas}
                onSelectMovie={handleOpenDetails}
                onPlayTrailer={(m) => handleOpenPlay(m, 'trailer')}
              />
            </div>

            {/* SECTION 3: WEB SERIES (BANGLA, HINDI, ENGLISH) */}
            <div className="space-y-2">
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
                    <Film className="w-5 h-5 text-emerald-500" />
                    <span>ওয়েব সিরিজ (Web Series)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    বাংলা অরিজিনাল, হিন্দি ক্রাইম থ্রিলার ও আন্তর্জাতিক মাস্টারপিস সিরিজ
                  </p>
                </div>

                {/* Sub-Tabs: Bangla, Hindi, English */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-semibold">
                  <button
                    onClick={() => setHomeSeriesFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeSeriesFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    সব
                  </button>
                  <button
                    onClick={() => setHomeSeriesFilter('bangla')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeSeriesFilter === 'bangla'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    বাংলা সিরিজ (Bangla)
                  </button>
                  <button
                    onClick={() => setHomeSeriesFilter('hindi')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeSeriesFilter === 'hindi'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    হিন্দি সিরিজ (Hindi)
                  </button>
                  <button
                    onClick={() => setHomeSeriesFilter('english')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      homeSeriesFilter === 'english'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ইংরেজি সিরিজ (English)
                  </button>
                </div>
              </div>

              <MovieRow
                title=""
                badgeText="WEB SERIES"
                movies={homeSeries}
                onSelectMovie={handleOpenDetails}
                onPlayTrailer={(m) => handleOpenPlay(m, 'trailer')}
              />
            </div>
          </div>
        ) : (
          /* Dedicated Category Screen: Movie / Drama / Series */
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8">
            <div className="border-b border-white/5 pb-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
                {activeTab === 'movies' && 'মুভি ও চলচ্চিত্র (Movies)'}
                {activeTab === 'drama' && 'নাটক ও ড্রামা (Drama)'}
                {activeTab === 'series' && 'ওয়েব সিরিজ (Web Series)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {activeTab === 'movies' && 'বাংলা, হিন্দি ও হলিউডের সেরা চলচ্চিত্রসমূহ'}
                {activeTab === 'drama' && 'বাংলা নাটক, পাকিস্তানি ড্রামা এবং কোরিয়ান কে-ড্রামা'}
                {activeTab === 'series' && 'টানটান উত্তেজনার বাংলা, হিন্দি ও আন্তর্জাতিক ওয়েব সিরিজ'}
              </p>

              {/* Sub-Filters by Industry (Bangla, Hindi, English, Pakistani, Korean) */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar py-1 max-w-full">
                <button
                  onClick={() => setSelectedIndustryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                    selectedIndustryFilter === 'all'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  সব ({filteredCategoryMovies.length})
                </button>

                {activeTab === 'movies' && (
                  <>
                    <button
                      onClick={() => setSelectedIndustryFilter('bangla')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'bangla'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      বাংলা মুভি (Bangla)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('hindi')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'hindi'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      হিন্দি মুভি (Hindi)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('english')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'english'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      ইংরেজি / হলিউড (English)
                    </button>
                  </>
                )}

                {activeTab === 'drama' && (
                  <>
                    <button
                      onClick={() => setSelectedIndustryFilter('bangla')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'bangla'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      বাংলা নাটক (Bangla Natok)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('pakistani')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'pakistani'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      পাকিস্তানি ড্রামা (Pakistani)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('korean')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'korean'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      কে-ড্রামা (Korean Drama)
                    </button>
                  </>
                )}

                {activeTab === 'series' && (
                  <>
                    <button
                      onClick={() => setSelectedIndustryFilter('bangla')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'bangla'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      বাংলা সিরিজ (Bangla)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('hindi')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'hindi'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      হিন্দি সিরিজ (Hindi)
                    </button>
                    <button
                      onClick={() => setSelectedIndustryFilter('english')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                        selectedIndustryFilter === 'english'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      ইংরেজি সিরিজ (English)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter and Sorting Bar */}
            <FilterBar
              selectedGenre={selectedGenre}
              selectedSort={selectedSort}
              onSelectGenre={setSelectedGenre}
              onSelectSort={setSelectedSort}
            />

            {/* Content Grid */}
            {filteredCategoryMovies.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <Film className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-base font-medium">{t('noMoviesFound')}</p>
                <p className="text-xs text-slate-500">{t('tryDifferentSearch')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6 mt-6">
                {filteredCategoryMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={handleOpenDetails}
                    onPlayTrailer={(m) => handleOpenPlay(m, 'trailer')}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Player Modal with Integrated Ad Engine & Reactions */}
      {selectedMovie && (
        <VideoPlayerModal
          movie={selectedMovie}
          initialMode={playerInitialMode}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Actor Filmography Modal */}
      {selectedActor && (
        <ActorFilmographyModal
          actor={selectedActor}
          allMovies={allMovies}
          onClose={() => setSelectedActor(null)}
          onSelectMovie={handleOpenDetails}
          onPlay={(m) => handleOpenPlay(m, 'stream')}
        />
      )}

      {/* Live Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allLocalMovies={allMovies}
        onSelectMovie={handleOpenDetails}
      />

      {/* User Login & Register Modal */}
      <AuthModal />

      {/* ChitroKatha Subscription & Payment Modal */}
      <SubscriptionModal />

      {/* ChitroKatha Dedicated Subscription & Payment Status Modal */}
      <SubscriptionStatusModal />

      {/* User Profile & Details Modal */}
      <UserProfileModal />

      {/* Movie & Natok Request Modal */}
      <MovieRequestModal />

      {/* Instant Admin Support Modal */}
      <SupportModal />

      {/* Best Offer Promo Modal (manual trigger from VIP / Offer buttons) */}
      <BestOfferModal
        isOpen={isBestOfferModalOpen}
        onClose={() => setIsBestOfferModalOpen(false)}
      />

      {/* Non-Intrusive Floating Toast Notifications */}
      <NotificationToastContainer onSelectMovieById={handleSelectMovieById} />

      {/* Network Connectivity & Offline Cache Indicator */}
      <OfflineIndicator />

      {/* Clean Public Footer */}
      <Footer onSelectTab={(tab) => {
        if (tab === 'home') setActiveTab('home');
        else if (tab === 'watchlist') setActiveTab('watchlist');
        else if (tab === 'favorites') setActiveTab('favorites');
        else if (tab === 'bangla') {
          setActiveTab('movies');
          setSelectedIndustryFilter('bangla');
        } else if (tab === 'series') {
          setActiveTab('series');
          setSelectedIndustryFilter('all');
        } else {
          setActiveTab('movies');
          setSelectedIndustryFilter('all');
        }
      }} />
    </div>
  );
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isAdminRoute) {
    return (
      <ThemeProvider>
        <AdminApp />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <RatingProvider>
          <FavoritesProvider>
            <WatchlistProvider>
              <AuthProvider>
                <NotificationProvider>
                  <ChitroKathaApp />
                </NotificationProvider>
              </AuthProvider>
            </WatchlistProvider>
          </FavoritesProvider>
        </RatingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
