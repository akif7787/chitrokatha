import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Crown, SkipForward, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchActiveAdCampaigns } from '../services/adService';
import { AdminAdvertisement } from '../admin/types/adminTypes';

interface AdPlayerOverlayProps {
  onAdComplete: () => void;
}

export const AdPlayerOverlay: React.FC<AdPlayerOverlayProps> = ({ onAdComplete }) => {
  const { openSubscriptionModal } = useAuth();
  const { language } = useLanguage();

  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAd, setActiveAd] = useState<AdminAdvertisement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load real active campaign for video player
  useEffect(() => {
    async function loadCampaign() {
      try {
        const ads = await fetchActiveAdCampaigns('video_player');
        if (ads && ads.length > 0) {
          // Prefer video type, otherwise take first active
          const videoAd = ads.find((a) => a.type === 'video' || a.mediaType === 'video') || ads[0];
          setActiveAd(videoAd);
        }
      } catch (err) {
        console.warn('Ad fetch notice:', err);
      }
    }
    loadCampaign();
  }, []);

  useEffect(() => {
    // 5-second exact countdown for skip ad
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Try playing ad video unmuted or muted based on browser autoplay policy
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback to muted autoplay if browser blocks audio autoplay
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [activeAd]);

  const progressPercent = ((5 - secondsRemaining) / 5) * 100;

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Full Commercial Video Background */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
        {activeAd && (activeAd.type === 'image' || activeAd.mediaType === 'image') ? (
          <img
            src={activeAd.previewUrl}
            alt={activeAd.title}
            className="w-full h-full object-cover brightness-90"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            src={activeAd?.previewUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"}
            className="w-full h-full object-cover brightness-90"
          />
        )}
        {/* Subtle Dark Vignette for Overlay Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Top Bar with Ad Badge, Countdown & Sound Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-md bg-amber-400 text-black uppercase tracking-wider shadow-lg">
            ADVERTISEMENT
          </span>
          <span className="text-xs font-semibold text-white/90 drop-shadow hidden sm:inline font-cinzel">
            {language === 'bn' ? 'চিত্রকথা পার্টনার স্পনসর' : 'ChitroKatha Partner Sponsor'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
              }
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-xl bg-black/75 hover:bg-black text-white border border-white/20 transition-all cursor-pointer shadow-lg active:scale-90"
            title={isMuted ? 'সাউন্ড চালু করুন' : 'মিউট করুন'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Top 5-second Linear Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Center Commercial Promotion Card */}
      <div className="relative z-10 max-w-lg bg-black/85 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/20 shadow-2xl space-y-2.5 mx-auto text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-rose-400 font-cinzel font-bold text-sm sm:text-base">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{activeAd ? activeAd.title : (language === 'bn' ? 'বিজ্ঞাপনমুক্ত ৪কে আল্ট্রা এইচডি ও ডলবি সাউন্ড' : 'Ad-Free 4K Ultra HD & Dolby Sound')}</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-light">
          {activeAd && activeAd.targetUrl && activeAd.targetUrl !== '#' ? (
            <a
              href={activeAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-medium"
            >
              <span>{language === 'bn' ? 'বিজ্ঞাপনদাতার ওয়েবসাইটে যান' : 'Visit Sponsor Website'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : language === 'bn'
            ? 'বিকাশ, নগদ বা রকেটে সেন্ড মানি করে চিত্রকথা ভিআইপি মেম্বারশিপ নিন (মাত্র ৳৯৯ থেকে) এবং সমস্ত বিজ্ঞাপন স্থায়ীভাবে বন্ধ করুন!'
            : 'Upgrade to ChitroKatha VIP starting at ৳99 via bKash, Nagad or Rocket to eliminate all ads forever!'}
        </p>
      </div>

      {/* Bottom Bar: Upgrade CTA & 5s Skip Ad Button */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/20 shadow-2xl">
        <button
          type="button"
          onClick={openSubscriptionModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-xs rounded-xl shadow-xl shadow-amber-950/60 transition-all active:scale-95 cursor-pointer"
        >
          <Crown className="w-4 h-4" />
          <span>{language === 'bn' ? 'বিজ্ঞাপন বন্ধ করতে ভিআইপি নিন (৳৯৯)' : 'Remove Ads with VIP (৳99)'}</span>
        </button>

        <div className="flex items-center justify-end">
          {canSkip ? (
            <button
              type="button"
              onClick={onAdComplete}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-2xl shadow-rose-950/80 transition-all cursor-pointer active:scale-95 animate-pulse"
            >
              <span>{language === 'bn' ? 'বিজ্ঞাপন এড়িয়ে যান (Skip Ad)' : 'Skip Ad'}</span>
              <SkipForward className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <div className="w-full sm:w-auto px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl text-xs font-mono font-bold text-slate-200 border border-white/15 flex items-center justify-center gap-1.5 shadow-lg">
              <span>{language === 'bn' ? 'বিজ্ঞাপন চলছে...' : 'Ad Playing...'}</span>
              <span className="text-amber-400 text-sm font-black px-1.5 py-0.5 rounded bg-black/60">
                {secondsRemaining}s
              </span>
              <span>{language === 'bn' ? 'পর স্কিপ করুন' : 'to skip'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
