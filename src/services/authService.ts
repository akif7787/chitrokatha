import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult<T = any> {
  data: T | null;
  error: string | null;
}

export function formatAuthError(err: AuthError | Error | null): string {
  if (!err) return '';
  const msg = err.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। দয়া করে পুনরায় যাচাই করুন। (Incorrect email or password)';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন। (Email is already registered)';
  }
  if (msg.includes('password should be at least')) {
    return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে। (Password must be at least 6 characters)';
  }
  if (msg.includes('email not confirmed')) {
    return 'আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি। আপনার ইনবক্স চেক করুন। (Email not verified yet)';
  }
  if (msg.includes('rate limit')) {
    return 'অনেক বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন। (Too many attempts. Try again later)';
  }
  return err.message;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase configuration is missing. Running in local demo mode.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          phone: phone?.trim() || null,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            fullName || email
          )}`
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase configuration is missing. Running in local demo mode.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

export async function signOut(): Promise<AuthResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { data: null, error: formatAuthError(error) };
    }
    return { data: undefined, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult<void>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase configuration is missing. Please set credentials in .env.local.'
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#reset-password`
    });

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data: undefined, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult<void>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase configuration is missing.'
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data: undefined, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}
