import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminAccount, AdminRole } from '../admin/types/adminTypes';
import { currentAdminAccount } from '../admin/data/adminMockData';

/**
 * Fetch real admin accounts from Supabase profiles where role is admin or super_admin
 */
export async function fetchRealAdminAccounts(): Promise<AdminAccount[]> {
  if (!isSupabaseConfigured()) {
    return [currentAdminAccount];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, email, role, status, last_login_at, avatar_url')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((adm: any) => {
        const isSuper = adm.role === 'super_admin';
        return {
          id: adm.id,
          name: adm.full_name || adm.username || 'Console Admin',
          email: adm.email || 'admin@chitrokatha.com',
          role: (isSuper ? 'super_admin' : 'admin') as AdminRole,
          roleTitle: isSuper ? 'Super Admin' : 'Administrator',
          avatar:
            adm.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          status: (adm.status === 'suspended' ? 'inactive' : 'active') as 'active' | 'inactive',
          lastLogin: adm.last_login_at
            ? new Date(adm.last_login_at).toLocaleDateString('bn-BD', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Active Recently',
          permissions: isSuper
            ? ['all_access', 'manage_content', 'manage_users', 'manage_finance', 'manage_system']
            : ['manage_content', 'manage_users', 'manage_finance'],
        };
      });
    } else if (error) {
      console.warn('[AdminAccountService] Error fetching admins:', error.message);
      return [];
    }
  } catch (err: any) {
    console.warn('[AdminAccountService] Error fetching admins:', err?.message);
    return [];
  }

  return [];
}
