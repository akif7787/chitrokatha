import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile, UserPreferences } from '../types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile from Supabase:', error.message);
      return null;
    }

    return (data as unknown as Profile) || null;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'role' | 'status' | 'created_at'>>
): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const updatePayload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabase.from('profiles') as any)
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile in Supabase:', error.message);
      return null;
    }

    return (data as unknown as Profile) || null;
  } catch (err) {
    console.error('Unexpected error updating profile:', err);
    return null;
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error.message);
      return null;
    }

    return (data as unknown as UserPreferences) || null;
  } catch (err) {
    console.error('Unexpected error fetching preferences:', err);
    return null;
  }
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>>
): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const upsertPayload: Record<string, any> = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabase.from('user_preferences') as any)
      .upsert(upsertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error.message);
      return null;
    }

    return (data as unknown as UserPreferences) || null;
  } catch (err) {
    console.error('Unexpected error updating preferences:', err);
    return null;
  }
}
