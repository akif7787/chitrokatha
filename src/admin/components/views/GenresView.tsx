import React, { useState } from 'react';
import { Layers, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminFilterBar } from '../common/AdminFilterBar';

export const GenresView: React.FC = () => {
  const { genres } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = genres.filter(
    (g) =>
      g.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nameBn.includes(searchTerm) ||
      g.slug.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Genres & Taxonomies (চলচ্চিত্রের ধরন)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Categorize cinema into Action, Romance, Classic, Thriller, and more.
          </p>
        </div>

        <button
          onClick={() => alert('Add Genre Modal (Phase 1 UI)')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Genre</span>
        </button>
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search genre name or slug..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((genre) => (
          <div
            key={genre.id}
            className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-rose-400">
                  <Layers className="w-4 h-4" />
                </div>
                {genre.featured && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white">{genre.nameEn}</h4>
              <p className="text-xs text-rose-400 font-medium">{genre.nameBn}</p>
              <p className="text-[10px] font-mono text-zinc-500 mt-1">slug: /{genre.slug}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                {genre.count} Content Titles
              </span>
              <div className="flex items-center gap-1">
                <button
                  title="Edit"
                  onClick={() => alert(`Edit ${genre.nameEn}`)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  title="Delete"
                  onClick={() => alert(`Delete ${genre.nameEn}`)}
                  className="p-1 text-zinc-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
