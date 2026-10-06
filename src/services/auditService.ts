import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminAuditLog } from '../admin/types/adminTypes';

export async function fetchAdminAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.warn('[AuditService] Error fetching logs:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      adminUserId: d.admin_user_id,
      adminName: d.profiles?.full_name || 'Admin',
      action: d.action,
      entityType: d.entity_type,
      entityId: d.entity_id,
      metadata: d.metadata || {},
      createdAt: d.created_at,
    }));
  } catch (err: any) {
    console.warn('[AuditService] Exception:', err?.message);
    return [];
  }
}
