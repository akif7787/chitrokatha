import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';
import { useLanguage } from '../context/LanguageContext';
import { useCarouselKeyboardNav } from '../hooks/useCarouselKeyboardNav';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer?: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  subtitle,
  badgeText,
  movies,
  onSelectMovie,
  onPlayTrailer,
}) => {
  const { language, getTitle } = useLanguage();
  const rowRef = useRef<HTMLDivElement>(null);
  const rowId = `movie-row-${(title || badgeText || 'catalog').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const { handleCardKeyDown } = useCarouselKeyboardNav({
    rowId,
    itemCount: movies.length,
    onSelectItem: (idx) => onSelectMovie(movies[idx]),
    scrollRef: rowRef,
  });

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section
      data-carousel-row-container="true"
      className="relative my-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 w-full focus-within:z-10"
    >
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-cinzel">
              {title}
            </h2>
            {badgeText && (
              <span className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* TV Keyboard Navigation Hint & Carousel Arrow Controls */}
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
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        role="region"
        aria-label={title}
        className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory pt-1 focus:outline-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            data-carousel-row={rowId}
            data-carousel-index={index}
            tabIndex={0}
            role="button"
            aria-label={`${getTitle(movie)}, ${movie.year}, ${movie.rating} IMDb. Press Enter to select.`}
            onKeyDown={(e) => handleCardKeyDown(e, index)}
            className="w-36 sm:w-44 md:w-52 shrink-0 snap-start rounded-2xl outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] focus-visible:scale-105 focus-visible:z-20"
          >
            <MovieCard
              movie={movie}
              onSelect={onSelectMovie}
              onPlayTrailer={onPlayTrailer}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
