import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminCustomerUser, SubscriptionTierType, UserStatus } from '../admin/types/adminTypes';

/**
 * Fetch real user directory from Supabase (profiles joined with user_subscriptions)
 */
export async function fetchAdminUsers(): Promise<AdminCustomerUser[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // 1. First attempt secure RPC get_admin_users() which joins auth.users with profiles & subscriptions
    const { data: rpcUsers, error: rpcErr } = await supabase.rpc('get_admin_users');
    if (!rpcErr && Array.isArray(rpcUsers) && rpcUsers.length > 0) {
      return rpcUsers.map((u: any) => {
        const tier: SubscriptionTierType =
          u.sub_status === 'active' && u.sub_tier ? (u.sub_tier as SubscriptionTierType) : 'free';
        const subscriptionLabel =
          tier === 'vip'
            ? 'VIP All-Access'
            : tier === 'standard'
            ? 'Standard Pass'
            : tier === 'basic'
            ? 'Basic Pass'
            : 'Free Tier';

        const joinedDate = u.created_at
          ? new Date(u.created_at).toLocaleDateString('bn-BD', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown';

        const lastLogin = u.last_login_at
          ? new Date(u.last_login_at).toLocaleDateString('bn-BD', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Never';

        return {
          id: u.id,
          name: u.full_name || u.username || 'Unnamed User',
          email: u.email || 'No email stored',
          phone: u.phone || undefined,
          avatar:
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          joinedDate,
          subscription: subscriptionLabel,
          tier,
          role: u.role || 'user',
          status: (u.status as UserStatus) || 'active',
          lastLogin,
          watchHistoryCount: 0,
          subscriptionStartDate: u.sub_start_date,
          subscriptionEndDate: u.sub_end_date,
        };
      });
    }

    // 2. Fallback: Direct select on public.profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr || !profiles) {
      console.warn('[AdminUserService] Error fetching profiles:', pErr?.message || rpcErr?.message);
      return [];
    }

    // 3. Fetch active/latest user subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*');

    const subMap = new Map<string, any>();
    if (subscriptions) {
      for (const s of subscriptions) {
        subMap.set(s.user_id, s);
      }
    }

    // 4. Map to AdminCustomerUser objects
    return profiles.map((p: any) => {
      const sub = subMap.get(p.id);
      const tier: SubscriptionTierType = sub?.status === 'active' && sub?.tier ? sub.tier : 'free';
      const subscriptionLabel =
        tier === 'vip'
          ? 'VIP All-Access'
          : tier === 'standard'
          ? 'Standard Pass'
          : tier === 'basic'
          ? 'Basic Pass'
          : 'Free Tier';

      const joinedDate = p.created_at
        ? new Date(p.created_at).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Unknown';

      const lastLogin = p.last_login_at
        ? new Date(p.last_login_at).toLocaleDateString('bn-BD', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Never';

      return {
        id: p.id,
        name: p.full_name || p.username || 'Unnamed User',
        email: p.email || (p.username ? `${p.username}@chitrokatha.online` : 'No email stored'),
        phone: p.phone || undefined,
        avatar: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        joinedDate,
        subscription: subscriptionLabel,
        tier,
        role: p.role || 'user',
        status: (p.status as UserStatus) || 'active',
        lastLogin,
        watchHistoryCount: 0,
        subscriptionStartDate: sub?.start_date,
        subscriptionEndDate: sub?.end_date,
      };
    });
  } catch (err: any) {
    console.error('[AdminUserService] Error querying real user directory:', err?.message);
    return [];
  }
}

/**
 * Call the secure admin-users Edge Function
 */
async function callAdminUsersFunction(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    return { success: false, error: 'Unauthorized: Admin session required' };
  }

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || '';

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Request failed' };
    }

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Create a new user from Admin Panel via secure Edge Function
 */
export async function createAdminUser(params: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
  plan?: 'free' | 'standard' | 'vip';
}): Promise<{ success: boolean; user?: any; error?: string }> {
  const result = await callAdminUsersFunction({
    action: 'create_user',
    ...params,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, user: result.data?.user };
}

/**
 * Set/Reset a user's password from Admin Panel via secure Edge Function
 */
export async function resetAdminUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const result = await callAdminUsersFunction({
    action: 'reset_password',
    userId,
    newPassword,
  });

  return { success: result.success, error: result.error };
}

/**
 * Edit user information from Admin Panel via secure Edge Function
 */
export async function updateAdminUser(params: {
  userId: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'pending';
  plan?: 'free' | 'standard' | 'vip';
}): Promise<{ success: boolean; error?: string }> {
  const result = await callAdminUsersFunction({
    action: 'update_user',
    ...params,
  });

  return { success: result.success, error: result.error };
}
