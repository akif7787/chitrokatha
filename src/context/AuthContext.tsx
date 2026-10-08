import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, SubscriptionTier, PaymentRequest, MovieRequest, SupportTicket } from '../types/user';
import { Profile, UserRole } from '../types/database';
import { dispatchAppNotification } from './NotificationContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { sendSubscriptionConfirmationEmail } from '../services/subscriptionEmailService';
import {
  signUp,
  signIn,
  signOut,
  getCurrentSession,
  getCurrentUser,
  requestPasswordReset,
  updatePassword,
  parseAuthUrlTokens,
  initializeRecoverySessionFromUrl,
  onAuthStateChange,
  verifySignUpOtp,
  resendSignUpOtp,
  requestLoginChallenge,
  verifyLoginOtp,
  resendLoginOtp,
  requestLoginOtp,
  signInAdminDirect
} from '../services/authService';
import { getProfile, updateProfile } from '../services/profileService';
import {
  submitPaymentRequest,
  getStoredLocalPayments,
  fetchUserActiveSubscription,
  fetchUserLatestPayment,
  PAYMENT_STATUS_EVENT
} from '../services/paymentService';
import { submitSupportMessage, notifySupportChanged } from '../services/supportService';
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
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  ) => Promise<{ success: boolean; error?: string }>;
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
  authMessage: string | null;
  setAuthMessage: (msg: string | null) => void;
  isRecoverySession?: boolean;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isSubscriptionStatusModalOpen: boolean;
  setIsSubscriptionStatusModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isRequestModalOpen: boolean;
  setIsRequestModalOpen: (open: boolean) => void;
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  latestPayment: PaymentRequest | null;
  refreshSubscriptionStatus: () => Promise<void>;

  // Modal triggers
  openLoginModal: (message?: string | React.MouseEvent<unknown> | unknown) => void;
  openRegisterModal: (message?: string | React.MouseEvent<unknown> | unknown) => void;
  requireAuthForPlayback: (onAllowed?: () => void) => boolean;
  openSubscriptionModal: () => void;
  openSubscriptionStatusModal: () => void;
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
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isRecoverySession, setIsRecoverySession] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSubscriptionStatusModalOpen, setIsSubscriptionStatusModalOpen] = useState(false);
  const [pendingSubscriptionOpen, setPendingSubscriptionOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [latestPayment, setLatestPayment] = useState<PaymentRequest | null>(null);

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

  // Synchronize database subscription & payment requests
  const syncSubscriptionAndPayments = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      const [activeSub, latestPay] = await Promise.all([
        fetchUserActiveSubscription(userId),
        fetchUserLatestPayment(userId),
      ]);

      if (latestPay) {
        setLatestPayment(latestPay);
      }

      setUser((prev) => {
        if (!prev || prev.id !== userId) return prev;

        let updatedTier = prev.tier;
        let updatedEndDate = prev.subscriptionEndDate;
        let updatedPending = prev.pendingSubscription;

        // Subscription tier and expiry come strictly and exclusively from user_subscriptions
        if (activeSub?.hasActiveSubscription && activeSub.tier) {
          updatedTier = activeSub.tier;
          updatedEndDate = activeSub.endDate;
        } else {
          updatedTier = 'free';
          updatedEndDate = undefined;
        }

        // payment_requests only affects pending badge status, NEVER resurrects tier
        if (latestPay) {
          if (latestPay.status === 'pending') {
            updatedPending = latestPay;
          } else {
            updatedPending = undefined;
          }
        } else if (!isSupabaseConfigured()) {
          const localList = getStoredLocalPayments();
          const localPay = localList.find((p) => p.userId === userId || p.userEmail === prev.email);
          if (localPay?.status === 'pending') {
            updatedPending = localPay;
          } else {
            updatedPending = undefined;
          }
        } else {
          updatedPending = undefined;
        }

        if (
          updatedTier !== prev.tier ||
          updatedEndDate !== prev.subscriptionEndDate ||
          updatedPending !== prev.pendingSubscription
        ) {
          return {
            ...prev,
            tier: updatedTier,
            subscriptionEndDate: updatedEndDate,
            pendingSubscription: updatedPending,
          };
        }
        return prev;
      });
    } catch (err) {
      console.warn('[AuthContext] syncSubscriptionAndPayments error:', err);
    }
  }, []);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (user?.id) {
      await syncSubscriptionAndPayments(user.id);
    }
  }, [user?.id, syncSubscriptionAndPayments]);

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

    // Query active subscription and latest payment from database
    const [dbProfile, activeSub, latestPay] = await Promise.all([
      getProfile(sUser.id),
      fetchUserActiveSubscription(sUser.id),
      fetchUserLatestPayment(sUser.id),
    ]);

    if (latestPay) {
      setLatestPayment(latestPay);
    }

    // Restore any pending payment request for this user (only from local storage if Supabase is unconfigured)
    let activePending: PaymentRequest | undefined = undefined;
    if (!isSupabaseConfigured()) {
      const pendingList = getStoredLocalPayments();
      activePending = pendingList.find(
        (p) => (p.userId === sUser.id || p.userEmail === sUser.email) && p.status === 'pending'
      );
    }

    let initialTier: SubscriptionTier = 'free';
    let initialEndDate: string | undefined = undefined;
    let initialPending: PaymentRequest | undefined = undefined;

    // Subscription tier and expiry come strictly and exclusively from user_subscriptions
    if (activeSub?.hasActiveSubscription && activeSub.tier) {
      initialTier = activeSub.tier;
      initialEndDate = activeSub.endDate;
    } else {
      initialTier = 'free';
      initialEndDate = undefined;
    }

    // payment_requests only affects pending badge status, NEVER resurrects tier
    if (latestPay) {
      if (latestPay.status === 'pending') {
        initialPending = latestPay;
      } else {
        initialPending = undefined;
      }
    } else if (activePending) {
      initialPending = activePending;
    }

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
        tier: initialTier,
        subscriptionEndDate: initialEndDate,
        pendingSubscription: initialPending,
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
        tier: initialTier,
        subscriptionEndDate: initialEndDate,
        pendingSubscription: initialPending,
        joinedAt: sUser.created_at,
        role: 'user',
        status: 'active'
      };
      setUser(mappedUser);
    }
  }, []);

  // Initialize Session on App Mount
  useEffect(() => {
    let mounted = true;

    // 1. Subscribe to auth state changes immediately so no events are missed
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('chitrokatha_in_recovery', 'true');
        }
        setAuthModalMode('reset_password');
        setIsAuthModalOpen(true);
        return;
      }

      // If we are currently in password recovery mode, ignore general session activation
      const inRecovery =
        isRecoverySession ||
        (typeof window !== 'undefined' &&
          window.sessionStorage.getItem('chitrokatha_in_recovery') === 'true') ||
        parseAuthUrlTokens().isRecovery;

      if (inRecovery) {
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          // Guard: Never auto-activate unconfirmed user on SIGNED_IN event
          if (!session.user.email_confirmed_at) {
            return;
          }

          const otpVerified = sessionStorage.getItem(`chitrokatha_otp_verified_${session.user.id}`);
          if (otpVerified === 'true') {
            await syncProfile(session.user);
          } else {
            // Check if user is an admin; admins do not require normal-user OTP verification
            const existingProfile = await getProfile(session.user.id);
            if (
              existingProfile &&
              (existingProfile.role === 'admin' || existingProfile.role === 'super_admin') &&
              existingProfile.status === 'active'
            ) {
              sessionStorage.setItem(`chitrokatha_otp_verified_${session.user.id}`, 'true');
              await syncProfile(session.user);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setProfile(null);
        if (isSupabaseConfigured()) {
          setUser(null);
        }
      }
    });

    async function initSession() {
      try {
        if (isSupabaseConfigured()) {
          const urlTokens = parseAuthUrlTokens();

          // Check if URL returned an explicit auth error (e.g. otp_expired / access_denied)
          if (urlTokens.errorCode || urlTokens.error) {
            if (mounted) {
              setAuthModalMode('reset_password');
              setIsAuthModalOpen(true);
              setAuthError(
                urlTokens.errorDescription ||
                'পাসওয়ার্ড রিসেট লিঙ্কটির মেয়াদ শেষ হয়েছে বা ইতোমধ্যেই ব্যবহৃত হয়েছে। দয়া করে নতুন লিঙ্ক অনুরোধ করুন। (Password reset link has expired or has already been used. Please request a new link.)'
              );
            }
            return;
          }

          // Check if this visit is a password recovery session
          const isRecoveryIntent =
            urlTokens.isRecovery ||
            (typeof window !== 'undefined' &&
              window.sessionStorage.getItem('chitrokatha_in_recovery') === 'true');

          if (isRecoveryIntent) {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('chitrokatha_in_recovery', 'true');
            }
            setIsRecoverySession(true);

            // Wait for native Supabase client to finish detecting session from URL
            let recoverySession = await getCurrentSession();
            if (!recoverySession) {
              // Fallback: manually set/exchange from URL tokens if native detection didn't capture it
              await initializeRecoverySessionFromUrl();
              recoverySession = await getCurrentSession();
            }

            if (recoverySession?.user) {
              if (mounted) {
                setIsRecoverySession(true);
                setAuthModalMode('reset_password');
                setIsAuthModalOpen(true);
              }
              // CRITICAL: Return immediately! Do NOT signOut! Do NOT syncProfile!
              // The user is in password recovery mode, not fully authenticated in the app.
              return;
            } else {
              if (mounted) {
                setAuthModalMode('reset_password');
                setIsAuthModalOpen(true);
                setAuthError('পাসওয়ার্ড রিসেট সেশনের মেয়াদ শেষ হয়েছে বা লিঙ্কটি অকার্যকর। দয়া করে পুনরায় রিসেট লিঙ্ক অনুরোধ করুন। (Password reset session expired or invalid. Please request a new link.)');
              }
              return;
            }
          }

          // Normal session initialization (not recovery)
          const session = await getCurrentSession();
          if (mounted && session?.user) {
            // Guard: If email is unconfirmed, reject session and sign out
            if (!session.user.email_confirmed_at) {
              await signOut();
              setSupabaseUser(null);
              setProfile(null);
              setUser(null);
              return;
            }

            // Check if OTP verified flag is present in sessionStorage for this session
            const otpVerified = sessionStorage.getItem(`chitrokatha_otp_verified_${session.user.id}`);
            if (otpVerified === 'true') {
              await syncProfile(session.user);
            } else {
              // Check if user is an active admin / super_admin; admin accounts do not require customer email OTP
              const existingProfile = await getProfile(session.user.id);
              if (
                existingProfile &&
                (existingProfile.role === 'admin' || existingProfile.role === 'super_admin') &&
                existingProfile.status === 'active'
              ) {
                sessionStorage.setItem(`chitrokatha_otp_verified_${session.user.id}`, 'true');
                await syncProfile(session.user);
              } else if (existingProfile && existingProfile.role === 'user') {
                // Only normal customer accounts require fresh login + OTP after restart/session expiration
                await signOut();
                setSupabaseUser(null);
                setProfile(null);
                setUser(null);
              } else {
                // If profile could not be loaded temporarily (e.g. network/loading timing),
                // do NOT immediately call signOut(). Sync profile to retry gracefully without killing session.
                await syncProfile(session.user);
              }
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

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncProfile, isRecoverySession]);

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
  // Realtime & Live Synchronization of Payment Requests and Subscription Status
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    // 1. Initial live check against Supabase
    syncSubscriptionAndPayments(currentUserId);

    // 2. Supabase Realtime channel on payment_requests & user_subscriptions
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel(`user_sub_changes_${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_requests',
            filter: `user_id=eq.${currentUserId}`
          },
          () => {
            syncSubscriptionAndPayments(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${currentUserId}`
          },
          () => {
            syncSubscriptionAndPayments(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload: any) => {
            const isInsert =
              payload?.eventType?.toUpperCase() === 'INSERT' ||
              (!payload?.eventType && payload?.new);

            if (isInsert && payload?.new) {
              dispatchAppNotification({
                type: 'system',
                titleBn: payload.new.title,
                titleEn: payload.new.title,
                messageBn: payload.new.message,
                messageEn: payload.new.message,
              });
            }
            // Notify same window or components to reload DB notifications
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('chitrokatha_refresh_user_notifications'));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${currentUserId}`
          },
          () => {
            notifySupportChanged();
          }
        )
        .subscribe();
    }

    // 3. Local custom event for instant same-browser updates (e.g. Admin in another tab or same window)
    const handlePaymentEvent = () => {
      syncSubscriptionAndPayments(currentUserId);
    };
    window.addEventListener(PAYMENT_STATUS_EVENT, handlePaymentEvent);
    window.addEventListener('storage', handlePaymentEvent);

    // 4. Window focus / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSubscriptionAndPayments(currentUserId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 5. Gentle polling while a payment is pending
    let interval: any = null;
    if (user?.pendingSubscription) {
      interval = setInterval(() => {
        syncSubscriptionAndPayments(currentUserId);
      }, 7000);
    }

    return () => {
      if (channel) channel.unsubscribe();
      window.removeEventListener(PAYMENT_STATUS_EVENT, handlePaymentEvent);
      window.removeEventListener('storage', handlePaymentEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (interval) clearInterval(interval);
    };
  }, [user?.id, Boolean(user?.pendingSubscription), syncSubscriptionAndPayments]);

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

    // Guard: Under no circumstances should unverified signup activate a session.
    // If Supabase returned an unexpected pre-verification session, discard it.
    if (res.data?.session) {
      await signOut();
    }

    // Set pending signup state to prompt for OTP verification
    setPendingAuth({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone?.trim(),
      password,
      tempUser: res.data?.user || null,
      tempSession: null,
      mode: 'signup'
    });

    // Explicitly guarantee the AuthModal remains open for OTP entry
    setIsAuthModalOpen(true);

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
  // Admin Sign In (Email + Password ONLY — NO OTP challenge for admin console)
  // Direct authentication with role verification for admin/super_admin accounts.
  // ----------------------------------------------------------------------------
  const signInAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      login(email);
      return { success: true };
    }

    const res = await signInAdminDirect(email, password);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }

    if (res.data?.user) {
      sessionStorage.setItem(`chitrokatha_otp_verified_${res.data.user.id}`, 'true');
      await syncProfile(res.data.user);
    }

    return { success: true };
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
        if (pendingSubscriptionOpen) {
          setPendingSubscriptionOpen(false);
          setIsSubscriptionModalOpen(true);
        }
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
      if (pendingSubscriptionOpen) {
        setPendingSubscriptionOpen(false);
        setIsSubscriptionModalOpen(true);
      }
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
  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const res = await updatePassword(newPassword);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }

    // Success: terminate temporary recovery session to enforce standard login
    setIsRecoverySession(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('chitrokatha_in_recovery');
    }
    await signOut();
    setSupabaseUser(null);
    setProfile(null);
    setUser(null);

    // Clean up URL hash / search params so recovery tokens are removed from browser address bar
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Switch to login tab in the modal so user logs in with new credentials
    setAuthModalMode('login');
    setIsAuthModalOpen(true);

    dispatchAppNotification({
      type: 'system',
      titleBn: '✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে',
      titleEn: '✅ Password Updated Successfully',
      messageBn: 'আপনার নতুন পাসওয়ার্ড সংরক্ষিত হয়েছে। এবার আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
      messageEn: 'Your new password has been set successfully. Please sign in with your new password.'
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
    if (pendingSubscriptionOpen) {
      setPendingSubscriptionOpen(false);
      setIsSubscriptionModalOpen(true);
    }
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
    if (pendingSubscriptionOpen) {
      setPendingSubscriptionOpen(false);
      setIsSubscriptionModalOpen(true);
    }
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
  const submitSubscriptionPayment = async (
    plan: SubscriptionTier,
    amount: number,
    trxId: string,
    senderPhone: string,
    method: 'bkash' | 'nagad' | 'rocket' | 'upay'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isLoggedIn || !user || !supabaseUser?.id) {
      const msg = 'Please log in and verify your account before submitting a payment request. (পেমেন্ট রিকোয়েস্ট পাঠানোর আগে অনুগ্রহ করে লগইন ও অ্যাকাউন্ট ভেরিফাই করুন।)';
      dispatchAppNotification({
        type: 'system',
        titleBn: '⚠️ লগইন প্রয়োজন',
        titleEn: '⚠️ Login Required',
        messageBn: 'পেমেন্ট রিকোয়েস্ট পাঠানোর আগে অনুগ্রহ করে লগইন ও অ্যাকাউন্ট ভেরিফাই করুন।',
        messageEn: msg
      });
      openSubscriptionModal();
      return { success: false, error: msg };
    }

    const res = await submitPaymentRequest({
      userId: supabaseUser.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || senderPhone,
      plan,
      amount,
      method,
      senderPhone,
      trxId
    });

    if (!res.success || !res.data) {
      const errMsg = res.error || 'Payment request could not be submitted. Please try again.';
      dispatchAppNotification({
        type: 'system',
        titleBn: '❌ পেমেন্ট রিকোয়েস্ট ব্যর্থ',
        titleEn: '❌ Payment Submission Failed',
        messageBn: errMsg,
        messageEn: errMsg
      });
      return { success: false, error: errMsg };
    }

    const request = res.data;
    setUser({
      ...user,
      pendingSubscription: request
    });
    setLatestPayment(request);

    dispatchAppNotification({
      type: 'system',
      titleBn: '⏳ পেমেন্ট ভেরিফিকেশন জমা হয়েছে',
      titleEn: '⏳ Payment Verification Submitted',
      messageBn: `TrxID: ${trxId.toUpperCase()} সফলভাবে জমা হয়েছে। অ্যাডমিন ভেরিফাই করলেই ভিআইপি মেম্বারশিপ চালু হয়ে যাবে।`,
      messageEn: `TrxID: ${trxId.toUpperCase()} has been submitted for admin verification.`
    });

    return { success: true };
  };

  // Security: Client-side self-activation is strictly disabled.
  // Subscriptions can only be activated by an Administrator via the Admin Panel or secure RPC.
  const approvePendingSubscription = () => {
    console.warn('[Security] Client-side approval is disabled. Payment approvals must be performed by an Admin in the Admin Console.');
  };

  const cancelPendingSubscription = () => {
    if (!user) return;
    setUser({
      ...user,
      pendingSubscription: undefined
    });
  };

  const upgradeSubscription = (_tier: SubscriptionTier) => {
    console.warn('[Security] Direct client-side subscription upgrade is disabled. Please submit a payment request for admin verification.');
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

    // Submit to Supabase support_messages table & broadcast for Admin Panel
    submitSupportMessage({
      userId: user?.id,
      userName: user?.name || 'দর্শক',
      userEmail: user?.email || 'guest@chitrokatha.online',
      userPhone: user?.phone,
      subject: subject.trim(),
      category,
      message: message.trim(),
    }).catch((err) => console.warn('[AuthContext] submitSupportMessage error:', err));
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

  const isLoggedIn = isSupabaseConfigured()
    ? Boolean(
        supabaseUser &&
        user &&
        user.status === 'active' &&
        supabaseUser.email_confirmed_at &&
        !pendingAuth
      )
    : Boolean(user && !pendingAuth);

  const openLoginModal = useCallback((message?: unknown) => {
    setAuthError(null);
    setAuthMessage(typeof message === 'string' ? message : null);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, []);

  const openRegisterModal = useCallback((message?: unknown) => {
    setAuthError(null);
    setAuthMessage(typeof message === 'string' ? message : null);
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  }, []);

  const requireAuthForPlayback = useCallback((onAllowed?: () => void): boolean => {
    if (isLoggedIn) {
      if (onAllowed) onAllowed();
      return true;
    }
    openLoginModal('ভিডিও দেখতে আগে একটি অ্যাকাউন্ট তৈরি করুন বা লগ ইন করুন। (Please create an account or log in to watch this video.)');
    return false;
  }, [isLoggedIn, openLoginModal]);

  const openSubscriptionModal = useCallback(() => {
    if (!isLoggedIn) {
      setAuthError(null);
      setAuthMessage('সাবস্ক্রিপশন নিতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন। (Please sign in to your account first before subscribing.)');
      setAuthModalMode('login');
      setPendingSubscriptionOpen(true);
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubscriptionModalOpen(true);
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        profile,
        role,
        isAdmin,
        isSuperAdmin,
        isLoggedIn,
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
        signInAdmin,
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
        authMessage,
        setAuthMessage,
        isRecoverySession,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        isSubscriptionStatusModalOpen,
        setIsSubscriptionStatusModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isRequestModalOpen,
        setIsRequestModalOpen,
        isSupportModalOpen,
        setIsSupportModalOpen,
        latestPayment,
        refreshSubscriptionStatus,
        openLoginModal,
        openRegisterModal,
        requireAuthForPlayback,
        openSubscriptionModal,
        openSubscriptionStatusModal: () => setIsSubscriptionStatusModalOpen(true),
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
