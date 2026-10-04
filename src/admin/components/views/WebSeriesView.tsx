import React, { useState } from 'react';
import { Clapperboard, Plus, Star, Edit2, Trash2, Eye } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { AddMovieModal } from '../modals/AddMovieModal';
import { AdminPagination } from '../common/AdminPagination';

export const WebSeriesView: React.FC = () => {
  const { webSeries, deleteContentItem } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = webSeries.filter((s) =>
    s.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.titleBn.includes(searchTerm) ||
    s.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Web Series & Originals
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage multi-episode OTT web series, seasons, and streaming episodes.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Web Series</span>
        </button>
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search web series or episode title..."
      />

      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-medium">Series</th>
                <th className="px-5 py-3.5 font-medium">Seasons & Eps</th>
                <th className="px-5 py-3.5 font-medium">Genre</th>
                <th className="px-5 py-3.5 font-medium">Rating</th>
                <th className="px-5 py-3.5 font-medium">Views</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((series) => (
                <tr key={series.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={series.poster}
                        alt={series.titleEn}
                        className="w-10 h-14 object-cover rounded-lg bg-zinc-800 shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {series.titleEn}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">{series.titleBn}</div>
                        <div className="text-[10px] text-rose-400 font-medium">ChitroKatha Original</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-300">{series.runtime}</td>
                  <td className="px-5 py-3.5 text-zinc-300">{series.genre}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {series.rating}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">{series.views}</td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={series.status} type="content" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Preview"
                        onClick={() => alert(`Previewing ${series.titleEn}`)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => alert(`Editing ${series.titleEn}`)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => deleteContentItem('series', series.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <AddMovieModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType="series"
      />
    </div>
  );
};
