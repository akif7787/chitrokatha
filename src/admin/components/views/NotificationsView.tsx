import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, Clock, Users, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import {
  AdminNotificationItem,
  NotificationType,
  NotificationTarget,
} from '../../types/adminTypes';
import { broadcastNotificationToUsers } from '../../../services/adminNotificationService';

export const NotificationsView: React.FC = () => {
  const { notifications, refreshNotifications, currentAdmin, users } = useAdmin();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('promotion');
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('2026-10-05 18:00');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await broadcastNotificationToUsers({
        title: title.trim(),
        message: message.trim(),
        type,
        target,
        targetUserId: target === ('specific' as any) ? selectedUserId : undefined,
        adminUserId: currentAdmin.id,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `সফলভাবে সম্প্রচার সম্পন্ন হয়েছে (${res.sentCount} জন ব্যবহারকারীর কাছে পাঠানো হয়েছে)।`,
        });
        setTitle('');
        setMessage('');
        await refreshNotifications();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'সম্প্রচার পাঠাতে সমস্যা হয়েছে।',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'সম্প্রচার ব্যর্থ হয়েছে।',
      });
    } finally {
      setIsSending(false);
    }
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

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

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
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="all">All Users</option>
                  <option value="vip">VIP Members Only</option>
                  <option value="free">Free Tier Streamers</option>
                  <option value="specific">Specific User</option>
                </select>
              </div>
            </div>

            {target === ('specific' as any) && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Select User *
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              disabled={isSending || (target === ('specific' as any) && !selectedUserId)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Sending Broadcast...' : 'Broadcast Now'}</span>
            </button>
          </form>
        </div>

        {/* Right Table: Broadcast History */}
        <div className="lg:col-span-2 bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Broadcast History</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refreshNotifications()}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Refresh broadcast history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-zinc-400 font-mono">
                {notifications.length} Sent
              </span>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-zinc-500 my-auto">
              <Bell className="w-8 h-8 mb-2 opacity-30 text-rose-500" />
              <p className="text-xs font-medium text-zinc-400">No broadcasts sent yet</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Use the form to dispatch real-time alerts or promotions to users</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
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
                    <span className="font-mono text-[10px]">
                      {notif.scheduledDate ? new Date(notif.scheduledDate).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
