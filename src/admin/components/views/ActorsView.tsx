import React, { useState } from 'react';
import { Award, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { AdminUserAvatar } from '../common/AdminUserAvatar';

export const ActorsView: React.FC = () => {
  const { actors } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = actors.filter(
    (a) =>
      a.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nameBn.includes(searchTerm) ||
      a.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Actors & Star Cast (তারকা ও অভিনয়শিল্পী)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage actor profiles, bios, filmographies, and star highlights.
          </p>
        </div>

        <button
          onClick={() => alert('Add Actor Modal (Phase 1 UI)')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Actor</span>
        </button>
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search actor name or industry..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((actor) => (
          <div
            key={actor.id}
            className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <AdminUserAvatar name={actor.nameEn} avatarUrl={actor.avatar} size="lg" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{actor.nameEn}</h4>
                <p className="text-xs text-rose-400 truncate font-medium">{actor.nameBn}</p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{actor.industry}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] block">Notable Works:</span>
                <span className="font-semibold text-white">{actor.worksCount} Movies / Dramas</span>
              </div>
              <AdminStatusBadge status={actor.status} type="user" />
            </div>

            <div className="mt-3 bg-black/40 rounded-xl p-2.5 text-[11px] text-zinc-400 truncate">
              <span className="text-zinc-500">Popular:</span> {actor.topMovie}
            </div>

            <div className="mt-4 flex items-center justify-end gap-1.5 pt-2">
              <button
                onClick={() => alert(`Editing actor ${actor.nameEn}`)}
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => alert(`View filmography for ${actor.nameEn}`)}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-lg transition-colors"
              >
                Filmography
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
