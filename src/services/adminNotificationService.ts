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

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      message: d.message,
      type: (d.type as NotificationType) || 'system',
      target: 'all' as NotificationTarget,
      scheduledDate: d.created_at,
      status: (d.is_read ? 'sent' : 'scheduled') as NotificationStatus,
      sentCount: 1,
      entityType: d.entity_type,
      entityId: d.entity_id,
      isRead: d.is_read,
    }));
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
