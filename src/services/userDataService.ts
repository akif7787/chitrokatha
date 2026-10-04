import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export async function fetchUserWatchlist(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('content_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching watchlist:', error.message);
      return [];
    }

    return (data || []).map((row: any) => String(row.content_id));
  } catch {
    return [];
  }
}

export async function addContentToWatchlist(
  userId: string,
  contentId: string | number,
  contentType: 'movie' | 'drama' | 'series' = 'movie'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await (supabase.from('watchlist') as any).upsert(
      {
        user_id: userId,
        content_id: String(contentId),
        content_type: contentType
      },
      { onConflict: 'user_id,content_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function removeContentFromWatchlist(
  userId: string,
  contentId: string | number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', String(contentId));
    return !error;
  } catch {
    return false;
  }
}

export async function fetchUserFavorites(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('content_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites:', error.message);
      return [];
    }

    return (data || []).map((row: any) => String(row.content_id));
  } catch {
    return [];
  }
}

export async function addContentToFavorites(
  userId: string,
  contentId: string | number,
  contentType: 'movie' | 'drama' | 'series' = 'movie'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await (supabase.from('favorites') as any).upsert(
      {
        user_id: userId,
        content_id: String(contentId),
        content_type: contentType
      },
      { onConflict: 'user_id,content_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function removeContentFromFavorites(
  userId: string,
  contentId: string | number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', String(contentId));
    return !error;
  } catch {
    return false;
  }
}
