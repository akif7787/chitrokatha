import React, { useState, useEffect } from 'react';
import { fetchActiveAdCampaigns } from '../services/adService';
import { AdminAdvertisement } from '../admin/types/adminTypes';
import { useAuth } from '../context/AuthContext';
import { Megaphone, ExternalLink, X } from 'lucide-react';

interface SponsorBannerPlacementProps {
  placement?: string;
  className?: string;
}

export const SponsorBannerPlacement: React.FC<SponsorBannerPlacementProps> = ({
  placement = 'homepage_hero',
  className = '',
}) => {
  const { isPremium } = useAuth();
  const [ad, setAd] = useState<AdminAdvertisement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // If VIP user, never load or show ads
    if (isPremium) {
      setAd(null);
      return;
    }

    async function loadAd() {
      try {
        const campaigns = await fetchActiveAdCampaigns(placement);
        if (campaigns && campaigns.length > 0) {
          setAd(campaigns[0]);
        } else {
          setAd(null);
        }
      } catch (err) {
        console.warn('[SponsorBannerPlacement] Notice:', err);
      }
    }

    loadAd();
  }, [placement, isPremium]);

  if (isPremium || !ad || isDismissed) {
    return null;
  }

  return (
    <div className={`w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 my-6 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-black to-slate-950 border border-white/10 shadow-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Badge & Media */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {ad.previewUrl && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
              {ad.mediaType === 'video' ? (
                <video
                  src={ad.previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={ad.previewUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-amber-400 text-black">
                Sponsored Partner
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white truncate">{ad.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
              ChitroKatha Streaming Sponsor • Ad-free option available with VIP
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {ad.targetUrl && ad.targetUrl !== '#' && (
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Learn More</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss sponsor banner"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
