import React, { useState } from 'react';
import {
  Film,
  Plus,
  Search,
  Filter,
  Star,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { AddMovieModal } from '../modals/AddMovieModal';
import { AdminPagination } from '../common/AdminPagination';

export const MoviesView: React.FC = () => {
  const { movies, deleteContentItem } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('latest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter movies
  const filtered = movies.filter((m) => {
    const matchesSearch =
      m.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.titleBn.includes(searchTerm) ||
      m.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry =
      industryFilter === 'all' || m.industry.toLowerCase() === industryFilter.toLowerCase();
    return matchesSearch && matchesIndustry;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === 'rating') return b.rating - a.rating;
    if (sortOption === 'year') return b.year - a.year;
    return b.viewsCount - a.viewsCount;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Movies Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage full-length feature films, Dhallywood blockbusters, Hollywood & World cinema.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Movie</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search movie title, বাংলা নাম or genre..."
        filters={[
          {
            name: 'Industry',
            selectedValue: industryFilter,
            onChange: setIndustryFilter,
            options: [
              { label: 'All Industries', value: 'all' },
              { label: 'Dhallywood (বাংলাদেশ)', value: 'dhallywood' },
              { label: 'Hollywood', value: 'hollywood' },
              { label: 'Tollywood (কলকাতা)', value: 'tollywood' }
            ]
          },
          {
            name: 'Sort By',
            selectedValue: sortOption,
            onChange: setSortOption,
            options: [
              { label: 'Most Viewed', value: 'views' },
              { label: 'Highest Rated', value: 'rating' },
              { label: 'Release Year', value: 'year' }
            ]
          }
        ]}
      />

      {/* Movies Table */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-medium">Movie</th>
                <th className="px-5 py-3.5 font-medium">Year</th>
                <th className="px-5 py-3.5 font-medium">Genre</th>
                <th className="px-5 py-3.5 font-medium">Language</th>
                <th className="px-5 py-3.5 font-medium">Rating</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Featured</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((movie) => (
                <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.poster}
                        alt={movie.titleEn}
                        className="w-10 h-14 object-cover rounded-lg bg-zinc-800 shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {movie.titleEn}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">{movie.titleBn}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {movie.runtime} • {movie.industry}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-300">{movie.year}</td>
                  <td className="px-5 py-3.5 text-zinc-300">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
                      {movie.genre}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{movie.language}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {movie.rating}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={movie.status} type="content" />
                  </td>
                  <td className="px-5 py-3.5">
                    {movie.isFeatured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Preview Movie"
                        onClick={() => alert(`Previewing ${movie.titleEn} (UI Mock)`)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Edit Movie"
                        onClick={() => alert(`Editing metadata for ${movie.titleEn} (UI Mock)`)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete Movie"
                        onClick={() => deleteContentItem('movie', movie.id)}
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

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sorted.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Movie Modal */}
      <AddMovieModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType="movie"
      />
    </div>
  );
};
