import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Flame, Tv } from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useCarouselKeyboardNav } from '../hooks/useCarouselKeyboardNav';

interface TrendingTop10RowProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

export const TrendingTop10Row: React.FC<TrendingTop10RowProps> = ({
  movies,
  onSelectMovie,
  onPlay,
}) => {
  const { language, getTitle } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowId = 'trending-top-10';

  const top10List = movies
    .filter((m) => m.isTop10)
    .sort((a, b) => (a.isTop10 || 99) - (b.isTop10 || 99))
    .slice(0, 10);

  const { handleCardKeyDown } = useCarouselKeyboardNav({
    rowId,
    itemCount: top10List.length,
    onSelectItem: (idx) => onSelectMovie(top10List[idx]),
    scrollRef,
  });

  if (top10List.length === 0) return null;

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
    <section
      data-carousel-row-container="true"
      className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 focus-within:z-10"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
              <span>{language === 'bn' ? 'আজকের সেরা ১০ সিনেমা ও নাটক' : 'Top 10 Trending Today'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bn' ? 'বাংলাদেশে সবচেয়ে বেশি দেখা হচ্ছে' : 'Most watched in Bangladesh today'}
            </p>
          </div>
        </div>

        {/* TV Keyboard Navigation Hint & Scroll Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
            <Tv className="w-3 h-3 text-rose-400" />
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">←</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">→</kbd>
            <span>{language === 'bn' ? 'স্ক্রোল' : 'Navigate'}</span>
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-200">Enter</kbd>
            <span>{language === 'bn' ? 'দেখুন' : 'Select'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Top 10 Trending"
        className="flex items-center gap-5 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-4 -my-4 focus:outline-none"
      >
        {top10List.map((movie, idx) => {
          const rank = idx + 1;
          const movieTitle = getTitle(movie);

          return (
            <div
              key={movie.id}
              data-carousel-row={rowId}
              data-carousel-index={idx}
              tabIndex={0}
              role="button"
              aria-label={`Rank #${rank}: ${movieTitle}, rating ${movie.rating}. Press Enter to view.`}
              onKeyDown={(e) => handleCardKeyDown(e, idx)}
              className="relative shrink-0 flex items-end group cursor-pointer outline-none rounded-2xl transition-all duration-200 focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] focus-visible:scale-105 focus-visible:z-30"
              onClick={() => onSelectMovie(movie)}
            >
              {/* Massive stylized number ranking */}
              <span className="font-cinzel text-7xl sm:text-8xl md:text-9xl font-black leading-none text-stroke select-none -mr-4 sm:-mr-6 z-0 text-transparent drop-shadow-lg opacity-85 group-hover:text-rose-600 transition-colors pointer-events-none">
                {rank}
              </span>

              {/* Poster Card */}
              <div className="relative w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl group-hover:scale-105 group-hover:border-rose-500/60 transition-all duration-300 z-10">
                <img
                  src={movie.poster}
                  alt={movieTitle}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Rating badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-amber-400">
                  ★ {movie.rating.toFixed(1)}
                </div>

                {/* Hover Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(movie);
                    }}
                    className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-950/70 hover:scale-110 transition-transform cursor-pointer"
                    aria-label={`Play ${movieTitle}`}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Title & Category bottom tag */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-0.5 pointer-events-none">
                  <span className="text-[9px] font-mono text-rose-400 font-bold uppercase">
                    {movie.category === 'natok' ? 'বাংলা নাটক' : movie.category === 'series' ? 'ওয়েব সিরিজ' : 'সিনেমা'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate font-cinzel">
                    {movieTitle}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
