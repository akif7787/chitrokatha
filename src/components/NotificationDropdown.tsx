import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Trash2,
  Check,
  Play,
  Film,
  X,
  Volume2,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

interface NotificationDropdownProps {
  onSelectMovieById?: (movieId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onSelectMovieById,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    triggerDemoNotification,
  } = useNotifications();
  const { language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer active:scale-95"
        title={language === 'bn' ? 'নোটিফিকেশন ও নতুন রিলিজ' : 'Notifications & Updates'}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold shadow-md shadow-rose-950/80 ring-2 ring-[#08090d] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Tray */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#0c0e18]/98 border border-white/15 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl p-3 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white font-cinzel">
                {language === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
                  {unreadCount} {language === 'bn' ? 'নতুন' : 'new'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  title={language === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all as read'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="p-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                  title={language === 'bn' ? 'সব মুছুন' : 'Clear all'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Simulation / Test Alert Trigger */}
          <div className="mb-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">
              {language === 'bn' ? 'টোস্ট নোটিফিকেশন পরীক্ষা:' : 'Test Toast Alert:'}
            </span>
            <button
              type="button"
              onClick={triggerDemoNotification}
              className="px-2 py-0.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold transition-all active:scale-95 cursor-pointer"
            >
              {language === 'bn' ? 'এলার্ট পাঠান' : 'Trigger Alert'}
            </button>
          </div>

          {/* List of Notifications */}
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">
                  {language === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No notifications yet'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {language === 'bn'
                    ? 'নতুন রিলিজ বা রিকোয়েস্ট আপডেট এখানে প্রদর্শিত হবে'
                    : 'New movie releases and request updates will appear here'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const title = language === 'bn' ? item.titleBn : item.titleEn;
                const message = language === 'bn' ? item.messageBn : item.messageEn;
                const isRelease = item.type === 'new_release';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.movieId && onSelectMovieById) {
                        onSelectMovieById(item.movieId);
                        setIsOpen(false);
                      }
                    }}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                      item.read
                        ? 'bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100 hover:bg-white/5'
                        : 'bg-rose-950/20 border-rose-500/30 hover:bg-rose-950/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt=""
                          className="w-9 h-12 object-cover rounded-lg bg-slate-900 border border-white/10 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isRelease
                              ? 'bg-rose-600/20 text-rose-400'
                              : 'bg-emerald-600/20 text-emerald-400'
                          }`}
                        >
                          {isRelease ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                            {title}
                          </h4>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                          {message}
                        </p>

                        {item.movieId && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{language === 'bn' ? 'চলচ্চিত্রটি দেখুন' : 'Watch Title'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
