import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem, ActiveToast, NotificationType } from '../types/notification';
import { Movie } from '../types/movie';
import { useAuth } from './AuthContext';
import {
  fetchUserNotificationsFromDB,
  markUserNotificationReadInDB,
  markAllUserNotificationsReadInDB,
  clearUserNotificationsInDB,
} from '../services/adminNotificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface NotificationContextType {
  notifications: NotificationItem[];
  activeToasts: ActiveToast[];
  unreadCount: number;
  showToast: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>, duration?: number) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshUserNotifications: () => Promise<void>;
  notifyNewRelease: (movie: Movie) => void;
  notifyRequestUpdate: (movieTitle: string, status: 'reviewed' | 'uploaded', movieId?: string, poster?: string) => void;
  notifySubscriptionActivated: (planName?: string) => void;
  notifySubscriptionCancelled: () => void;
  notifySubscriptionPaused: (days: number) => void;
  notifySubscriptionResumed: () => void;
  triggerDemoNotification: () => void;
}

const STORAGE_KEY = 'chitrokatha_notifications';

const initialDefaultNotifications: NotificationItem[] = [
  {
    id: 'notif-toofan-release',
    type: 'new_release',
    titleBn: '🔥 নতুন রিলিজ: তুফান (Toofan)',
    titleEn: '🔥 New Release: Toofan',
    messageBn: 'শাকিব খান অভিনীত ব্লকবাস্টার অ্যাকশন থ্রিলার তুফান এখন ৪কে কোয়ালিটিতে সম্পূর্ণ বিনামূল্যে দেখুন!',
    messageEn: 'Shakib Khan starrer blockbuster action thriller Toofan is now streaming in 4K UHD!',
    movieId: 'movie-toofan-2024',
    movieTitle: 'তুফান',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    timestamp: Date.now() - 3600000 * 2,
    read: false,
  },
  {
    id: 'notif-request-boro-chhele',
    type: 'request_update',
    titleBn: '✅ রিকোয়েস্ট আপডেট: বড় ছেলে',
    titleEn: '✅ Request Update: Boro Chhele',
    messageBn: 'আপনার রিকোয়েস্ট করা বাংলা নাটক "বড় ছেলে" রিভিউ শেষে সফলভাবে সার্ভারে আপলোড করা হয়েছে!',
    messageEn: 'Your requested title "Boro Chhele" has been approved and uploaded by our admin team!',
    movieId: 'natok-boro-chhele-2017',
    movieTitle: 'বড় ছেলে',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    timestamp: Date.now() - 3600000 * 8,
    read: false,
  },
  {
    id: 'notif-hawa-release',
    type: 'new_release',
    titleBn: '🌊 নতুন সংযোজন: হাওয়া (Hawa)',
    titleEn: '🌊 New Release: Hawa',
    messageBn: 'মেজবাউর রহমান সুমনের কালজয়ী মিস্ট্রি ড্রামা "হাওয়া" এখন চিত্রকথায় লাইভ!',
    messageEn: 'Mejbaur Rahman Sumon\'s acclaimed mystery drama "Hawa" is now live on ChitroKatha!',
    movieId: 'movie-hawa-2022',
    movieTitle: 'হাওয়া',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    timestamp: Date.now() - 3600000 * 24,
    read: true,
  },
];

