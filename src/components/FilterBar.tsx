import React from 'react';
import { ArrowDownWideNarrow, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type GenreFilter = 'all' | 'bangla' | 'action' | 'drama' | 'thriller' | 'scifi' | 'comedy' | 'mystery';
export type SortOption = 'trending' | 'rating' | 'newest';

interface FilterBarProps {
  selectedGenre: GenreFilter;
  onSelectGenre: (genre: GenreFilter) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedGenre,
  onSelectGenre,
  selectedSort,
  onSelectSort,
}) => {
  const { t } = useLanguage();

  const filterTabs: Array<{ id: GenreFilter; labelKey: string }> = [
    { id: 'all', labelKey: 'filterAll' },
    { id: 'bangla', labelKey: 'filterBangla' },
    { id: 'action', labelKey: 'filterAction' },
    { id: 'thriller', labelKey: 'filterThriller' },
    { id: 'drama', labelKey: 'filterDrama' },
    { id: 'scifi', labelKey: 'filterSciFi' },
    { id: 'mystery', labelKey: 'filterMystery' },
    { id: 'comedy', labelKey: 'filterComedy' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Genre Filter Segmented Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectGenre(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              selectedGenre === tab.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 font-semibold'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">{t('sortBy')}:</span>
        <select
          value={selectedSort}
          onChange={(e) => onSelectSort(e.target.value as SortOption)}
          aria-label={t('sortBy')}
          className="bg-white/5 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
        >
          <option value="trending" className="bg-[#090b10] text-slate-200">
            {t('sortTrending')}
          </option>
          <option value="rating" className="bg-[#090b10] text-slate-200">
            {t('sortRating')}
          </option>
          <option value="newest" className="bg-[#090b10] text-slate-200">
            {t('sortNewest')}
          </option>
        </select>
      </div>
    </div>
  );
};
