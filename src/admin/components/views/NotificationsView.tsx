import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, Clock, Users, Sparkles, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import {
  AdminNotificationItem,
  NotificationType,
  NotificationTarget
} from '../../types/adminTypes';

export const NotificationsView: React.FC = () => {
  const { notifications, addNotification } = useAdmin();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('promotion');
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [scheduledDate, setScheduledDate] = useState('2026-10-05 18:00');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newNotif: AdminNotificationItem = {
      id: `notif-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      type,
      target,
      scheduledDate,
      status: 'sent',
      sentCount: target === 'all' ? 12480 : target === 'vip' ? 1240 : 11240
    };

    addNotification(newNotif);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
          Push Notifications & Broadcasts
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Send real-time alerts, movie release announcements, and VIP offers to subscribers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Create Notification */}
        <div className="lg:col-span-1 bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <Send className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-white">Create Broadcast</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Notification Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. নতুন সিনেমা মুক্তি পেয়েছে!"
                className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Message Body *
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement description..."
                className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="promotion">Promotion</option>
                  <option value="system">System Notice</option>
                  <option value="update">App Update</option>
                  <option value="alert">Security Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Target</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as NotificationTarget)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="all">All Users (12,480)</option>
                  <option value="vip">VIP Members Only</option>
                  <option value="free">Free Tier Streamers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Schedule</label>
              <input
                type="text"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Now</span>
            </button>
          </form>
        </div>

        {/* Right Table: Broadcast History */}
        <div className="lg:col-span-2 bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Broadcast History</h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {notifications.length} Sent
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                  <AdminStatusBadge status={notif.status} type="content" />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{notif.message}</p>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="capitalize font-medium text-rose-400 font-mono">
                      Target: {notif.target}
                    </span>
                    <span>•</span>
                    <span>Delivered: {notif.sentCount.toLocaleString()} devices</span>
                  </div>
                  <span className="font-mono">{notif.scheduledDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
