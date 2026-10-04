import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, Film, Play, Bell, Crown, AlertTriangle, Pause } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { ActiveToast } from '../types/notification';

interface NotificationToastContainerProps {
  onSelectMovieById?: (movieId: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  onSelectMovieById,
}) => {
  const { activeToasts, dismissToast, markAsRead } = useNotifications();
  const { language } = useLanguage();

  if (activeToasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[92vw] sm:max-w-md w-full"
      aria-live="polite"
      aria-label="Notification alerts"
    >
      {activeToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          language={language}
          onDismiss={() => dismissToast(toast.id)}
          onAction={(movieId) => {
            markAsRead(toast.id);
            dismissToast(toast.id);
            if (onSelectMovieById && movieId) {
              onSelectMovieById(movieId);
            }
          }}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ActiveToast;
  language: string;
  onDismiss: () => void;
  onAction: (movieId?: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  language,
  onDismiss,
  onAction,
}) => {
  const duration = toast.duration || 6500;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [duration, isPaused, onDismiss]);

  const title = language === 'bn' ? toast.titleBn : toast.titleEn;
  const message = language === 'bn' ? toast.messageBn : toast.messageEn;
  const isRelease = toast.type === 'new_release';
  const isSystem = toast.type === 'system';
  const isCancel = title.includes('বাতিল') || title.includes('Cancel');
  const isVip = title.includes('ভিআইপি') || title.includes('VIP');
  const isPause = title.includes('পজ') || title.includes('Paused');

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-[#0c0f18]/98 border backdrop-blur-2xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
        isVip
          ? 'border-amber-500/60 shadow-amber-950/40 ring-1 ring-amber-500/40'
          : isCancel
          ? 'border-rose-500/60 shadow-rose-950/40 ring-1 ring-rose-500/40'
          : isPause
          ? 'border-amber-400/50 shadow-amber-950/30'
          : 'border-white/15 shadow-black/80 hover:border-rose-500/50'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Left Visual Icon / Thumbnail */}
        {toast.poster ? (
          <div className="relative shrink-0 w-11 h-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shadow-md">
            <img
              src={toast.poster}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isVip
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-950/50'
                : isCancel
                ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-md shadow-rose-950/50'
                : isPause
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : isRelease
                ? 'bg-rose-600/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isVip ? (
              <Crown className="w-5 h-5 text-amber-400" />
            ) : isCancel ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : isPause ? (
              <Pause className="w-5 h-5 text-amber-400" />
            ) : isRelease ? (
              <Sparkles className="w-5 h-5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        )}

        {/* Center Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                isVip
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : isCancel
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  : isPause
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isRelease
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isVip
                ? language === 'bn'
                  ? 'ভিআইপি মেম্বারশিপ'
                  : 'VIP Membership'
                : isCancel
                ? language === 'bn'
                  ? 'সাবস্ক্রিপশন বাতিল'
                  : 'Subscription Cancelled'
                : isPause
                ? language === 'bn'
                  ? 'সাবস্ক্রিপশন পজ'
                  : 'Subscription Paused'
                : isRelease
                ? language === 'bn'
                  ? 'নতুন মুক্তি'
                  : 'New Premiere'
                : language === 'bn'
                ? 'রিকোয়েস্ট আপডেট'
                : 'Request Update'}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1 font-cinzel">
            {title}
          </h4>

          <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed font-light">
            {message}
          </p>

          {/* Action CTAs */}
          {toast.movieId && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAction(toast.movieId)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-rose-950/50 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-3 h-3 fill-white ml-0.5" />
                <span>{language === 'bn' ? 'এখনই দেখুন' : 'Watch Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-Dismiss Linear Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className={`h-full transition-all duration-75 ${
            isVip
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : isCancel
              ? 'bg-gradient-to-r from-rose-500 to-rose-700'
              : isRelease
              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
