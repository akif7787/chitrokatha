import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type SupportTicketStatus = 'new' | 'in_progress' | 'resolved';

export interface SupportReplyRecord {
  id: string;
  ticketId: string;
  senderId?: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportMessageRecord {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: 'payment' | 'video' | 'account' | 'other';
  message: string;
  status: SupportTicketStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  replies?: SupportReplyRecord[];
}

const LOCAL_SUPPORT_KEY = 'chitrokatha_support_tickets_v1';
export const SUPPORT_STATUS_EVENT = 'chitrokatha_support_status_changed';

export function notifySupportChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUPPORT_STATUS_EVENT));
  }
}

export function getLocalSupportTickets(): SupportMessageRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_SUPPORT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSupportTickets(tickets: SupportMessageRecord[]): void {
  try {
    localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(tickets));
    notifySupportChanged();
  } catch {}
}

/**
 * Submit a new support ticket (User-facing)
 */
export async function submitSupportMessage(params: {
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: 'payment' | 'video' | 'account' | 'other';
  message: string;
}): Promise<{ success: boolean; data?: SupportMessageRecord; error?: string }> {
  const nowIso = new Date().toISOString();
  const localList = getLocalSupportTickets();

  const newTicket: SupportMessageRecord = {
    id: `ticket_${Date.now()}`,
    userId: params.userId,
    userName: params.userName.trim(),
    userEmail: params.userEmail.trim(),
    userPhone: params.userPhone?.trim(),
    subject: params.subject.trim(),
    category: params.category,
    message: params.message.trim(),
    status: 'new',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 1. Supabase remote insert
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('support_messages') as any)
        .insert({
          user_id: params.userId || null,
          user_name: params.userName.trim(),
          user_email: params.userEmail.trim(),
          user_phone: params.userPhone?.trim() || null,
          subject: params.subject.trim(),
          category: params.category,
          message: params.message.trim(),
          status: 'new',
        })
        .select()
        .single();

      if (!error && data) {
        newTicket.id = data.id;
        newTicket.createdAt = data.created_at;
        newTicket.updatedAt = data.updated_at || data.created_at;

        // Create Admin Notification for instant real-time alert in Admin Panel
        await (supabase.from('admin_notifications') as any)
          .insert({
            title: `নতুন সহায়তা বার্তা: ${params.subject.slice(0, 30)}`,
            message: `${params.userName} (${params.category.toUpperCase()}) — ${params.message.slice(0, 80)}`,
            type: 'support',
            entity_type: 'support_message',
            entity_id: data.id,
            is_read: false,
          })
          .catch((nErr: any) => console.warn('[SupportService] Admin notification notice:', nErr?.message));
      } else if (error) {
        console.warn('[SupportService] Supabase insert notice:', error.message);
      }
    } catch (err: any) {
      console.warn('[SupportService] Error submitting support ticket to Supabase:', err?.message);
    }
  }

  // 2. Persist locally as cache fallback
  saveLocalSupportTickets([newTicket, ...localList]);
  return { success: true, data: newTicket };
}

/**
 * Fetch all support messages for a specific user (User-facing "My Requests")
 */
export async function fetchUserSupportMessages(userId: string): Promise<SupportMessageRecord[]> {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userEmail: d.user_email,
          userPhone: d.user_phone,
          subject: d.subject,
          category: d.category,
          message: d.message,
          status: d.status as SupportTicketStatus,
          adminNotes: d.admin_notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at || d.created_at,
          resolvedAt: d.resolved_at,
          resolvedBy: d.resolved_by,
        }));
      }
    } catch (err: any) {
      console.warn('[SupportService] Error fetching user support tickets:', err?.message);
    }
  }

  const localList = getLocalSupportTickets();
  return localList.filter((t) => t.userId === userId);
}

/**
 * Fetch all support messages for the Admin Desk
 */
export async function fetchAdminSupportMessages(): Promise<SupportMessageRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userEmail: d.user_email,
          userPhone: d.user_phone,
          subject: d.subject,
          category: d.category,
          message: d.message,
          status: d.status as SupportTicketStatus,
          adminNotes: d.admin_notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at || d.created_at,
          resolvedAt: d.resolved_at,
          resolvedBy: d.resolved_by,
        }));
      }
    } catch (err: any) {
      console.warn('[SupportService] Error fetching admin support messages:', err?.message);
    }
  }

  return getLocalSupportTickets();
}

/**
 * Fetch thread replies for a specific ticket
 */
