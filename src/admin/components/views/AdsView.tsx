import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, ExternalLink, Calendar, MapPin, Film, FileText, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminEmptyState } from '../common/AdminEmptyState';
import { AddAdModal } from '../modals/AddAdModal';
import { AdStatus } from '../../types/adminTypes';

export const AdsView: React.FC = () => {
  const { advertisements, toggleAdStatus, deleteAd } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = advertisements.filter((ad) => activeTab === 'all' || ad.status === activeTab);

  const handleDelete = async (id: string, title: string, storagePath?: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete campaign "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteAd(id, storagePath);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Advertisement Campaigns & Monetization
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real campaign creatives stored securely on Supabase Storage. Broadcasted to free-tier viewers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        {(['all', 'active', 'paused', 'expired'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'all' ? `All Campaigns (${advertisements.length})` : `${tab} Ads`}
          </button>
        ))}
      </div>

      {/* Cards Grid or Empty State */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          title={advertisements.length === 0 ? 'No advertisement campaigns yet' : `No ${activeTab} campaigns`}
          description="Create your first sponsor campaign by uploading a banner, video, or PDF creative."
          actionText="Create Campaign"
          onAction={() => setIsAddModalOpen(true)}
          icon={<Megaphone className="w-10 h-10 text-zinc-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ad) => (
            <div
              key={ad.id}
              className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all group"
            >
              <div>
                {/* Media Preview Box */}
                <div className="relative h-44 bg-black/60 overflow-hidden border-b border-white/5 flex items-center justify-center">
                  {ad.mediaType === 'video' ? (
                    <video
                      src={ad.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : ad.mediaType === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <FileText className="w-12 h-12 text-rose-500" />
                      <span className="text-xs font-mono">PDF Creative Document</span>
                    </div>
                  ) : (
                    <img
                      src={ad.previewUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                      {ad.mediaType === 'video' ? (
                        <Film className="w-3 h-3 text-rose-400" />
                      ) : ad.mediaType === 'pdf' ? (
                        <FileText className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-blue-400" />
                      )}
                      <span>{ad.mediaType || ad.type}</span>
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <AdminStatusBadge status={ad.status} type="ad" />
                  </div>
                </div>

                {/* Ad Info */}
                <div className="p-5">
                  <h4 className="text-sm font-bold text-white truncate">{ad.title}</h4>
                  {ad.targetUrl && ad.targetUrl !== '#' ? (
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 mt-1 truncate max-w-full"
                    >
                      <span className="truncate">{ad.targetUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-zinc-500 mt-1">No target URL set</p>
                  )}

                  {/* Placement slot */}
                  {ad.placement && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="font-mono text-zinc-300 capitalize">
                        {ad.placement.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="font-mono text-zinc-400">
                      {ad.startDate} ~ {ad.endDate}
                    </span>
                  </div>

                  {/* Analytics Note */}
                  <div className="mt-4 p-2.5 bg-black/40 border border-white/5 rounded-xl text-center">
                    <span className="text-[11px] text-zinc-400 italic">No analytics data yet</span>
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
                      : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                >
                  {ad.status === 'active' ? 'Pause Campaign' : 'Resume'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    disabled={deletingId === ad.id}
                    onClick={() => handleDelete(ad.id, ad.title, ad.storagePath)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 disabled:opacity-50 transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAdModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
