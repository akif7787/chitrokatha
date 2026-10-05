import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Film,
  X,
  Clock,
  Sparkles,
  Tv,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import {
  RecentlyWatchedItem,
  getRecentlyWatched,
  clearRecentlyWatched,
  saveRecentlyWatched,
} from '../services/recentlyWatched';
import { useCarouselKeyboardNav } from '../hooks/useCarouselKeyboardNav';

interface RecentlyWatchedRowProps {
  onSelectMovie: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

export const RecentlyWatchedRow: React.FC<RecentlyWatchedRowProps> = ({
  onSelectMovie,
  onPlay,
}) => {
  const { t, getTitle, getGenres, language } = useLanguage();
  const [items, setItems] = useState<RecentlyWatchedItem[]>(() => getRecentlyWatched());
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowId = 'recently-watched-row';

  const { handleCardKeyDown } = useCarouselKeyboardNav({
    rowId,
    itemCount: items.length,
    onSelectItem: (idx) => onSelectMovie(items[idx].movie),
    scrollRef,
  });

  // Sync state on custom event (when any movie is played or details opened)
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setItems(e.detail);
      } else {
        setItems(getRecentlyWatched());
      }
    };

    window.addEventListener('recently_watched_updated', handleUpdate);
    return () => window.removeEventListener('recently_watched_updated', handleUpdate);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, movieId: string | number) => {
    e.stopPropagation();
    const updated = items.filter((it) => String(it.movie.id) !== String(movieId));
    setItems(updated);
    saveRecentlyWatched(updated);
    window.dispatchEvent(new CustomEvent('recently_watched_updated', { detail: updated }));
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        language === 'bn'
          ? 'আপনি কি সম্প্রতি দেখা সিনেমার তালিকা মুছে ফেলতে চান?'
          : 'Are you sure you want to clear your recently watched history?'
      )
    ) {
      clearRecentlyWatched();
      setItems([]);
    }
  };

  // If no items, do not render or show empty state only if user previously interacted
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      data-carousel-row-container="true"
      className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 focus-within:z-10"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-500/20 flex items-center justify-center border border-rose-500/30 text-rose-400 shadow-md">
              <History className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-cinzel tracking-wide">
                {language === 'bn' ? 'সম্প্রতি দেখেছেন' : 'Recently Watched'}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold">
                {items.length}/10
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-light pl-10.5">
            {language === 'bn'
              ? 'আপনার ইন্টারঅ্যাক্ট করা বা দেখা শেষ ১০টি চলচ্চিত্র ও নাটক'
              : 'The last 10 movies and series you interacted with on ChitroKatha'}
          </p>
        </div>

        {/* Clear History & Scroll Arrows */}
        <div className="flex items-center gap-2">
          {/* TV Navigation Hint */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
            <Tv className="w-3 h-3 text-rose-400" />
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">←</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">→</kbd>
            <span>{language === 'bn' ? 'স্ক্রোল' : 'Navigate'}</span>
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">Enter</kbd>
            <span>{language === 'bn' ? 'দেখুন' : 'Select'}</span>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95"
            title={language === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear History'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {language === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear History'}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll('left')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-90"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-90"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Recently Watched Carousel"
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x focus:outline-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(({ movie, progressPercent, watchedAt }, index) => {
          const title = getTitle(movie);
          const genres = getGenres(movie);
          const progress = progressPercent || 60;

          return (
            <div
              key={movie.id}
              data-carousel-row={rowId}
              data-carousel-index={index}
              tabIndex={0}
              role="button"
              aria-label={`${title}, ${movie.year}, ${progress}% watched. Press Enter to play.`}
              onKeyDown={(e) => handleCardKeyDown(e, index)}
              onClick={() => onSelectMovie(movie)}
              className="group relative flex-none w-52 sm:w-60 bg-gradient-to-b from-[#111420] to-[#0a0c12] rounded-2xl border border-white/10 hover:border-rose-500/40 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 snap-start outline-none focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] focus-visible:scale-105 focus-visible:z-20"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={movie.backdrop || movie.poster}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Gradient Shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-rose-300 border border-white/10 backdrop-blur-md">
                    {movie.quality}
                  </span>

                  {/* Remove Single Item from Recently Watched */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(e, movie.id)}
                    className="p-1 rounded-full bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                    title={language === 'bn' ? 'হিস্ট্রি থেকে সরান' : 'Remove from recent'}
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Center Hover Resume Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-black/40 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(movie);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs shadow-xl shadow-rose-950/60 transform scale-90 group-hover:scale-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    <span>{language === 'bn' ? 'চলিয়ে যান' : 'Resume'}</span>
                  </button>
                </div>

                {/* Bottom Red Progress Bar (Netflix/Prime Video Style) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-r-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1 font-cinzel">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 shrink-0 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">{movie.year}</span>
                    <span>·</span>
                    <span className="truncate max-w-[100px]">{genres[0] || 'Drama'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{progress}%</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
