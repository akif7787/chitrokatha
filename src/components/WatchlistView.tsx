import React from 'react';
import { Bookmark, Play, Trash2, Clock, Film, Database, CheckCircle2 } from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useWatchlist } from '../context/WatchlistContext';
import { MovieCard } from './MovieCard';

interface WatchlistViewProps {
  onSelectMovie: (movie: Movie) => void;
  onExplore: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectMovie,
  onExplore,
}) => {
  const { t, language } = useLanguage();
  const { watchlist, history, removeFromWatchlist } = useWatchlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-amber-400" />
            <span>{t('navWatchlist')}</span>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {watchlist.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'bn'
              ? 'আপনার সংরক্ষিত ওয়াচলিস্ট—ইন্টারনেট বিচ্ছিন্ন থাকলেও IndexedDB ক্যাশ থেকে দেখতে পাবেন।'
              : 'Your saved watchlist—accessible even offline via persistent IndexedDB caching.'}
          </p>
        </div>

        {/* Offline Ready Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono self-start sm:self-auto">
          <Database className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'অফলাইন ক্যাশ সক্রিয়' : 'Offline Cached'}</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        </div>
      </div>

      {/* Watchlist Section */}
      {watchlist.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/5 rounded-2xl border border-white/5 max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{t('secWatchlistEmpty')}</h3>
            <p className="text-xs sm:text-sm text-slate-400">{t('secWatchlistEmptySub')}</p>
          </div>
          <button
            onClick={onExplore}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {language === 'bn' ? 'সিনেমা এক্সপ্লোর করুন' : 'Explore Movies'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {watchlist.map((movie) => (
            <div key={movie.id} className="relative group">
              <MovieCard movie={movie} onSelect={onSelectMovie} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(movie.id);
                }}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                title={language === 'bn' ? 'তালিকা থেকে সরান' : 'Remove from watchlist'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Continue Watching Section */}
      {history.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-cinzel">
              {t('secContinueWatching')}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.slice(0, 4).map((item) => (
              <div
                key={String(item.movieId)}
                className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Film className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block truncate max-w-[120px]">
                      ID: {item.movieId}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.lastWatched).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {item.progressPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
