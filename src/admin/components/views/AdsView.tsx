import React, { useState } from 'react';
import { Megaphone, Plus, Eye, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AddAdModal } from '../modals/AddAdModal';
import { AdStatus } from '../../types/adminTypes';

export const AdsView: React.FC = () => {
  const { advertisements, toggleAdStatus } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = advertisements.filter((ad) => activeTab === 'all' || ad.status === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Advertisement Campaigns & Monetization
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage sponsor pre-rolls, banners, and interactive modal popups for free-tier streamers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Advertisement</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        {(['all', 'active', 'scheduled', 'expired'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'all' ? 'All Campaigns' : `${tab} Ads`}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ad) => (
          <div
            key={ad.id}
            className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all group"
          >
            <div>
              {/* Media Preview Box */}
              <div className="relative h-44 bg-black/60 overflow-hidden border-b border-white/5">
                <img
                  src={ad.previewUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/10">
                    {ad.type} Ad
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <AdminStatusBadge status={ad.status} type="ad" />
                </div>
              </div>

              {/* Ad Info */}
              <div className="p-5">
                <h4 className="text-sm font-bold text-white truncate">{ad.title}</h4>
                <a
                  href={ad.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 mt-1 truncate max-w-full"
                >
                  <span className="truncate">{ad.targetUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-black/40 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Impressions:</span>
                    <span className="font-bold text-white font-mono">
                      {ad.impressions.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Clicks:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {ad.clicks.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-zinc-400">
                  <span>Schedule: </span>
                  <span className="text-zinc-300 font-mono">
                    {ad.startDate} ~ {ad.endDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => toggleAdStatus(ad.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  ad.status === 'active'
                    ? 'text-zinc-400 hover:text-white border-white/10 hover:bg-white/5'
                    : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                }`}
              >
                {ad.status === 'active' ? 'Pause Campaign' : 'Resume'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => alert(`Edit ${ad.title}`)}
                  className="p-1.5 text-zinc-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert(`Delete ${ad.title}`)}
                  className="p-1.5 text-zinc-400 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddAdModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
