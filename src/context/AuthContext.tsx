import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, SubscriptionTier, PaymentRequest, MovieRequest, SupportTicket } from '../types/user';
import { Profile, UserRole } from '../types/database';
import { dispatchAppNotification } from './NotificationContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  signUp,
  signIn,
  signOut,
  getCurrentSession,
  getCurrentUser,
  requestPasswordReset,
  updatePassword,
  onAuthStateChange,
  verifySignUpOtp,
  resendSignUpOtp,
  requestLoginChallenge,
  verifyLoginOtp,
  resendLoginOtp,
  requestLoginOtp
} from '../services/authService';
import { getProfile, updateProfile } from '../services/profileService';
import { User, Session } from '@supabase/supabase-js';

export interface PendingAuth {
  email: string;
  fullName?: string;
  phone?: string;
  password?: string;
  tempUser?: User | null;
  tempSession?: Session | null;
  mode: 'signup' | 'login';
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoggedIn: boolean;
  isPremium: boolean;
  tier: SubscriptionTier;
  isLoading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;

  // 2-Step OTP Authentication State
  pendingAuth: PendingAuth | null;
  isOtpRequired: boolean;
  submitOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  cancelPendingAuth: () => void;

  // Supabase Auth Methods
  signUpUser: (email: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string; requireOtp?: boolean }>;
  signInUser: (email: string, password: string) => Promise<{ success: boolean; error?: string; requireOtp?: boolean }>;
  signOutUser: () => Promise<void>;
  resetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Backwards compatibility wrappers
  login: (email: string, name?: string) => void;
  register: (name: string, email: string, phone?: string) => void;
  logout: () => void;
  updateUserProfile: (name: string, email: string, phone?: string, avatar?: string) => void;

  // Subscription & Manual Verification Flow
  submitSubscriptionPayment: (
    plan: SubscriptionTier,
    amount: number,
    trxId: string,
    senderPhone: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'upay'
  ) => void;
  approvePendingSubscription: () => void;
  cancelPendingSubscription: () => void;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  cancelSubscription: (reason?: string) => void;
  pauseSubscription: (days: number) => void;
  resumeSubscription: () => void;

  // Movie Request Engine
  movieRequests: MovieRequest[];
  submitMovieRequest: (
    movieTitle: string,
    category: MovieRequest['category'],
    releaseYear?: string,
    note?: string
  ) => void;

  // Support / Instant Admin Help
  supportTickets: SupportTicket[];
  submitSupportTicket: (
    subject: string,
    message: string,
    category: SupportTicket['category']
  ) => void;

  // Modals state
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot_password' | 'reset_password';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot_password' | 'reset_password') => void;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isRequestModalOpen: boolean;
  setIsRequestModalOpen: (open: boolean) => void;
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;

  // Modal triggers
  openLoginModal: () => void;
  openRegisterModal: () => void;
  openSubscriptionModal: () => void;
  openProfileModal: () => void;
  openRequestModal: () => void;
  openSupportModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'chitrokatha_user_profile_v2';
