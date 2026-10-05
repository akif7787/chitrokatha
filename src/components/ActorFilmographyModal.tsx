import React from 'react';
import { X, Play, Film, Heart, Star, Sparkles, Award } from 'lucide-react';
import { Actor } from '../data/actorsData';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';
import { useLanguage } from '../context/LanguageContext';

interface ActorFilmographyModalProps {
  actor: Actor | null;
  allMovies: Movie[];
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

export const ActorFilmographyModal: React.FC<ActorFilmographyModalProps> = ({
  actor,
  allMovies,
  onClose,
  onSelectMovie,
  onPlay,
}) => {
  const { language } = useLanguage();

  if (!actor) return null;

  // Filter movies that feature this actor
  const actorMovies = allMovies.filter((movie) => {
    const castList = [...(movie.cast || []), ...(movie.castBn || [])].map((c) =>
      c.toLowerCase()
    );
    const searchBn = actor.nameBn.toLowerCase();
    const searchEn = actor.nameEn.toLowerCase();

    // Matching by first name or full name
    const tokens = [...searchBn.split(' '), ...searchEn.split(' ')].filter((t) => t.length > 2);
    return (
      castList.some((c) => c.includes(searchBn) || c.includes(searchEn)) ||
      tokens.some((token) => castList.some((c) => c.includes(token)))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header with Actor Bio */}
        <div className="flex items-start justify-between border-b border-white/10 pb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-rose-500/60 shadow-xl shadow-rose-950/50">
              <img
                src={actor.photo}
                alt={actor.nameBn}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel">
                  {language === 'bn' ? actor.nameBn : actor.nameEn}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40">
                  STAR CAST
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                {language === 'bn' ? actor.roleBn : actor.roleEn}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {language === 'bn' ? actor.bioBn : actor.bioEn}
              </p>
              <p className="text-[11px] text-slate-400">
                <span className="text-rose-400 font-semibold">উল্লেখযোগ্য কাজ:</span> {actor.popularFor}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filmography Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-500" />
              <span>
                {language === 'bn'
                  ? `${actor.nameBn}-এর চলচ্চিত্র ও নাটক (${actorMovies.length})`
                  : `Titles featuring ${actor.nameEn} (${actorMovies.length})`}
              </span>
            </h3>
          </div>

          {actorMovies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2 bg-white/5 rounded-2xl">
              <Film className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">
                এই তারকার আরও কিছু জনপ্রিয় সিনেমা ও নাটক খুব শীঘ্রই প্ল্যাটফর্মে যুক্ত হচ্ছে!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {actorMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={onSelectMovie}
                  onPlayTrailer={onPlay}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
