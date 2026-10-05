import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SupportTicket } from '../types/user';

export type SupportTicketStatus = 'new' | 'in_progress' | 'resolved';

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
  resolvedAt?: string;
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

export async function submitSupportMessage(params: {
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: 'payment' | 'video' | 'account' | 'other';
  message: string;
}): Promise<{ success: boolean; data?: SupportMessageRecord; error?: string }> {
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
    createdAt: new Date().toISOString(),
  };

  // 1. Supabase remote insert if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('support_messages') as any).insert({
        user_id: params.userId || null,
        user_name: params.userName.trim(),
        user_email: params.userEmail.trim(),
        user_phone: params.userPhone?.trim() || null,
        subject: params.subject.trim(),
        category: params.category,
        message: params.message.trim(),
        status: 'new',
      }).select().single();

      if (!error && data) {
        newTicket.id = data.id;
      } else if (error) {
        console.warn('[SupportService] Supabase insert notice:', error.message);
      }
    } catch (err: any) {
      console.warn('[SupportService] Error submitting support ticket to Supabase:', err?.message);
    }
  }

  // 2. Persist locally
  saveLocalSupportTickets([newTicket, ...localList]);
  return { success: true, data: newTicket };
}

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
          resolvedAt: d.resolved_at,
        }));
      }
    } catch (err: any) {
      console.warn('[SupportService] Error fetching admin tickets:', err?.message);
    }
  }

  return getLocalSupportTickets();
}

export async function fetchUserSupportMessages(userId: string): Promise<SupportMessageRecord[]> {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
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
          resolvedAt: d.resolved_at,
        }));
      }
    } catch (err: any) {
      console.warn('[SupportService] Error fetching user tickets:', err?.message);
    }
  }

  const localList = getLocalSupportTickets();
  return localList.filter((t) => t.userId === userId);
}

export async function updateSupportMessageStatus(
  ticketId: string,
  status: SupportTicketStatus,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const updatePayload: any = {
        status,
        admin_notes: adminNotes,
      };
      if (status === 'resolved') {
        updatePayload.resolved_at = new Date().toISOString();
      }

      const { error } = await (supabase.from('support_messages') as any)
        .update(updatePayload)
        .eq('id', ticketId);

      if (error) {
        console.warn('[SupportService] Supabase ticket update warning:', error.message);
      }
    } catch (err: any) {
      console.warn('[SupportService] Update ticket error:', err?.message);
    }
  }

  // Update in local store
  const localList = getLocalSupportTickets();
  const updated = localList.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : t.adminNotes,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : t.resolvedAt,
        }
      : t
  );
  saveLocalSupportTickets(updated);

  return { success: true };
}