const REQUESTS_STORAGE_KEY = 'chitrokatha_movie_requests_v1';
const TICKETS_STORAGE_KEY = 'chitrokatha_support_tickets_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Local state bridging
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [movieRequests, setMovieRequests] = useState<MovieRequest[]>(() => {
    try {
      const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const stored = localStorage.getItem(TICKETS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<
    'login' | 'register' | 'forgot_password' | 'reset_password'
  >('login');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // 2-Step OTP Authentication State
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const isOtpRequired = Boolean(pendingAuth);

  const cancelPendingAuth = useCallback(() => {
    // If there was a temporary Supabase session created during password step, ensure it is cleared
    if (pendingAuth?.mode === 'login' && isSupabaseConfigured()) {
      signOut();
    }
    setPendingAuth(null);
    setAuthError(null);
  }, [pendingAuth]);

  // Synchronize Supabase User Profile
  const syncProfile = useCallback(async (sUser: User | null) => {
    if (!sUser) {
      setSupabaseUser(null);
      setProfile(null);
      if (isSupabaseConfigured()) {
        setUser(null);
      }
      return;
    }

    setSupabaseUser(sUser);
    const dbProfile = await getProfile(sUser.id);
    if (dbProfile) {
      setProfile(dbProfile);
      const mappedUser: UserProfile = {
        id: dbProfile.id,
        name: dbProfile.full_name || sUser.email?.split('@')[0] || 'দর্শক',
        email: sUser.email || '',
        phone: dbProfile.phone || undefined,
        avatar:
          dbProfile.avatar_url ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            dbProfile.full_name || sUser.email || 'user'
          )}`,
        tier: user?.tier || 'free',
        subscriptionEndDate: user?.subscriptionEndDate,
        joinedAt: dbProfile.created_at,
        role: dbProfile.role,
        status: dbProfile.status
      };
      setUser(mappedUser);
    } else {
      // Fallback from Supabase user metadata
      const metaName =
        sUser.user_metadata?.full_name || sUser.user_metadata?.name || sUser.email?.split('@')[0] || 'দর্শক';
      const metaAvatar =
        sUser.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sUser.email || 'user')}`;
      const mappedUser: UserProfile = {
        id: sUser.id,
        name: metaName,
        email: sUser.email || '',
        phone: sUser.user_metadata?.phone,
        avatar: metaAvatar,
        tier: user?.tier || 'free',
        joinedAt: sUser.created_at,
        role: 'user',
        status: 'active'
      };
      setUser(mappedUser);
    }
  }, [user?.tier, user?.subscriptionEndDate]);

  // Initialize Session on App Mount
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        if (isSupabaseConfigured()) {
          const session = await getCurrentSession();
          if (mounted && session?.user) {
            // Check if OTP verified flag is present in sessionStorage for this session
            const otpVerified = sessionStorage.getItem(`chitrokatha_otp_verified_${session.user.id}`);
            if (otpVerified === 'true') {
              await syncProfile(session.user);
            } else {
              // Session expired / unverified after restart: sign out to require fresh login + OTP
              await signOut();
              setSupabaseUser(null);
              setProfile(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    // Check for password recovery hash in URL
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password')) {
      setAuthModalMode('reset_password');
      setIsAuthModalOpen(true);
    }

    // Subscribe to auth state changes
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const otpVerified = sessionStorage.getItem(`chitrokatha_otp_verified_${session.user.id}`);
          if (otpVerified === 'true') {
            await syncProfile(session.user);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setProfile(null);
        if (isSupabaseConfigured()) {
          setUser(null);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('reset_password');
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncProfile]);

  // Local storage persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(movieRequests));
  }, [movieRequests]);

  useEffect(() => {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(supportTickets));
  }, [supportTickets]);

  // ----------------------------------------------------------------------------
  // Step 1: Sign Up -> Triggers OTP step
  // ----------------------------------------------------------------------------
  const signUpUser = async (email: string, password: string, fullName: string, phone?: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      register(fullName, email, phone);
      return { success: true };
    }

    const res = await signUp(email, password, fullName, phone);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }

    // Set pending signup state to prompt for OTP verification
    setPendingAuth({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone?.trim(),
      password,
      tempUser: res.data?.user || null,
      tempSession: res.data?.session || null,
      mode: 'signup'
    });

    return { success: true, requireOtp: true };
  };

  // ----------------------------------------------------------------------------
  // Step 1: Sign In (Email + Password) -> Triggers OTP generation & step 2
  // Server-side validates credentials; browser receives NO session before OTP.
  // ----------------------------------------------------------------------------
  const signInUser = async (email: string, password: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      login(email);
      return { success: true };
    }

    // Step 1: Send credentials to server for validation & OTP generation
    const challengeRes = await requestLoginChallenge(email, password);
    if (challengeRes.error) {
      setAuthError(challengeRes.error);
      return { success: false, error: challengeRes.error };
    }

    // Set pending login state (User is NOT logged in yet; no session exists in browser)
    setPendingAuth({
      email: email.trim(),
      password,
      mode: 'login'
    });

    return { success: true, requireOtp: true };
  };

  // ----------------------------------------------------------------------------
  // Step 2: Submit OTP (for either signup or login)
  // ----------------------------------------------------------------------------
  const submitOtp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingAuth) {
      return { success: false, error: 'No authentication in progress.' };
    }

    setAuthError(null);

    if (pendingAuth.mode === 'signup') {
      // 1. Verify signup OTP via Supabase
      const res = await verifySignUpOtp(pendingAuth.email, code);
      if (res.error) {
        return { success: false, error: res.error };
      }

      if (res.data?.user) {
        sessionStorage.setItem(`chitrokatha_otp_verified_${res.data.user.id}`, 'true');
        await syncProfile(res.data.user);
        setPendingAuth(null);
        setIsAuthModalOpen(false);
        dispatchAppNotification({
          type: 'system',
          titleBn: '🎉 অ্যাকাউন্ট সক্রিয় হয়েছে!',
          titleEn: '🎉 Account Activated!',
          messageBn: 'চিত্রকথায় আপনাকে স্বাগতম। আপনার পছন্দের সিনেমা ও নাটক উপভোগ করুন।',
          messageEn: 'Welcome to ChitroKatha. Enjoy unlimited cinema discovery!'
        });
        return { success: true };
      }
      return { success: false, error: 'Verification failed.' };
    } else {
      // 2. Verify login OTP via Edge Function / RPC and acquire Supabase session
      const otpVerifyRes = await verifyLoginOtp(pendingAuth.email, code);
      if (otpVerifyRes.error) {
        return { success: false, error: otpVerifyRes.error };
      }

      // Successful OTP verification! Session is established natively
      const currentUser = otpVerifyRes.data?.user || (await getCurrentUser());
      if (currentUser) {
        sessionStorage.setItem(`chitrokatha_otp_verified_${currentUser.id}`, 'true');
        await syncProfile(currentUser);
      }

      setPendingAuth(null);
      setIsAuthModalOpen(false);
      dispatchAppNotification({
        type: 'system',
        titleBn: '👋 স্বাগতম!',
        titleEn: '👋 Welcome back!',
        messageBn: 'ওটিপি যাচাই সফল হয়েছে। আপনি চিত্রকথায় প্রবেশ করেছেন।',
        messageEn: 'Two-step verification successful. Welcome to ChitroKatha!'
      });
      return { success: true };
    }
  };

  // ----------------------------------------------------------------------------
  // Resend OTP
  // ----------------------------------------------------------------------------
  const resendOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingAuth) {
      return { success: false, error: 'No active verification in progress.' };
    }

    if (pendingAuth.mode === 'signup') {
      // Resend signup confirmation OTP via Supabase Auth
      const res = await resendSignUpOtp(pendingAuth.email);
      if (res.error) {
        return { success: false, error: res.error };
      }
      return { success: true };
    } else {
      // Resend login OTP via server Edge Function
      const res = await resendLoginOtp(pendingAuth.email, pendingAuth.password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      return { success: true };
    }
  };

  // Supabase Sign Out: fully clears session and OTP validation tokens
  const signOutUser = async () => {
    if (user?.id) {
      sessionStorage.removeItem(`chitrokatha_otp_verified_${user.id}`);
    }
    if (supabaseUser?.id) {
      sessionStorage.removeItem(`chitrokatha_otp_verified_${supabaseUser.id}`);
    }
    if (isSupabaseConfigured()) {
      await signOut();
    }
    setPendingAuth(null);
    setSupabaseUser(null);
    setProfile(null);
    setUser(null);
  };

  // Request Password Reset
  const resetPasswordEmail = async (email: string) => {
    setAuthError(null);
    const res = await requestPasswordReset(email);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    dispatchAppNotification({
      type: 'system',
      titleBn: '📧 পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে',
      titleEn: '📧 Password Reset Email Sent',
      messageBn: `"${email}" ঠিকানায় পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`,
      messageEn: `Password reset link sent to "${email}". Please check your inbox or spam folder.`
    });
    return { success: true };
  };

  // Update Password
  const changePassword = async (newPassword: string) => {
    setAuthError(null);
    const res = await updatePassword(newPassword);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    setIsAuthModalOpen(false);
    dispatchAppNotification({
      type: 'system',
      titleBn: '✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে',
      titleEn: '✅ Password Updated Successfully',
      messageBn: 'আপনার নতুন পাসওয়ার্ড সংরক্ষিত হয়েছে।',
      messageEn: 'Your new password has been set successfully.'
    });
    return { success: true };
  };

  // Legacy wrappers
  const login = (email: string, name?: string) => {
    const cleanName = name || email.split('@')[0] || 'দর্শক';
    const p: UserProfile = {
      id: user?.id || `user_${Date.now()}`,
      name: cleanName,
      email,
      phone: user?.phone || '০১৬৪৩৪৪২৫১৮',
      avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      tier: user?.tier || 'free',
      joinedAt: user?.joinedAt || new Date().toISOString(),
      role: 'user',
      status: 'active'
    };
    setUser(p);
    setIsAuthModalOpen(false);
  };

  const register = (name: string, email: string, phone?: string) => {
    const p: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim() || 'দর্শক',
      email: email.trim(),
      phone: phone?.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      tier: 'free',
      joinedAt: new Date().toISOString(),
      role: 'user',
      status: 'active'
    };
    setUser(p);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    signOutUser();
  };

  const updateUserProfile = async (name: string, email: string, phone?: string, avatar?: string) => {
    if (!user) return;
    const updated = {
      ...user,
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone?.trim() || user.phone,
      avatar: avatar || user.avatar
    };
    setUser(updated);

    // If Supabase user is logged in, update remote profile
    if (supabaseUser) {
      await updateProfile(supabaseUser.id, {
        full_name: name.trim() || user.name,
        phone: phone?.trim() || user.phone || null,
        avatar_url: avatar || user.avatar
      });
    }
  };

  // Subscription & Payment flows
  const submitSubscriptionPayment = (
    plan: SubscriptionTier,
    amount: number,
    trxId: string,
    senderPhone: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'upay'
  ) => {
    const request: PaymentRequest = {
      id: `pay_${Date.now()}`,
      userId: user?.id || `guest_${Date.now()}`,
      userName: user?.name || 'দর্শক',
      userEmail: user?.email || 'user@chitrokatha.com',
      userPhone: user?.phone || senderPhone,
      plan,
      amount,
      method,
      senderPhone,
      trxId: trxId.trim().toUpperCase(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    if (user) {
      setUser({
        ...user,
        pendingSubscription: request
      });
    } else {
      const guestProfile: UserProfile = {
        id: request.userId,
        name: request.userName,
        email: request.userEmail,
        phone: senderPhone,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderPhone)}`,
        tier: 'free',
        joinedAt: new Date().toISOString(),
        pendingSubscription: request
      };
      setUser(guestProfile);
    }

    dispatchAppNotification({
      type: 'system',
      titleBn: '⏳ পেমেন্ট ভেরিফিকেশন জমা হয়েছে',
      titleEn: '⏳ Payment Verification Submitted',
      messageBn: `TrxID: ${trxId.toUpperCase()} সফলভাবে জমা হয়েছে। অ্যাডমিন ভেরিফাই করলেই ভিআইপি মেম্বারশিপ চালু হয়ে যাবে।`,
      messageEn: `TrxID: ${trxId.toUpperCase()} has been submitted for admin verification.`
    });
  };

  const approvePendingSubscription = () => {
    if (!user?.pendingSubscription) return;
    const plan = user.pendingSubscription.plan;
    setUser({
      ...user,
      tier: plan,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pendingSubscription: undefined
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '🎉 ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে!',
      titleEn: '🎉 VIP Membership Activated!',
      messageBn: 'অভিনন্দন! আপনার ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে। এখন সমস্ত বিজ্ঞাপন ছাড়া ৪কে আল্ট্রা এইচডি কোয়ালিটিতে সিনেমা ও নাটক উপভোগ করুন!',
      messageEn: 'Congratulations! Your VIP Subscription is active. Enjoy 100% ad-free streaming in 4K UHD!'
    });
  };

  const cancelPendingSubscription = () => {
    if (!user) return;
    setUser({
      ...user,
      pendingSubscription: undefined
    });
  };

  const upgradeSubscription = (tier: SubscriptionTier) => {
    if (!user) return;
    setUser({
      ...user,
      tier,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pendingSubscription: undefined,
      isPaused: false,
      pausedUntil: undefined,
      pauseDays: undefined
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '🎉 ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে!',
      titleEn: '🎉 VIP Membership Activated!',
      messageBn: `অভিনন্দন! আপনার ${tier === 'vip' ? 'ভিআইপি' : 'প্রিমিয়াম'} সাবস্ক্রিপশন সক্রিয় হয়েছে। এখন ১০০% বিজ্ঞাপনমুক্ত উপভোগ করুন!`,
      messageEn: `Congratulations! Your ${tier.toUpperCase()} subscription is active. Enjoy 100% ad-free streaming!`
    });
  };

  const cancelSubscription = (reason?: string) => {
    if (!user) return;
    setUser({
      ...user,
      tier: 'free',
      subscriptionEndDate: undefined,
      pendingSubscription: undefined,
      isPaused: false,
      pausedUntil: undefined,
      pauseDays: undefined,
      cancellationReason: reason || 'User cancelled subscription'
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '❌ সাবস্ক্রিপশন বাতিল করা হয়েছে',
      titleEn: '❌ Subscription Cancelled',
      messageBn: 'আপনার সাবস্ক্রিপশন বাতিল করা হয়েছে। আপনার অ্যাকাউন্ট ফ্রি সংস্করণে ফিরে এসেছে।',
      messageEn: 'Your subscription has been cancelled immediately.'
    });
  };

  const pauseSubscription = (days: number) => {
    if (!user || user.tier === 'free') return;
    const clampedDays = Math.max(1, Math.min(7, Math.round(days)));
    const now = Date.now();
    const pausedUntil = new Date(now + clampedDays * 24 * 60 * 60 * 1000).toISOString();

    let newEndDate = user.subscriptionEndDate;
    if (user.subscriptionEndDate) {
      const currentEndMs = new Date(user.subscriptionEndDate).getTime();
      newEndDate = new Date(currentEndMs + clampedDays * 24 * 60 * 60 * 1000).toISOString();
    }

    setUser({
      ...user,
      isPaused: true,
      pausedUntil,
      pauseDays: clampedDays,
      subscriptionEndDate: newEndDate
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '⏸️ সাবস্ক্রিপশন পজ করা হয়েছে',
      titleEn: '⏸️ Subscription Paused',
      messageBn: `আপনার সাবস্ক্রিপশন আগামী ${clampedDays} দিনের জন্য পজ রাখা হয়েছে। মেয়াদ সংরক্ষিত থাকবে!`,
      messageEn: `Your subscription has been paused for ${clampedDays} days.`
    });
  };

  const resumeSubscription = () => {
    if (!user) return;
    setUser({
      ...user,
      isPaused: false,
      pausedUntil: undefined,
      pauseDays: undefined
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '▶️ সাবস্ক্রিপশন পুনরায় চালু হয়েছে',
      titleEn: '▶️ Subscription Resumed',
      messageBn: 'আপনার সাবস্ক্রিপশন সফলভাবে পুনরায় চালু হয়েছে।',
      messageEn: 'Your subscription has resumed.'
    });
  };

  // Movie Request
  const submitMovieRequest = (
    movieTitle: string,
    category: MovieRequest['category'],
    releaseYear?: string,
    note?: string
  ) => {
    const newReq: MovieRequest = {
      id: `req_${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.name || 'দর্শক',
      userEmail: user?.email,
      movieTitle: movieTitle.trim(),
      category,
      releaseYear: releaseYear?.trim(),
      note: note?.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setMovieRequests((prev) => [newReq, ...prev]);
  };

  // Support Ticket
  const submitSupportTicket = (
    subject: string,
    message: string,
    category: SupportTicket['category']
  ) => {
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId: user?.id || 'guest_0',
      userName: user?.name || 'দর্শক',
      userEmail: user?.email || 'N/A',
      userPhone: user?.phone || '০১৬৪৩৪৪২৫১৮',
      subject: subject.trim(),
      message: message.trim(),
      category,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  const isPremium = (user?.tier === 'standard' || user?.tier === 'vip') && !user?.isPaused;
  const currentTier: SubscriptionTier = user?.tier || 'free';
  const role: UserRole = profile?.role || user?.role || 'user';
  const isAdmin =
    (role === 'admin' || role === 'super_admin') &&
    (profile?.status === 'active' || user?.status === 'active') &&
    !pendingAuth;
  const isSuperAdmin =
    role === 'super_admin' &&
    (profile?.status === 'active' || user?.status === 'active') &&
    !pendingAuth;

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        profile,
        role,
        isAdmin,
        isSuperAdmin,
        isLoggedIn: Boolean(user && !pendingAuth),
        isPremium,
        tier: currentTier,
        isLoading,
        authError,
        setAuthError,
        pendingAuth,
        isOtpRequired,
        submitOtp,
        resendOtp,
        cancelPendingAuth,
        signUpUser,
        signInUser,
        signOutUser,
        resetPasswordEmail,
        changePassword,
        login,
        register,
        logout,
        updateUserProfile,
        submitSubscriptionPayment,
        approvePendingSubscription,
        cancelPendingSubscription,
        upgradeSubscription,
        cancelSubscription,
        pauseSubscription,
        resumeSubscription,
        movieRequests,
        submitMovieRequest,
        supportTickets,
        submitSupportTicket,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isRequestModalOpen,
        setIsRequestModalOpen,
        isSupportModalOpen,
        setIsSupportModalOpen,
        openLoginModal: () => {
          setAuthError(null);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        },
        openRegisterModal: () => {
          setAuthError(null);
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        },
        openSubscriptionModal: () => setIsSubscriptionModalOpen(true),
        openProfileModal: () => setIsProfileModalOpen(true),
        openRequestModal: () => setIsRequestModalOpen(true),
        openSupportModal: () => setIsSupportModalOpen(true)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
