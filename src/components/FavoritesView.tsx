import React, { useState, useMemo } from 'react';
import { Heart, Play, Trash2, Film, Sparkles, Tv, Clapperboard, ArrowRight, Database, CheckCircle2 } from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { MovieCard } from './MovieCard';

interface FavoritesViewProps {
  onSelectMovie: (movie: Movie) => void;
  onExplore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectMovie,
  onExplore,
}) => {
  const { language } = useLanguage();
  const { favorites, clearFavorites, removeFromFavorites } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'drama' | 'series'>('all');

  const movieCount = favorites.filter(
    (m) => m.contentType === 'movie' || (!m.contentType && (m.category === 'bangla' || m.category === 'bollywood' || m.category === 'hollywood'))
  ).length;

  const dramaCount = favorites.filter(
    (m) => m.contentType === 'drama' || (!m.contentType && m.category === 'natok')
  ).length;

  const seriesCount = favorites.filter(
    (m) => m.contentType === 'series' || (!m.contentType && m.category === 'series')
  ).length;

  const filteredFavorites = useMemo(() => {
    if (activeFilter === 'movie') {
      return favorites.filter(
        (m) => m.contentType === 'movie' || (!m.contentType && (m.category === 'bangla' || m.category === 'bollywood' || m.category === 'hollywood'))
      );
    }
    if (activeFilter === 'drama') {
      return favorites.filter(
        (m) => m.contentType === 'drama' || (!m.contentType && m.category === 'natok')
      );
    }
    if (activeFilter === 'series') {
      return favorites.filter(
        (m) => m.contentType === 'series' || (!m.contentType && m.category === 'series')
      );
    }
    return favorites;
  }, [favorites, activeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel tracking-tight flex items-center gap-2.5">
                <span>{language === 'bn' ? 'টপ ফেভারিটস' : 'Top-Tier Favorites'}</span>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-600/20 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {language === 'bn'
                  ? 'আপনার হৃদয়ের সবচেয়ে কাছের সিনেমা, নাটক ও ওয়েব সিরিজের স্থায়ী বুকমার্ক সংগ্রহ।'
                  : 'Your permanently saved, all-time favorite titles with instant access.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Offline Cached Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অফলাইন ক্যাশ সক্রিয়' : 'Offline Cached'}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে সকল ফেভারিট মুছে ফেলতে চান?' : 'Clear all saved favorites?')) {
                  clearFavorites();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সব মুছে ফেলুন' : 'Clear All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Category Filter Tabs (when favorites exist) */}
      {favorites.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeFilter === 'all'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'সব প্রিয়' : 'All Favorites'} ({favorites.length})
          </button>

          {movieCount > 0 && (
            <button
              onClick={() => setActiveFilter('movie')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeFilter === 'movie'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'মুভি' : 'Movies'} ({movieCount})</span>
            </button>
          )}

          {dramaCount > 0 && (
            <button
              onClick={() => setActiveFilter('drama')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeFilter === 'drama'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'নাটক' : 'Drama'} ({dramaCount})</span>
            </button>
          )}

          {seriesCount > 0 && (
            <button
              onClick={() => setActiveFilter('series')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeFilter === 'series'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ওয়েব সিরিজ' : 'Series'} ({seriesCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Grid or Empty State */}
      {favorites.length === 0 ? (
        <div className="text-center py-20 px-6 bg-gradient-to-b from-[#121019] to-[#0a0b12] rounded-3xl border border-rose-500/20 max-w-xl mx-auto space-y-5 shadow-2xl">
          <div className="relative w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-xl shadow-rose-950/60">
            <Heart className="w-10 h-10 fill-rose-500/30 animate-pulse" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute top-2 right-2 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white font-cinzel">
              {language === 'bn' ? 'আপনার ফেভারিট তালিকা খালি' : 'No Favorites Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              {language === 'bn'
                ? 'যেকোনো সিনেমা বা নাটকের ওপরের হার্ট (❤️) আইকনে ক্লিক করে আপনার সবচেয়ে প্রিয় কনটেন্টগুলোকে আলাদাভাবে ফেভারিট হিসেবে সংরক্ষণ করুন।'
                : 'Click the heart (❤️) icon on any movie or drama card to bookmark it as a permanent top-tier favorite.'}
            </p>
          </div>

          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-rose-950/50 transition-all active:scale-95"
          >
            <span>{language === 'bn' ? 'সিনেমা এক্সপ্লোর করুন' : 'Explore Movies'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <p className="text-sm">এই ক্যাটাগরিতে কোনো ফেভারিট পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredFavorites.map((movie) => (
            <div key={movie.id} className="relative group">
              <MovieCard movie={movie} onSelect={onSelectMovie} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
