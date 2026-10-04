import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Radio, Film } from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { searchWatchmodeMovies } from '../services/watchmodeApi';
import { MovieCard } from './MovieCard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLocalMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  allLocalMovies,
  onSelectMovie,
}) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [watchmodeResults, setWatchmodeResults] = useState<Movie[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced WatchMode API search
  useEffect(() => {
    if (!query.trim()) {
      setWatchmodeResults([]);
      setIsLoadingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingApi(true);
      try {
        const results = await searchWatchmodeMovies(query);
        setWatchmodeResults(results);
      } catch (err) {
        console.error('WatchMode Search error:', err);
      } finally {
        setIsLoadingApi(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  // Filter local catalog
  const cleanQ = query.trim().toLowerCase();
  const localMatches = cleanQ
    ? allLocalMovies.filter((m) => {
        const tBn = (m.titleBn || '').toLowerCase();
        const tEn = (m.titleEn || '').toLowerCase();
        const synBn = (m.synopsisBn || '').toLowerCase();
        const synEn = (m.synopsisEn || '').toLowerCase();
        const dir = (m.director || '').toLowerCase();
        const castStr = (m.cast || []).join(' ').toLowerCase();

        return (
          tBn.includes(cleanQ) ||
          tEn.includes(cleanQ) ||
          synBn.includes(cleanQ) ||
          synEn.includes(cleanQ) ||
          dir.includes(cleanQ) ||
          castStr.includes(cleanQ)
        );
      })
    : [];

  const combinedResults = [
    ...localMatches,
    ...watchmodeResults.filter(
      (wr) => !localMatches.some((lm) => String(lm.id) === String(wr.id) || lm.imdbId === wr.imdbId)
    ),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-[#0d0f15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-[#090b10]">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'ওয়াচমোড (WatchMode) এপিআই থেকে সিনেমা খুঁজুন...'
                : 'Search any title via WatchMode API...'
            }
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none"
          />
          {isLoadingApi && (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs px-2.5"
          >
            {t('close')}
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="px-5 py-2 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {language === 'bn'
                ? 'ওয়াচমোড এপিআই লাইভ সার্চ সক্রিয় (WatchMode API)'
                : 'WatchMode API Live Search Active'}
            </span>
          </div>
          {query && (
            <span className="font-mono tabular-nums text-slate-400">
              {combinedResults.length} {t('resultsCount')}
            </span>
          )}
        </div>

        {/* Results Area */}
        <div className="p-5 overflow-y-auto flex-1">
          {query.trim() === '' ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Film className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm">
                {language === 'bn'
                  ? 'যেকোনো হলিউড, বলিউড, বাংলা বা আন্তর্জাতিক সিনেমার নাম লিখুন'
                  : 'Type any movie or show title to fetch live from WatchMode API'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['Inception', 'Interstellar', 'The Dark Knight', 'Avatar', 'Titanic', 'Hawa', 'Toofan', 'Batman'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="text-xs bg-white/5 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-700/50 border border-white/5 px-2.5 py-1 rounded text-slate-400 transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : combinedResults.length === 0 && !isLoadingApi ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <p className="text-base font-medium">{t('noMoviesFound')}</p>
              <p className="text-xs text-slate-500">{t('tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {combinedResults.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => {
                    onSelectMovie(movie);
                    onClose();
                  }}
                >
                  <MovieCard movie={movie} onSelect={onSelectMovie} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
