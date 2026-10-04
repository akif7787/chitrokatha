import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || '';

const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabasePublishableKey) &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );
};

// If not configured yet, provide a dummy URL that won't crash createClient constructor
const effectiveUrl = isSupabaseConfigured()
  ? supabaseUrl
  : 'https://placeholder-project.supabase.co';

const effectiveKey = isSupabaseConfigured()
  ? supabasePublishableKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_signature';

export const supabase: SupabaseClient = createClient(
  effectiveUrl,
  effectiveKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

if (!isSupabaseConfigured()) {
  console.info(
    'ℹ️ [ChitroKatha Supabase] Running in local demo/offline mode. To connect live PostgreSQL backend, set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
  );
}
