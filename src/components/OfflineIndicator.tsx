import React, { useState } from 'react';
import { WifiOff, Database, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#14121e]/95 border border-amber-500/40 text-amber-200 shadow-2xl backdrop-blur-xl ring-1 ring-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>{language === 'bn' ? 'অফলাইন মোড সক্রিয়' : 'Offline Mode Active'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </p>
            <p className="text-[11px] text-slate-300 leading-tight">
              {language === 'bn'
                ? 'ইন্টারনেট সংযোগ নেই। আপনার ওয়াচলিস্ট ও ফেভারিটস লোকাল IndexedDB ক্যাশ থেকে প্রদর্শিত হচ্ছে।'
                : 'Connection unstable. Serving your Watchlist & Favorites from local IndexedDB cache.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss offline notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