export async function fetchTicketReplies(ticketId: string): Promise<SupportReplyRecord[]> {
  if (!ticketId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('support_replies') as any)
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          ticketId: r.ticket_id,
          senderId: r.sender_id,
          senderRole: r.sender_role,
          senderName: r.sender_name,
          message: r.message,
          createdAt: r.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[SupportService] Error fetching ticket replies:', err?.message);
    }
  }

  return [];
}

/**
 * Submit a follow-up reply to an open support ticket
 */
export async function submitSupportReply(params: {
  ticketId: string;
  senderId?: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  message: string;
}): Promise<{ success: boolean; data?: SupportReplyRecord; error?: string }> {
  const reply: SupportReplyRecord = {
    id: `reply_${Date.now()}`,
    ticketId: params.ticketId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    message: params.message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('support_replies') as any)
        .insert({
          ticket_id: params.ticketId,
          sender_id: params.senderId || null,
          sender_role: params.senderRole,
          sender_name: params.senderName.trim(),
          message: params.message.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        reply.id = data.id;
        reply.createdAt = data.created_at;

        // Update ticket updated_at
        await (supabase.from('support_messages') as any)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', params.ticketId);

        // If user replies, alert admin
        if (params.senderRole === 'user') {
          await (supabase.from('admin_notifications') as any).insert({
            title: `টিকেট ফলো-আপ: ${params.senderName}`,
            message: params.message.slice(0, 100),
            type: 'support',
            entity_type: 'support_message',
            entity_id: params.ticketId,
            is_read: false,
          }).catch(() => {});
        }

        notifySupportChanged();
        return { success: true, data: reply };
      }
    } catch (err: any) {
      console.warn('[SupportService] Error submitting reply:', err?.message);
    }
  }

  notifySupportChanged();
  return { success: true, data: reply };
}

/**
 * Admin updates ticket status and/or official admin notes
 */
export async function updateSupportTicketStatus(params: {
  ticketId: string;
  status: SupportTicketStatus;
  adminNotes?: string;
  adminUserId?: string;
  targetUserId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const updates: Record<string, any> = {
        status: params.status,
        updated_at: nowIso,
      };

      if (params.adminNotes !== undefined) {
        updates.admin_notes = params.adminNotes.trim();
      }

      if (params.status === 'resolved') {
        updates.resolved_at = nowIso;
        if (params.adminUserId) {
          updates.resolved_by = params.adminUserId;
        }
      } else {
        updates.resolved_at = null;
        updates.resolved_by = null;
      }

      const { error } = await (supabase.from('support_messages') as any)
        .update(updates)
        .eq('id', params.ticketId);

      if (error) {
        return { success: false, error: error.message };
      }

      // If resolved or status changed, notify the user via user_notifications if targetUserId is available
      if (params.targetUserId) {
        const statusLabel =
          params.status === 'resolved'
            ? 'সমাধান হয়েছে (Resolved)'
            : params.status === 'in_progress'
            ? 'প্রক্রিয়াধীন রয়েছে (In Progress)'
            : 'নতুন (New)';

        await (supabase.from('user_notifications') as any).insert({
          user_id: params.targetUserId,
          title: `সহায়তা রিকোয়েস্ট আপডেট: ${statusLabel}`,
          message: params.adminNotes
            ? `অ্যাডমিন টিম উত্তর দিয়েছেন: "${params.adminNotes.slice(0, 80)}"`
            : `আপনার সহায়তা রিকোয়েস্ট #${params.ticketId.slice(0, 8)} এর স্ট্যাটাস পরিবর্তিত হয়েছে।`,
          type: 'support',
          is_read: false,
        }).catch((uErr: any) => console.warn('[SupportService] User notification notice:', uErr?.message));
      }

      // Admin audit log
      if (params.adminUserId) {
        await (supabase.from('admin_activity_logs') as any).insert({
          admin_user_id: params.adminUserId,
          action: 'update_support_status',
          entity_type: 'support_message',
          entity_id: params.ticketId,
          metadata: { status: params.status, notes: params.adminNotes },
        }).catch(() => {});
      }
    } catch (err: any) {
      console.warn('[SupportService] Error updating support ticket in Supabase:', err?.message);
    }
  }

  // Update local cache
  const localList = getLocalSupportTickets();
  const updated = localList.map((t) => {
    if (t.id === params.ticketId) {
      return {
        ...t,
        status: params.status,
        adminNotes: params.adminNotes !== undefined ? params.adminNotes : t.adminNotes,
        updatedAt: nowIso,
        resolvedAt: params.status === 'resolved' ? nowIso : undefined,
      };
    }
    return t;
  });
  saveLocalSupportTickets(updated);
  notifySupportChanged();

  return { success: true };
}
