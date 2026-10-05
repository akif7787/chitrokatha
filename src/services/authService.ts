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

// ============================================================================
// 2-Step Authentication & Email OTP Methods
// ============================================================================

/**
 * Verify Signup Email OTP via Supabase Native Auth
 */
export async function verifySignUpOtp(
  email: string,
  token: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  try {
    // Primary verification using type: 'email'
    let { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email'
    });

    // Fallback if GoTrue configuration specifically expects 'signup'
    if (error && (error.message.includes('type') || error.status === 400)) {
      const fallback = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup'
      });
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

/**
 * Resend Signup Confirmation Email OTP via Supabase Native Auth
 */
export async function resendSignUpOtp(
  email: string
): Promise<AuthResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim()
    });

    if (error) {
      return { data: null, error: formatAuthError(error) };
    }

    return { data: undefined, error: null };
  } catch (err: any) {
    return { data: null, error: formatAuthError(err) };
  }
}

/**
 * Step 1: Validate Email + Password and request 6-digit Login OTP
 * The server validates credentials, generates/hashes OTP, and sends the branded email.
 * NO session or OTP is returned to the client.
 */
export async function requestLoginChallenge(
  email: string,
  password: string
): Promise<AuthResult<{ success: boolean; message?: string; cooldown_seconds?: number }>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Invoke Supabase Edge Function: auth-login
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: {
        action: 'challenge',
        email: cleanEmail,
        password
      }
    });

    if (!error && data) {
      if (!data.success) {
        return { data: null, error: data.error || 'Failed to initialize verification challenge.' };
      }
      return { data: { success: true, message: data.message, cooldown_seconds: data.cooldown_seconds }, error: null };
    }

    // 2. Fallback if Edge Function is not yet deployed (local offline / dev fallback)
    // Validate password via Supabase Auth without leaking session to client state
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authError || !authData.user) {
      return { data: null, error: formatAuthError(authError) };
    }

    // Immediately sign out from client so pre-OTP session is NOT usable in browser
    await supabase.auth.signOut();

    // Call database RPC to record challenge hash if available
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('request_login_otp', {
      user_email: cleanEmail
    });

    if (rpcError) {
      console.warn('RPC request_login_otp notice:', rpcError.message);
    }

    return {
      data: {
        success: true,
        message: rpcData?.message || 'Verification challenge initialized.',
        cooldown_seconds: 60
      },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Login challenge failed.' };
  }
}

/**
 * Step 2: Verify Login OTP and establish authentic Supabase session
 */
export async function verifyLoginOtp(
  email: string,
  code: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  try {
    // 1. Invoke Supabase Edge Function: auth-login
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: {
        action: 'verify',
        email: cleanEmail,
        code: cleanCode
      }
    });

    if (!error && data) {
      if (!data.success) {
        return { data: null, error: data.error || 'Incorrect verification code.' };
      }

      // If Edge Function returned single-use magic link token_hash, verify it natively
      if (data.token_hash) {
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'email'
        });

        if (sessionError) {
          return { data: null, error: formatAuthError(sessionError) };
        }

        return { data: sessionData, error: null };
      }

      return { data: { user: null, session: null }, error: null };
    }

    // 2. Fallback to database RPC verification
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('verify_login_otp', {
      user_email: cleanEmail,
      candidate_code: cleanCode
    });

    if (rpcError) {
      return { data: null, error: rpcError.message || 'Verification failed.' };
    }

    if (rpcData && !rpcData.success) {
      return { data: null, error: rpcData.error || 'Incorrect verification code.' };
    }

    const currentUser = await getCurrentUser();
    const currentSession = await getCurrentSession();
    return { data: { user: currentUser, session: currentSession }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Verification failed.' };
  }
}

/**
 * Resend Login OTP Code
 */
export async function resendLoginOtp(
  email: string,
  password?: string
): Promise<AuthResult<{ success: boolean; message?: string }>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: {
        action: 'resend',
        email: cleanEmail,
        password
      }
    });

    if (!error && data) {
      if (!data.success) {
        return { data: null, error: data.error || 'Failed to resend verification code.' };
      }
      return { data: { success: true, message: data.message }, error: null };
    }

    // Fallback: re-trigger challenge
    if (password) {
      return await requestLoginChallenge(cleanEmail, password);
    }

    return { data: { success: true }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to resend code.' };
  }
}

/**
 * Backward compatibility: requestLoginOtp
 */
export async function requestLoginOtp(
  email: string
): Promise<AuthResult<{ success: boolean; message?: string; expires_in_seconds?: number; cooldown_seconds?: number; cooldown_remaining?: number }>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase configuration is missing.' };
  }

  try {
    const { data, error } = await (supabase.rpc as any)('request_login_otp', {
      user_email: email.trim()
    });

    if (error) {
      return { data: null, error: error.message || 'Failed to generate verification code.' };
    }

    if (data && !data.success) {
      return { data: null, error: data.error || 'Failed to generate verification code.' };
    }

    return {
      data: {
        success: true,
        message: data?.message,
        expires_in_seconds: data?.expires_in_seconds,
        cooldown_seconds: data?.cooldown_seconds,
        cooldown_remaining: data?.cooldown_remaining
      },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to request verification code.' };
  }
}