export const dispatchAppNotification = (
  notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>,
  duration = 6000
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chitrokatha_notification', {
        detail: { ...notif, duration },
      })
    );
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const recentToastKeys = new Set<string>();

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeToasts, setActiveToasts] = useState<ActiveToast[]>([]);

  // Function to load notifications for current user from DB
  const refreshUserNotifications = useCallback(async () => {
    if (!user?.id) {
      // Guest user: restore initial/offline defaults
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
            return;
          }
        }
      } catch {}
      setNotifications(initialDefaultNotifications);
      return;
    }

    try {
      const dbNotifs = await fetchUserNotificationsFromDB(user.id);
      if (dbNotifs && dbNotifs.length > 0) {
        const mapped: NotificationItem[] = dbNotifs.map((d: any) => ({
          id: d.id,
          type: (d.type as NotificationType) || 'system',
          titleBn: d.title,
          titleEn: d.title,
          messageBn: d.message,
          messageEn: d.message,
          timestamp: new Date(d.created_at).getTime(),
          read: Boolean(d.is_read),
        }));
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('[NotificationContext] Error loading user notifications:', err);
    }
  }, [user?.id]);

  // Load notifications whenever user login state changes
  useEffect(() => {
    refreshUserNotifications();
  }, [refreshUserNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (notifData: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>, duration = 6500) => {
      // Deduplicate rapid identical toasts within 4 seconds window
      const dedupeKey = `${notifData.titleBn || notifData.titleEn || ''}:${notifData.messageBn || notifData.messageEn || ''}`;
      if (recentToastKeys.has(dedupeKey)) {
        return;
      }
      recentToastKeys.add(dedupeKey);
      setTimeout(() => {
        recentToastKeys.delete(dedupeKey);
      }, 4000);

      const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const newNotif: NotificationItem = {
        ...notifData,
        id,
        timestamp: Date.now(),
        read: false,
      };

      // Add to full notification list (MRU)
      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

      // Add to active toast queue
      const toastItem: ActiveToast = { ...newNotif, duration };
      setActiveToasts((prev) => [toastItem, ...prev.slice(0, 2)]);
    },
    []
  );

  // Direct Supabase Realtime subscription on user_notifications
  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) return;

    const currentUserId = user.id;
    const channelName = `notification_ctx_user_${currentUserId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload: any) => {
          const isInsert =
            payload?.eventType?.toUpperCase() === 'INSERT' ||
            (!payload?.eventType && payload?.new);

          if (isInsert && payload?.new) {
            showToast({
              type: (payload.new.type as NotificationType) || 'system',
              titleBn: payload.new.title,
              titleEn: payload.new.title,
              messageBn: payload.new.message,
              messageEn: payload.new.message,
            });
          }
          refreshUserNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showToast, refreshUserNotifications]);

  // Global event listener for notifications triggered anywhere
  useEffect(() => {
    const handleCustomNotification = (e: any) => {
      if (e.detail) {
        showToast(e.detail, e.detail.duration || 6500);
      }
    };
    const handleRefresh = () => {
      refreshUserNotifications();
    };

    window.addEventListener('chitrokatha_notification', handleCustomNotification);
    window.addEventListener('chitrokatha_refresh_user_notifications', handleRefresh);

    return () => {
      window.removeEventListener('chitrokatha_notification', handleCustomNotification);
      window.removeEventListener('chitrokatha_refresh_user_notifications', handleRefresh);
    };
  }, [showToast, refreshUserNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markUserNotificationReadInDB(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user?.id) {
      await markAllUserNotificationsReadInDB(user.id);
    }
  }, [user?.id]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    setActiveToasts([]);
    if (user?.id) {
      await clearUserNotificationsInDB(user.id);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [user?.id]);


  // Helper: New movie release notification
  const notifyNewRelease = useCallback(
    (movie: Movie) => {
      showToast({
        type: 'new_release',
        titleBn: `🔥 নতুন রিলিজ: ${movie.titleBn || movie.titleEn}`,
        titleEn: `🔥 New Release: ${movie.titleEn || movie.titleBn}`,
        messageBn: `"${movie.titleBn || movie.titleEn}" (${movie.year}) এখন ${movie.quality} কোয়ালিটিতে সম্পূর্ণ বিনামূল্যে দেখতে পারবেন!`,
        messageEn: `"${movie.titleEn || movie.titleBn}" (${movie.year}) is now streaming in ${movie.quality}! Watch now.`,
        movieId: String(movie.id),
        movieTitle: movie.titleBn || movie.titleEn,
        poster: movie.poster,
      });
    },
    [showToast]
  );

  // Helper: Movie request update notification
  const notifyRequestUpdate = useCallback(
    (movieTitle: string, status: 'reviewed' | 'uploaded', movieId?: string, poster?: string) => {
      const isUploaded = status === 'uploaded';
      showToast({
        type: 'request_update',
        titleBn: isUploaded
          ? `✅ রিকোয়েস্ট সম্পন্ন: ${movieTitle}`
          : `🔍 রিকোয়েস্ট আপডেট: ${movieTitle}`,
        titleEn: isUploaded
          ? `✅ Request Uploaded: ${movieTitle}`
          : `🔍 Request In Review: ${movieTitle}`,
        messageBn: isUploaded
          ? `আপনার রিকোয়েস্ট করা চলচ্চিত্র "${movieTitle}" ওয়েবসাইটে আপলোড করা হয়েছে! এখনই উপভোগ করুন।`
          : `আপনার রিকোয়েস্ট করা চলচ্চিত্র "${movieTitle}" আমাদের টিম যাচাই করছে। খুব শীঘ্রই যুক্ত হবে!`,
        messageEn: isUploaded
          ? `Your requested title "${movieTitle}" has been uploaded to ChitroKatha! Enjoy streaming now.`
          : `Our curation team has reviewed your request for "${movieTitle}". Adding to server soon!`,
        movieId,
        movieTitle,
        poster,
      });
    },
    [showToast]
  );

  // Helper: Subscription Activated
  const notifySubscriptionActivated = useCallback(
    (planName = 'ভিআইপি মেম্বারশিপ') => {
      showToast(
        {
          type: 'system',
          titleBn: '🎉 ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে!',
          titleEn: '🎉 VIP Membership Activated!',
          messageBn: `অভিনন্দন! আপনার ${planName} সক্রিয় হয়েছে। এখন ১০০% বিজ্ঞাপনমুক্ত ৪কে আল্ট্রা এইচডি কোয়ালিটিতে সিনেমা ও নাটক উপভোগ করুন!`,
          messageEn: `Congratulations! Your ${planName} is active. Enjoy 100% ad-free streaming in 4K UHD!`,
        },
        7000
      );
    },
    [showToast]
  );

  // Helper: Subscription Cancelled
  const notifySubscriptionCancelled = useCallback(() => {
    showToast(
      {
        type: 'system',
        titleBn: '❌ সাবস্ক্রিপশন বাতিল হয়েছে',
        titleEn: '❌ Subscription Cancelled',
        messageBn:
          'আপনার সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে। আপনার অ্যাকাউন্ট ফ্রি সংস্করণে ফিরে এসেছে (ভিডিও শুরুর আগে বিজ্ঞাপন প্রদর্শিত হবে)।',
        messageEn:
          'Your subscription has been cancelled immediately. Your account has returned to the Free tier (sponsored ads enabled).',
      },
      7000
    );
  }, [showToast]);

  // Helper: Subscription Paused
  const notifySubscriptionPaused = useCallback(
    (days: number) => {
      showToast(
        {
          type: 'system',
          titleBn: '⏸️ সাবস্ক্রিপশন পজ করা হয়েছে',
          titleEn: '⏸️ Subscription Paused',
          messageBn: `আপনার সাবস্ক্রিপশন আগামী ${days} দিনের জন্য সফলভাবে পজ রাখা হয়েছে। মেয়াদ সংরক্ষিত থাকবে!`,
          messageEn: `Your subscription has been paused for ${days} days. Your remaining days are preserved!`,
        },
        7000
      );
    },
    [showToast]
  );

  // Helper: Subscription Resumed
  const notifySubscriptionResumed = useCallback(() => {
    showToast(
      {
        type: 'system',
        titleBn: '▶️ সাবস্ক্রিপশন পুনরায় চালু হয়েছে',
        titleEn: '▶️ Subscription Resumed',
        messageBn:
          'আপনার সাবস্ক্রিপশন সফলভাবে পুনরায় চালু হয়েছে। বিজ্ঞাপনমুক্ত সিনেমা ও নাটক উপভোগ করুন!',
        messageEn: 'Your subscription has resumed. Enjoy 100% ad-free streaming!',
      },
      7000
    );
  }, [showToast]);

  // Trigger demo notification
  const triggerDemoNotification = useCallback(() => {
    notifySubscriptionActivated();
  }, [notifySubscriptionActivated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeToasts,
        unreadCount,
        showToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refreshUserNotifications,
        notifyNewRelease,
        notifyRequestUpdate,
        notifySubscriptionActivated,
        notifySubscriptionCancelled,
        notifySubscriptionPaused,
        notifySubscriptionResumed,
        triggerDemoNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
