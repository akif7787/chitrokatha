import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar,
  Bell,
  Check,
  Bookmark,
  Sparkles,
  Film,
  Clock,
  Flame,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useWatchlist } from '../context/WatchlistContext';
import { dispatchAppNotification } from '../context/NotificationContext';

interface ComingSoonSectionProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
}

export const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({
  movies,
  onSelectMovie,
  onPlayTrailer,
}) => {
  const { language, getTitle, getSynopsis } = useLanguage();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track movies for which reminder was toggled
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  // Filter movies that are marked as coming soon
  const comingSoonList = movies.filter((m) => m.isComingSoon);

  if (comingSoonList.length === 0) return null;

  const handleToggleReminder = (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    const id = String(movie.id);
    const newState = !reminders[id];
    setReminders((prev) => ({ ...prev, [id]: newState }));

    if (newState) {
      dispatchAppNotification({
        type: 'system',
        titleBn: '🔔 রিলিজ রিমাইন্ডার সেট করা হয়েছে!',
        titleEn: '🔔 Release Reminder Set!',
        messageBn: `"${movie.titleBn || movie.titleEn}" মুক্তি পাওয়ার সাথে সাথে আপনাকে নোটিফিকেশন পাঠানো হবে।`,
        messageEn: `You will be notified immediately when "${movie.titleEn || movie.titleBn}" releases.`,
      });
    }
  };

  const handleToggleWatchlist = (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-600/20 to-rose-700/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-950/30">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide">
                {language === 'bn' ? 'শীঘ্রই আসছে' : 'Coming Soon'}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                UPCOMING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'প্রেক্ষাগৃহে ও ওটিটিতে মুক্তির অপেক্ষায় থাকা বহুল প্রতীক্ষিত চলচ্চিত্র ও সিরিজ'
                : 'Most anticipated blockbuster releases arriving soon on ChitroKatha'}
            </p>
          </div>
        </div>

        {/* Scroll Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all cursor-pointer shadow-md active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all cursor-pointer shadow-md active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none snap-x relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {comingSoonList.map((movie) => {
          const inWatchlist = isInWatchlist(movie.id);
          const hasReminder = Boolean(reminders[String(movie.id)]);
          const expectedDate =
            language === 'bn'
              ? movie.expectedReleaseDateBn || movie.expectedReleaseDate || 'শীঘ্রই মুক্তি'
              : movie.expectedReleaseDate || movie.expectedReleaseDateBn || 'Coming Soon';

          return (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group relative shrink-0 w-[280px] sm:w-[340px] md:w-[380px] rounded-2xl bg-[#0d101a] border border-white/10 hover:border-amber-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col snap-start"
            >
              {/* Media Preview Box (Backdrop or Poster) */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={movie.backdrop || movie.poster}
                  alt={getTitle(movie)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d101a] via-black/40 to-transparent" />

                {/* Top Badge: Expected Release Date */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md text-amber-300 border border-amber-500/50 text-[11px] font-bold font-mono shadow-lg flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{expectedDate}</span>
                  </span>
                </div>

                {/* Quality / Resolution Tag */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold shadow-md">
                    {movie.quality}
                  </span>
                </div>

                {/* Center Play Trailer Hover Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrailer(movie);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-rose-950/80 hover:scale-105 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{language === 'bn' ? 'টিজার / ট্রেলার দেখুন' : 'Watch Trailer'}</span>
                  </button>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-mono">
                    <span>{movie.year}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400">{movie.genresBn?.slice(0, 2).join(', ') || movie.genres.slice(0, 2).join(', ')}</span>
                    {movie.viewsCount && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-400 font-semibold">{movie.viewsCount}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white font-cinzel leading-snug group-hover:text-amber-300 transition-colors line-clamp-1">
                    {getTitle(movie)}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                    {getSynopsis(movie)}
                  </p>

                  <div className="pt-1 text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500">{language === 'bn' ? 'পরিচালক: ' : 'Director: '}</span>
                    <span className="text-slate-300 font-medium">{movie.directorBn || movie.director}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500">{language === 'bn' ? 'কাস্ট: ' : 'Cast: '}</span>
                    <span className="text-slate-300 font-medium">
                      {(movie.castBn || movie.cast).slice(0, 3).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {/* Reminder Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReminder(e, movie)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer active:scale-95 ${
                      hasReminder
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <Bell className={`w-3.5 h-3.5 ${hasReminder ? 'fill-black' : ''}`} />
                    <span>{hasReminder ? (language === 'bn' ? 'রিমাইন্ডার সেট' : 'Reminder Set') : (language === 'bn' ? 'রিমাইন্ডার দিন' : 'Remind Me')}</span>
                  </button>

                  {/* Watchlist Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWatchlist(e, movie)}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                      inWatchlist
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
                    }`}
                    title={inWatchlist ? 'ওয়াচলিস্টে সংরক্ষিত' : 'ওয়াচলিস্টে যোগ করুন'}
                  >
                    {inWatchlist ? <Check className="w-4 h-4 text-rose-400 stroke-[2.5]" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  {/* Quick Trailer Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrailer(movie);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-600 hover:text-white text-slate-300 border border-white/10 transition-all cursor-pointer active:scale-95"
                    title={language === 'bn' ? 'ট্রেলার দেখুন' : 'Watch Trailer'}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
