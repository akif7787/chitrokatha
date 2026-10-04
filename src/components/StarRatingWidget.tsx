import React, { useState } from 'react';
import { Star, Sparkles, Check } from 'lucide-react';
import { useRating } from '../context/RatingContext';
import { useLanguage } from '../context/LanguageContext';

interface StarRatingWidgetProps {
  movieId: string | number;
  base10Rating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showUserFeedback?: boolean;
  interactive?: boolean;
  compact?: boolean;
}

export const StarRatingWidget: React.FC<StarRatingWidgetProps> = ({
  movieId,
  base10Rating = 8.0,
  size = 'md',
  showCount = true,
  showUserFeedback = true,
  interactive = true,
  compact = false,
}) => {
  const { rateMovie, getCommunityRating, removeRating } = useRating();
  const { language } = useLanguage();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [justRated, setJustRated] = useState(false);

  const { average, count, userRating } = getCommunityRating(movieId, base10Rating);

  const handleRate = (e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    if (!interactive) return;

    if (userRating === star) {
      removeRating(movieId);
    } else {
      rateMovie(movieId, star);
      setJustRated(true);
      setTimeout(() => setJustRated(false), 2000);
    }
  };

  const starSizeClass =
    size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4';

  const displayedRating = hoverRating !== null ? hoverRating : userRating !== null ? userRating : average;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= Math.round(displayedRating);
            return (
              <button
                key={star}
                type="button"
                disabled={!interactive}
                onClick={(e) => handleRate(e, star)}
                onMouseEnter={() => interactive && setHoverRating(star)}
                onMouseLeave={() => interactive && setHoverRating(null)}
                className={`p-0.5 transition-all ${
                  interactive ? 'cursor-pointer hover:scale-125 active:scale-95' : 'cursor-default'
                }`}
                title={userRating ? `আপনার রেটিং: ${userRating}★ (পরিবর্তন করতে ক্লিক করুন)` : `${star} স্টার রেটিং দিন`}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`${starSizeClass} transition-colors ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                      : 'text-slate-600 fill-black/20'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono font-bold text-amber-300">
          {average.toFixed(1)}
        </span>

        {showCount && (
          <span className="text-[10px] text-slate-500 font-mono">
            ({count})
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 via-black/40 to-slate-900/40 border border-amber-500/20 backdrop-blur-md space-y-2.5 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{language === 'bn' ? 'কমিউনিটি রেটিং স্কোর' : 'Community Score'}</span>
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {average.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ ৫.০</span>
            {showCount && (
              <span className="text-xs text-slate-400 font-mono">
                · {count} {language === 'bn' ? 'টি ভোট' : 'votes'}
              </span>
            )}
          </div>
        </div>

        {/* User status badge */}
        {userRating !== null ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? `আপনার রেটিং: ${userRating}★` : `Your Rating: ${userRating}★`}</span>
          </div>
        ) : (
          <span className="text-[11px] text-amber-300/80 font-mono animate-pulse">
            {language === 'bn' ? 'রেটিং দিতে স্টার চাপুন' : 'Click a star to rate'}
          </span>
        )}
      </div>

      {/* Interactive 5-Star Row */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverRating !== null ? hoverRating : (userRating !== null ? userRating : Math.round(average)));
            const isUserSelected = userRating !== null && star <= userRating;

            return (
              <button
                key={star}
                type="button"
                onClick={(e) => handleRate(e, star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 sm:p-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group active:scale-90"
                title={`${star} স্টার দিন`}
                aria-label={`Rate ${star} of 5 stars`}
              >
                <Star
                  className={`${starSizeClass} transition-all duration-150 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400 group-hover:scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'text-slate-600 fill-black/30 group-hover:text-amber-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {userRating !== null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeRating(movieId);
            }}
            className="text-[10px] text-slate-400 hover:text-rose-400 font-mono transition-colors underline"
          >
            {language === 'bn' ? 'রেটিং মুছুন' : 'Remove Rating'}
          </button>
        )}
      </div>

      {/* Instant Feedback Notice */}
      {justRated && (
        <div className="text-[11px] text-emerald-400 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          ✓ {language === 'bn' ? 'আপনার রেটিং সফলভাবে সংরক্ষিত হয়েছে!' : 'Your rating was successfully recorded!'}
        </div>
      )}
    </div>
  );
};
