import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminContentItem } from '../../types/adminTypes';
import { Film, Plus } from 'lucide-react';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'movie' | 'drama' | 'series';
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'movie'
}) => {
  const { addContentItem } = useAdmin();

  const [contentType, setContentType] = useState<'movie' | 'drama' | 'series'>(defaultType);
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [year, setYear] = useState('2024');
  const [genre, setGenre] = useState('Action, Drama');
  const [language, setLanguage] = useState('Bangla');
  const [industry, setIndustry] = useState('Dhallywood');
  const [rating, setRating] = useState('8.5');
  const [runtime, setRuntime] = useState('2h 15m');
  const [poster, setPoster] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() && !titleBn.trim()) return;

    const newItem: AdminContentItem = {
      id: `cnt-${Date.now()}`,
      titleBn: titleBn.trim() || titleEn.trim(),
      titleEn: titleEn.trim() || titleBn.trim(),
      year: parseInt(year) || 2024,
      genre,
      genres: genre.split(',').map((g) => g.trim()),
      language,
      industry,
      rating: parseFloat(rating) || 8.0,
      runtime,
      poster:
        poster.trim() ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      isFeatured,
      views: '0',
      viewsCount: 0,
      type: contentType
    };

    addContentItem(newItem);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add New ${contentType === 'movie' ? 'Movie' : contentType === 'drama' ? 'Drama / Natok' : 'Web Series'}`}
      subtitle="Fill in the title and metadata for the streaming catalog"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Type Selector */}
        <div className="flex rounded-xl bg-[#090b10] p-1 border border-white/10">
          {(['movie', 'drama', 'series'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setContentType(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                contentType === t
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'series' ? 'Web Series' : t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Title (English) *
            </label>
            <input
              type="text"
              required
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Toofan"
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Title (বাংলা) *
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: তুফান"
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Rating (IMDb)</label>
            <input
              type="text"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Runtime</label>
            <input
              type="text"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              placeholder="e.g. 2h 25m"
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Genres</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Action, Crime, Thriller"
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            >
              <option value="Dhallywood">Dhallywood (বাংলাদেশ)</option>
              <option value="Tollywood">Tollywood (কলকাতা)</option>
              <option value="Hollywood">Hollywood</option>
              <option value="Bollywood">Bollywood</option>
              <option value="Natok">Bangla Natok</option>
              <option value="World">World Cinema</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Poster Image URL</label>
          <input
            type="url"
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="featuredCheck"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-black/40 border-white/20"
          />
          <label htmlFor="featuredCheck" className="text-xs text-zinc-300 cursor-pointer">
            Feature on Homepage Hero & VIP Banner
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Content</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
