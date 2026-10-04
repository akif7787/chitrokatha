import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminAdvertisement, AdType } from '../../types/adminTypes';
import { Megaphone, Plus } from 'lucide-react';

interface AddAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAdModal: React.FC<AddAdModalProps> = ({ isOpen, onClose }) => {
  const { addAdvertisement } = useAdmin();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<AdType>('banner');
  const [previewUrl, setPreviewUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAd: AdminAdvertisement = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      type,
      previewUrl:
        previewUrl.trim() ||
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80',
      targetUrl: targetUrl.trim() || 'https://chitrokatha.com',
      startDate,
      endDate,
      status: 'active',
      impressions: 0,
      clicks: 0
    };

    addAdvertisement(newAd);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Advertisement Campaign"
      subtitle="Configure sponsored banner, video ad or modal popup"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Campaign Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Robi 4.5G Streaming Partnership"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Ad Format</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AdType)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          >
            <option value="video">In-stream Video Ad (Pre-roll/Mid-roll)</option>
            <option value="banner">Homepage Hero Banner</option>
            <option value="popup">Interactive Modal Popup</option>
            <option value="image">Sidebar / In-feed Image</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Banner / Media URL</label>
          <input
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Target Click URL</label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://brand.com/campaign"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
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
            <span>Launch Ad</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
