import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    name: string;
    options: FilterOption[];
    selectedValue: string;
    onChange: (value: string) => void;
  }[];
  actions?: React.ReactNode;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  actions
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 bg-[#0e1219] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      {/* Filters and Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map((filter, idx) => (
          <div key={idx} className="relative">
            <select
              value={filter.selectedValue}
              onChange={(e) => filter.onChange(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2.5 bg-[#0e1219] border border-white/10 rounded-xl text-xs text-zinc-300 hover:text-white focus:outline-none focus:border-rose-500/50 cursor-pointer transition-all"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0e1219] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>
        ))}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
