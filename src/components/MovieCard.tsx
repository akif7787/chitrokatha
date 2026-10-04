import React, { useState } from 'react';
import { Play, Heart, Bookmark, Check, Film, Crown, Sparkles, Share2 } from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchlist } from '../context/WatchlistContext';
import { StarRatingWidget } from './StarRatingWidget';
import { getCachedPoster } from '../services/offlineCacheDB';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onPlayTrailer?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onPlayTrailer,
}) => {
  const { getTitle, getGenres, language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [imgError, setImgError] = useState(false);
  const [offlinePoster, setOfflinePoster] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${movie.id}`;
    const shareText =
      language === 'bn'
        ? `ChitroKatha-তে "${title}" সিনেমাটি দেখুন!`
        : `Watch "${title}" on ChitroKatha!`;

    // 1. Trigger Native Web Share dialog if supported
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        // If aborted/cancelled by user, exit cleanly
        if (err?.name === 'AbortError') return;
      }
    }

    // 2. Fallback: Copy link to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback silent handle
    }
  };

  const handleImageError = () => {
    // If online load failed, check if we have the poster cached offline in IndexedDB
    getCachedPoster(movie.id).then((cached) => {
      if (cached) {
        setOfflinePoster(cached);
      } else {
        setImgError(true);
      }
    }).catch(() => setImgError(true));
  };

  const favorited = isFavorite(movie.id);
  const inWatchlist = isInWatchlist(movie.id);
  const title = getTitle(movie);
  const genres = getGenres(movie);

  return (
    <div className="group relative flex flex-col cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.025]">
      {/* Subtle Ambient Backlight Glow on Hover */}
      <div
        className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-rose-600/0 via-amber-500/0 to-rose-500/0 group-hover:from-rose-600/40 group-hover:via-amber-500/25 group-hover:to-rose-500/40 blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Poster Image Container with Glowing Border */}
      <div
        onClick={() => onSelect(movie)}
        className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg group-hover:border-rose-500/80 group-hover:ring-1 group-hover:ring-rose-400/50 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.35),0_15px_30px_-5px_rgba(0,0,0,0.85)] transition-all duration-300 transform-gpu"
      >
        {!imgError ? (
          <img
            src={offlinePoster || movie.poster}
            alt={title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 group-hover:brightness-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-950 text-center">
            <Film className="w-10 h-10 text-rose-500/60 mb-2" />
            <span className="text-xs font-cinzel text-slate-300 line-clamp-2">{title}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">{movie.year}</span>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[10px] font-mono text-slate-200 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 font-bold">
            {movie.quality}
          </span>

          {/* Quick Actions: Share, Watchlist Bookmark, and Favorite Heart */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Share Social Media Button */}
            <button
              type="button"
              onClick={handleShare}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 opacity-100 ring-2 ring-emerald-400/50'
                  : 'bg-black/60 text-slate-300 hover:text-cyan-300 hover:bg-black/90 opacity-0 group-hover:opacity-100'
              }`}
              title={copied ? (language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (language === 'bn' ? 'শেয়ার করুন (Share)' : 'Share Movie')}
              aria-label="Share Movie"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Watchlist Bookmark Button (Subtle, visible on hover or when added) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(movie);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                inWatchlist
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-900/50 opacity-100'
                  : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100'
              }`}
              title={inWatchlist ? 'ওয়াচলিস্ট থেকে মুছুন' : 'ওয়াচলিস্টে যোগ করুন'}
              aria-label="Toggle Watchlist"
            >
              {inWatchlist ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Top-Tier Favorite Heart Button (Always accessible) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(movie);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-75 ${
                favorited
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/60 ring-2 ring-rose-400/50 scale-105'
                  : 'bg-black/65 text-slate-300 hover:text-rose-400 hover:bg-black/90'
              }`}
              title={favorited ? 'টপ ফেভারিট থেকে সরান' : 'শীর্ষ ফেভারিটে যোগ করুন (Favorite)'}
              aria-label="Toggle Favorite"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all ${
                  favorited ? 'fill-current text-white scale-110' : 'hover:scale-110'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Copied Feedback Toast */}
        {copied && (
          <div className="absolute top-10 right-2 z-20 px-2 py-1 rounded-lg bg-emerald-600 text-white font-mono text-[10px] font-bold shadow-xl border border-emerald-400/40 animate-in fade-in zoom-in-95 pointer-events-none flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!'}</span>
          </div>
        )}

        {/* Views Count / Category bottom indicator on image */}
        {movie.viewsCount && (
          <div className="absolute bottom-2 left-2 pointer-events-none z-10">
            <span className="text-[9px] font-mono text-slate-300 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
              {movie.viewsCount}
            </span>
          </div>
        )}

        {/* Hover Center Play Button overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-10">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(movie);
              }}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/50 hover:brightness-110 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              <span>{language === 'bn' ? 'দেখুন' : 'Watch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info beneath Card */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <StarRatingWidget
            movieId={movie.id}
            base10Rating={movie.rating}
            size="sm"
            compact={true}
            interactive={true}
            showCount={false}
          />
          <span className="tabular-nums text-slate-500 font-medium">{movie.year}</span>
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1 font-cinzel">
          {title}
        </h3>

        <p className="text-[10px] text-slate-400 line-clamp-1">
          {genres.slice(0, 2).join(' · ')}
        </p>
      </div>
    </div>
  );
};
