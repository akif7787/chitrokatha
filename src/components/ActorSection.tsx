import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Star, Tv } from 'lucide-react';
import { Actor, popularActors } from '../data/actorsData';
import { useLanguage } from '../context/LanguageContext';
import { useCarouselKeyboardNav } from '../hooks/useCarouselKeyboardNav';

interface ActorSectionProps {
  onSelectActor: (actor: Actor) => void;
}

export const ActorSection: React.FC<ActorSectionProps> = ({ onSelectActor }) => {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowId = 'actors-carousel';

  const { handleCardKeyDown } = useCarouselKeyboardNav({
    rowId,
    itemCount: popularActors.length,
    onSelectItem: (idx) => onSelectActor(popularActors[idx]),
    scrollRef,
  });

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
      className="relative px-4 sm:px-6 lg:px-8 py-8 focus-within:z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
              <span>{language === 'bn' ? 'জনপ্রিয় অভিনেতা ও অভিনেত্রী' : 'Iconic Stars & Cast'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bn' ? 'পছন্দের তারকার ওপর ক্লিক করে তাদের সকল সিনেমা ও নাটক দেখুন' : 'Explore cinema and natoks by your favorite actors'}
            </p>
          </div>
        </div>

        {/* TV Navigation Hint & Scroll Arrows */}
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

      {/* Actors Horizontal List */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Popular Actors Carousel"
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 -my-3 focus:outline-none"
      >
        {popularActors.map((actor, idx) => {
          const actorName = language === 'bn' ? actor.nameBn : actor.nameEn;
          const actorRole = language === 'bn' ? actor.roleBn.split('·')[0] : actor.roleEn.split('·')[0];

          return (
            <div
              key={actor.id}
              data-carousel-row={rowId}
              data-carousel-index={idx}
              tabIndex={0}
              role="button"
              aria-label={`${actorName}, ${actorRole}. Press Enter to view filmography.`}
              onKeyDown={(e) => handleCardKeyDown(e, idx)}
              onClick={() => onSelectActor(actor)}
              className="group flex flex-col items-center shrink-0 cursor-pointer space-y-2.5 text-center transition-all duration-300 hover:-translate-y-1 select-none p-1 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] focus-visible:scale-105 focus-visible:z-20"
            >
              {/* Circular Glowing Portrait */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-700 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-rose-950/60 transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-black">
                  <img
                    src={actor.photo}
                    alt={actor.nameBn}
                    className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Actor Name & Role */}
              <div className="max-w-[100px] sm:max-w-[120px] space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate font-cinzel">
                  {actorName}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {actorRole}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
