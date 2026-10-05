import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  Bookmark,
  Check,
  Star,
  Send,
  MessageSquare,
  Info,
  ExternalLink,
  ShieldCheck,
  Radio,
  Tv,
  Film,
  Award,
  DollarSign,
  Play,
  Crown,
  Sparkles,
  Users,
  Eye,
  Sliders,
  Lock,
  UserPlus,
} from 'lucide-react';
import { Movie, StreamingServer } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { fetchWatchmodeSources, StreamingSource } from '../services/watchmodeApi';
import { getVideoBlobUrl, resolveStreamingMedia } from '../services/videoStorage';
import { AdPlayerOverlay } from './AdPlayerOverlay';
import { StarRatingWidget } from './StarRatingWidget';

interface VideoPlayerModalProps {
  movie: Movie | null;
  initialMode?: 'stream' | 'trailer';
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  movie,
  onClose,
}) => {
  const { t, getTitle, getSynopsis, getGenres, getDirector, getCast, language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInWatchlist, toggleWatchlist, recordWatch, addReview, getMovieReviews } = useWatchlist();
  const { isPremium, openSubscriptionModal, isLoggedIn, openLoginModal } = useAuth();

  // WatchMode sources state
  const [watchmodeSources, setWatchmodeSources] = useState<StreamingSource[]>([]);
  const [activeTab, setActiveTab] = useState<'player' | 'watchmode'>('player');

  // Ad State (Only free users see ad)
  const [showAd, setShowAd] = useState(!isPremium);

  // Selected resolution quality
  const [currentQuality, setCurrentQuality] = useState<'4K' | '1080p' | '720p'>('1080p');

  // Floating live emoji reactions
  const [liveReactions, setLiveReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Blob direct URL state from IndexedDB
  const [blobVideoUrl, setBlobVideoUrl] = useState<string | null>(null);

  // Selected streaming server
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  // Theater Dimmer
  const [theaterDim, setTheaterDim] = useState(false);

  // Review Form state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (movie) {
      recordWatch(movie.id);
      setSelectedServerIndex(0);
      setActiveTab('player');
      setShowAd(!isPremium);

      // Check for direct local uploaded video in IndexedDB
      if (movie.directStreamUrl && movie.directStreamUrl.startsWith('blob-db://')) {
        getVideoBlobUrl(movie.id).then((url) => {
          setBlobVideoUrl(url);
        });
      } else {
        setBlobVideoUrl(null);
      }

      // Fetch WatchMode streaming providers
      fetchWatchmodeSources(movie.imdbId).then((sources) => {
        setWatchmodeSources(sources);
      });
    }
  }, [movie, isPremium]);

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 80) + 10;
    setLiveReactions((prev) => [...prev.slice(-12), { id, emoji, left }]);
    setTimeout(() => {
      setLiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id);
  const reviews = getMovieReviews(movie.id);

  const availableServers: StreamingServer[] = movie.streamingServers && movie.streamingServers.length > 0
    ? movie.streamingServers
    : [
        {
          id: 'archive-default',
          nameBn: 'আর্কাইভ ওপেন সিনেমা (Archive API - ১০০% অ্যাড-ফ্রি)',
          nameEn: 'Archive Open Cinema (100% Ad-Free)',
          url: 'https://archive.org/embed/PatherPanchali1955Bengali',
          quality: '1080p FHD',
          type: 'archive',
        },
      ];

  const currentServer = availableServers[selectedServerIndex] || availableServers[0];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerComment.trim()) return;
    addReview(movie.id, reviewerName || (language === 'bn' ? 'দর্শক' : 'Cinema Fan'), reviewerRating, reviewerComment);
    setReviewerComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 overflow-y-auto ${
        theaterDim ? 'bg-black/98' : 'bg-black/90 backdrop-blur-md'
      }`}
    >
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-5xl bg-[#0b0d14] border border-white/10 rounded-none md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* Top Control Bar with Ad-Free Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-[#08090e] border-b border-white/10 gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {/* Ad-Free Player Tab */}
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'player'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অ্যাড-ফ্রি ওপেন সিনেমা প্লেয়ার' : 'Ad-Free Open Cinema Player'}</span>
            </button>

            {/* WatchMode Streaming Sources Tab */}
            <button
              onClick={() => setActiveTab('watchmode')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'watchmode'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>
                {language === 'bn' ? 'ওয়াচমোড অফিসিয়াল স্ট্রিমিং ডিরেক্টরি' : 'WatchMode Streaming Guide'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-500/40">
                {watchmodeSources.length}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Theater Dimmer */}
            <button
              onClick={() => setTheaterDim(!theaterDim)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                theaterDim
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
              }`}
              title="Toggle Cinema Dimming"
            >
              {theaterDim ? t('theaterModeOff') : t('theaterModeOn')}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        {activeTab === 'player' ? (
          <div className="relative aspect-video w-full bg-black shrink-0 overflow-hidden flex items-center justify-center">
            {!isLoggedIn ? (
              /* Require Account Guard Overlay */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {/* Backdrop poster with heavy blur and overlay */}
                {movie.backdrop && (
                  <img
                    src={movie.backdrop}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 scale-110 pointer-events-none"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-black/85 to-black/75 pointer-events-none" />

                <div className="relative z-10 max-w-md mx-auto space-y-4 px-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xl shadow-rose-950/40">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
                      {language === 'bn' ? 'ভিডিও দেখতে লগ ইন করুন' : 'Sign In to Watch'}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      {language === 'bn'
                        ? 'ভিডিও দেখতে আগে একটি অ্যাকাউন্ট তৈরি করুন বা লগ ইন করুন।'
                        : 'Please create an account or log in to watch this video.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        openLoginModal(
                          'ভিডিও দেখতে আগে একটি অ্যাকাউন্ট তৈরি করুন বা লগ ইন করুন। (Please create an account or log in to watch this video.)'
                        )
                      }
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{language === 'bn' ? 'লগইন / সাইন আপ' : 'Login / Sign Up'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('watchmode')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-medium text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                    >
                      <Tv className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'bn' ? 'স্ট্রিমিং গাইড দেখুন' : 'Streaming Guide'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    {language === 'bn'
                      ? '✓ ফ্রি অ্যাকাউন্ট দিয়ে সাধারণ কনটেন্ট সম্পূর্ণ বিনামূল্যে উপভোগ করুন'
                      : '✓ Free accounts can enjoy regular titles at no cost'}
                  </p>
                </div>
              </div>
            ) : showAd && !isPremium ? (
              <AdPlayerOverlay onAdComplete={() => setShowAd(false)} />
            ) : (
              <>
                {(() => {
                  const activeMediaUrl = blobVideoUrl || movie.directStreamUrl || currentServer.url;
                  const { type: mediaType, resolvedUrl } = resolveStreamingMedia(activeMediaUrl);

                  if (mediaType === 'direct' || Boolean(blobVideoUrl)) {
                    return (
                      <video
                        key={`${movie.id}-direct-video`}
                        controls
                        autoPlay
                        playsInline
                        src={resolvedUrl || activeMediaUrl}
                        className="w-full h-full object-contain bg-black"
                      />
                    );
                  }

                  // YouTube, Google Drive, or Clean Embed
                  return (
                    <iframe
                      key={`${movie.id}-${resolvedUrl}`}
                      src={resolvedUrl}
                      title={`${getTitle(movie)} - Ad-Free Movie Stream`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  );
                })()}

                {/* Floating Live Reaction Emojis */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {liveReactions.map((r) => (
                    <div
                      key={r.id}
                      style={{ left: `${r.left}%` }}
                      className="absolute bottom-6 text-3xl animate-bounce"
                    >
                      {r.emoji}
                    </div>
                  ))}
                </div>

                {/* Status Badges on Video */}
                <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none z-20">
                  {isPremium ? (
                    <span className="text-[10px] font-mono text-amber-300 bg-black/85 border border-amber-500/50 px-2.5 py-1 rounded-md backdrop-blur-md flex items-center gap-1.5 shadow-lg font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>VIP AD-FREE STREAM</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-300 bg-black/85 border border-emerald-500/40 px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1 shadow-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'bn' ? 'এইচডি প্লেয়ার' : 'HD Player'}</span>
                    </span>
                  )}
                </div>

                {/* Live Watchers Badge on Top-Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-20">
                  <span className="text-[10px] font-mono text-slate-200 bg-black/80 border border-white/10 px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>{movie.viewsCount || '৩,৪৮০'} জন এখন দেখছেন</span>
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          /* WatchMode Streaming Sources Guide */
          <div className="aspect-video w-full bg-slate-950 shrink-0 overflow-y-auto p-6 flex flex-col justify-center items-center text-center space-y-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tv className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-lg">
              <h3 className="text-lg font-bold text-white font-cinzel">
                {language === 'bn'
                  ? 'ওয়াচমোড (WatchMode) অফিসিয়াল স্ট্রিমিং গাইড'
                  : 'WatchMode Official Streaming Guide'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn'
                  ? 'কোনো বিরক্তিকর বিজ্ঞাপন ছাড়া এই সিনেমাটি যেসব অফিসিয়াল ফ্রি ও সাবস্ক্রিপশন ওটিটিতে সরাসরি চলছে:'
                  : 'Officially verified ad-free platforms streaming this title:'}
              </p>
            </div>

            {/* Source Buttons Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl pt-2">
              {watchmodeSources.map((src) => (
                <a
                  key={src.source_id}
                  href={src.web_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-600 border border-white/10 hover:border-rose-500 text-slate-200 hover:text-white transition-all text-xs font-semibold shadow-md active:scale-95 group"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-rose-400 group-hover:text-white" />
                  <span>{src.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-emerald-300 border border-emerald-500/30">
                    {src.type === 'free'
                      ? (language === 'bn' ? 'সম্পূর্ণ ফ্রি' : '100% Free')
                      : (language === 'bn' ? 'অফিসিয়াল ওটিটি' : 'Official OTT')}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Reactions & OTT Stream Controls Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#0a0c12] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline mr-1">
              রিয়্যাকশন দিন:
            </span>
            {[
              { emoji: '❤️', label: 'লাভ' },
              { emoji: '🔥', label: 'আগুন' },
              { emoji: '👏', label: 'হাততালি' },
              { emoji: '😱', label: 'চমক' },
              { emoji: '🍿', label: 'পপকর্ন' },
            ].map((item) => (
              <button
                key={item.emoji}
                onClick={() => triggerReaction(item.emoji)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 text-sm transition-all border border-white/5 flex items-center gap-1 shadow-sm"
                title={item.label}
              >
                <span>{item.emoji}</span>
              </button>
            ))}
          </div>

          {/* Resolution Quality Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-black/60 rounded-xl border border-white/10 text-[11px] font-mono">
              {(['4K', '1080p', '720p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setCurrentQuality(q)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    currentQuality === q
                      ? 'bg-rose-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Ad-Free Upgrade button for free users */}
            {!isPremium && (
              <button
                onClick={openSubscriptionModal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95"
              >
                <Crown className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">বিজ্ঞাপন বন্ধ করুন (ভিআইপি)</span>
                <span className="sm:hidden">ভিআইপি</span>
              </button>
            )}
          </div>
        </div>

        {/* Details & Information Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mb-1">
                <StarRatingWidget
                  movieId={movie.id}
                  base10Rating={movie.rating}
                  size="sm"
                  compact={true}
                  interactive={true}
                  showCount={true}
                />
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-semibold font-mono">★ {movie.rating.toFixed(1)} IMDb</span>
                {movie.rottenTomatoesScore && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-mono font-medium">🍅 {movie.rottenTomatoesScore} Rotten Tomatoes</span>
                  </>
                )}
                {movie.metacriticScore && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-mono font-medium">Metacritic {movie.metacriticScore}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{movie.year}</span>
                <span aria-hidden="true">·</span>
                <span>{movie.runtime}</span>
                <span aria-hidden="true">·</span>
                <span>{getGenres(movie).join(', ')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
                {getTitle(movie)}
              </h2>
              {language === 'bn' && movie.titleEn && movie.titleEn !== movie.titleBn && (
                <p className="text-xs text-slate-400 italic mt-0.5">{movie.titleEn}</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>IMDb Info</span>
                </a>
              )}

              {/* Favorite Toggle Button */}
              <button
                onClick={() => toggleFavorite(movie)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  isFavorite(movie.id)
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/50'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:text-rose-400 hover:bg-white/10'
                }`}
                title={isFavorite(movie.id) ? 'টপ ফেভারিট থেকে সরান' : 'শীর্ষ ফেভারিটে যোগ করুন'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite(movie.id) ? 'fill-current text-white' : ''}`} />
                <span>{isFavorite(movie.id) ? (language === 'bn' ? 'টপ ফেভারিট' : 'Favorited') : (language === 'bn' ? 'ফেভারিট' : 'Favorite')}</span>
              </button>

              {/* Watchlist Toggle Button */}
              <button
                onClick={() => toggleWatchlist(movie)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  inWatchlist
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
                title={inWatchlist ? 'ওয়াচলিস্ট থেকে সরান' : 'ওয়াচলিস্টে যোগ করুন'}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{inWatchlist ? t('inWatchlist') : t('addToWatchlist')}</span>
              </button>
            </div>
          </div>

          {/* Interactive 5-Star Community & User Rating Section */}
          <StarRatingWidget
            movieId={movie.id}
            base10Rating={movie.rating}
            size="lg"
            showCount={true}
            showUserFeedback={true}
            interactive={true}
          />

          {/* Synopsis & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-white tracking-wide">{t('synopsis')}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{getSynopsis(movie)}</p>

              {/* Extra OMDb metadata */}
              <div className="flex flex-wrap gap-4 pt-2">
                {movie.boxOffice && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'bn' ? 'বক্স অফিস:' : 'Box Office:'} <strong>{movie.boxOffice}</strong></span>
                  </div>
                )}
                {movie.awards && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span><strong>{movie.awards}</strong></span>
                  </div>
                )}
              </div>

              {/* Source / API Information */}
              <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'bn'
                    ? 'ওএমডিবি (OMDb) ও ইন্টারনেট আর্কাইভ ওপেন সিনেমা এপিআই দ্বারা সংযুক্ত (কোনো থার্ড-পার্টি পপআপ বিজ্ঞাপন নেই)।'
                    : 'Powered by OMDb API & Internet Archive Open Cinema API (Zero third-party popup ads).'}
                </span>
              </div>
            </div>

            {/* Credits and specs */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{t('director')}:</span>
                <span className="text-slate-100 font-medium">{getDirector(movie)}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{t('cast')}:</span>
                <span className="text-slate-200">{getCast(movie).join(', ')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div>
                  <span className="text-slate-400 block">{t('audioTracks')}:</span>
                  <span className="text-slate-200">{movie.audio.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('subtitlesAvail')}:</span>
                  <span className="text-slate-200">{movie.subtitles.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                <span>{t('userReviews')}</span>
                <span className="text-xs text-slate-500 font-mono">({reviews.length})</span>
              </h3>
            </div>

            {/* Submit Review Form */}
            <form onSubmit={handleSubmitReview} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder={t('yourName')}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 max-w-xs"
                />

                {/* Rating Stars Selection */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 mr-1.5">{t('imdbScore')}:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewerRating(star)}
                      className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-4 h-4 ${star <= reviewerRating ? 'fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('yourComment')}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  required
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitReview')}</span>
                </button>
              </div>

              {reviewSubmitted && (
                <p className="text-xs text-emerald-400">
                  {language === 'bn' ? '✓ আপনার রিভিউ সফলভাবে যুক্ত হয়েছে!' : '✓ Review posted successfully!'}
                </p>
              )}
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('noReviewsYet')}</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{rev.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-amber-400">
                          {'★'.repeat(rev.rating)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
