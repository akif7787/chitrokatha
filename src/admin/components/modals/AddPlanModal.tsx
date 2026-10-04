import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminSubscriptionPlan } from '../../types/adminTypes';
import { Plus } from 'lucide-react';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlanModal: React.FC<AddPlanModalProps> = ({ isOpen, onClose }) => {
  const { addPlan } = useAdmin();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('149');
  const [durationDays, setDurationDays] = useState('30');
  const [durationLabel, setDurationLabel] = useState('30 Days');
  const [features, setFeatures] = useState('4K Ultra HD, 2 Devices, Ad-Free Streaming');
  const [badge, setBadge] = useState('New Plan');
  const [resolution, setResolution] = useState('4K UHD');
  const [adFree, setAdFree] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlan: AdminSubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: name.trim(),
      price: parseFloat(price) || 99,
      durationDays: parseInt(durationDays) || 30,
      durationLabel,
      features: features.split(',').map((f) => f.trim()),
      isActive: true,
      badge: badge.trim() || undefined,
      subscribersCount: 0,
      resolution,
      adFree
    };

    addPlan(newPlan);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription Plan"
      subtitle="Define pricing, duration and VIP benefits"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Plan Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 60 Days VIP Gold"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Price (৳ BDT) *</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (Days)</label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => {
                setDurationDays(e.target.value);
                setDurationLabel(`${e.target.value} Days`);
              }}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Promo Badge</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="e.g. Special Offer"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Features (Comma-separated)
          </label>
          <textarea
            rows={2}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="adFreeCheck"
            checked={adFree}
            onChange={(e) => setAdFree(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 bg-black/40 border-white/20"
          />
          <label htmlFor="adFreeCheck" className="text-xs text-zinc-300 cursor-pointer">
            100% Ad-Free Experience
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
            <span>Create Plan</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
