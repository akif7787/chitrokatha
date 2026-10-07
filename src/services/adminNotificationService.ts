import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminNotificationItem, NotificationType, NotificationTarget, NotificationStatus } from '../admin/types/adminTypes';

export async function fetchAdminNotifications(): Promise<AdminNotificationItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) {
      return [];
    }

    return data.map((d: any) => {
      let target: NotificationTarget = 'all';
      let sentCount = 1;
      
      // If entity_id stores target:count e.g. 'all:14' or 'vip'
      if (d.entity_id) {
        if (d.entity_id.includes(':')) {
          const [t, countStr] = d.entity_id.split(':');
          if (['all', 'vip', 'free'].includes(t)) target = t as NotificationTarget;
          const parsedCount = parseInt(countStr, 10);
          if (!isNaN(parsedCount)) sentCount = parsedCount;
        } else if (['all', 'vip', 'free'].includes(d.entity_id)) {
          target = d.entity_id as NotificationTarget;
        }
      }

      return {
        id: d.id,
        title: d.title,
        message: d.message,
        type: (d.type as NotificationType) || 'system',
        target,
        scheduledDate: d.created_at,
        status: (d.is_read ? 'sent' : 'scheduled') as NotificationStatus,
        sentCount,
        entityType: d.entity_type,
        entityId: d.entity_id,
        isRead: d.is_read,
      };
    });
  } catch (err: any) {
    console.warn('[AdminNotificationService] Error:', err?.message);
    return [];
  }
}

export async function markAdminNotificationRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return !error;
  } catch {
    return false;
  }
}

export async function markAllAdminNotificationsRead(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Broadcast an announcement or alert to users in public.user_notifications.
 * Supports targeting: 'all' | 'vip' | 'free' | 'specific' (via targetUserId).
 */
export async function broadcastNotificationToUsers(params: {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  targetUserId?: string;
  adminUserId?: string;
}): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const { title, message, type, target, targetUserId, adminUserId } = params;

  if (!title.trim() || !message.trim()) {
    return { success: false, sentCount: 0, error: 'Title and message are required' };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, sentCount: 1 };
  }

  try {
    // 1. Determine recipient user IDs based on target filter
    let recipientIds: string[] = [];

    if (target === 'all' || target === 'vip' || target === 'free') {
      // Query profiles joined with active subscriptions
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, role, status');

      if (pErr) {
        return { success: false, sentCount: 0, error: pErr.message };
      }

      if (!profiles || profiles.length === 0) {
        return { success: true, sentCount: 0 };
      }

      if (target === 'all') {
        recipientIds = profiles.map((p: any) => p.id);
      } else {
        // Query active subscriptions to filter vip vs free
        const { data: activeSubs } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('status', 'active');

        const activeVipSet = new Set((activeSubs || []).map((s: any) => s.user_id));

        if (target === 'vip') {
          recipientIds = profiles
            .filter((p: any) => activeVipSet.has(p.id))
            .map((p: any) => p.id);
        } else if (target === 'free') {
          recipientIds = profiles
            .filter((p: any) => !activeVipSet.has(p.id))
            .map((p: any) => p.id);
        }
      }
    } else if (targetUserId) {
      recipientIds = [targetUserId];
    }

    if (recipientIds.length === 0) {
      return { success: true, sentCount: 0 };
    }

    // 2. Batch insert rows into public.user_notifications
    const rows = recipientIds.map((userId) => ({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'system',
      is_read: false,
    }));

    // Insert in chunks of 100 to stay well within Supabase payload limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error: insertErr } = await (supabase.from('user_notifications') as any).insert(chunk);
      if (insertErr) {
        console.warn('[AdminNotificationService] Chunk insert error:', insertErr.message);
      }
    }

    // 3. Insert record into admin_notifications for Admin history log
    try {
      const { error: adminNotifErr } = await (supabase.from('admin_notifications') as any).insert({
        title: title.trim(),
        message: message.trim(),
        type: type || 'promotion',
        is_read: true,
        entity_type: 'broadcast',
        entity_id: `${target}:${recipientIds.length}`,
      });
      if (adminNotifErr) {
        console.warn('[AdminNotificationService] Admin notification log:', adminNotifErr.message);
      }
    } catch (e: any) {
      console.warn('[AdminNotificationService] Admin notification log notice:', e?.message);
    }

    // 4. Log admin audit log
    if (adminUserId) {
      try {
        const { error: auditErr } = await (supabase.from('admin_activity_logs') as any).insert({
          admin_user_id: adminUserId,
          action: 'send_broadcast',
          entity_type: 'notification',
          metadata: { target, sentCount: recipientIds.length, title: title.trim() },
        });
        if (auditErr) {
          console.warn('[AdminNotificationService] Activity log:', auditErr.message);
        }
      } catch (e: any) {
        console.warn('[AdminNotificationService] Activity log notice:', e?.message);
      }
    }

    return { success: true, sentCount: recipientIds.length };
  } catch (err: any) {
    console.error('[AdminNotificationService] Broadcast error:', err?.message);
    return { success: false, sentCount: 0, error: err?.message || 'Failed to send broadcast' };
  }
}

/**
 * Fetch persistent notifications for a logged-in user from public.user_notifications
 */
export async function fetchUserNotificationsFromDB(userId: string): Promise<any[]> {
  if (!isSupabaseConfigured() || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}

/**
 * Mark a user notification as read in DB
 */
export async function markUserNotificationReadInDB(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !notificationId) return true;

  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Mark all user notifications as read in DB
 */
export async function markAllUserNotificationsReadInDB(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Clear/delete all notifications for a user in DB
 */
export async function clearUserNotificationsInDB(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return true;

  try {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

