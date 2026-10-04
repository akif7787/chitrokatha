import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SubscriptionTier, PaymentRequest, MovieRequest, SupportTicket } from '../types/user';
import { dispatchAppNotification } from './NotificationContext';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isPremium: boolean;
  tier: SubscriptionTier;
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
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
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

  // Modal Visibilities
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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

  const login = (email: string, name?: string) => {
    const cleanName = name || email.split('@')[0] || 'দর্শক';
    const profile: UserProfile = {
      id: user?.id || `user_${Date.now()}`,
      name: cleanName,
      email,
      phone: user?.phone || '০১৬৪৩৪৪২৫১৮',
      avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      tier: user?.tier || 'free',
      joinedAt: user?.joinedAt || new Date().toISOString(),
    };
    setUser(profile);
    setIsAuthModalOpen(false);
  };

  const register = (name: string, email: string, phone?: string) => {
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim() || 'দর্শক',
      email: email.trim(),
      phone: phone?.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      tier: 'free',
      joinedAt: new Date().toISOString(),
    };
    setUser(profile);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = (name: string, email: string, phone?: string, avatar?: string) => {
    if (!user) return;
    setUser({
      ...user,
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone?.trim() || user.phone,
      avatar: avatar || user.avatar,
    });
  };

  // Submit Send Money Payment for Admin Verification
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
      submittedAt: new Date().toISOString(),
    };

    if (user) {
      setUser({
        ...user,
        pendingSubscription: request,
      });
    } else {
      // Create guest profile with pending subscription
      const guestProfile: UserProfile = {
        id: request.userId,
        name: request.userName,
        email: request.userEmail,
        phone: senderPhone,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderPhone)}`,
        tier: 'free',
        joinedAt: new Date().toISOString(),
        pendingSubscription: request,
      };
      setUser(guestProfile);
    }
    dispatchAppNotification({
      type: 'system',
      titleBn: '⏳ পেমেন্ট ভেরিফিকেশন জমা হয়েছে',
      titleEn: '⏳ Payment Verification Submitted',
      messageBn: `TrxID: ${trxId.toUpperCase()} সফলভাবে জমা হয়েছে। অ্যাডমিন ভেরিফাই করলেই ভিআইপি মেম্বারশিপ চালু হয়ে যাবে।`,
      messageEn: `TrxID: ${trxId.toUpperCase()} has been submitted for admin verification.`,
    });
  };

  // Approve Pending Subscription (Admin Verification)
  const approvePendingSubscription = () => {
    if (!user?.pendingSubscription) return;
    const plan = user.pendingSubscription.plan;
    setUser({
      ...user,
      tier: plan,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pendingSubscription: undefined,
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '🎉 ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে!',
      titleEn: '🎉 VIP Membership Activated!',
      messageBn: 'অভিনন্দন! আপনার ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে। এখন সমস্ত বিজ্ঞাপন ছাড়া ৪কে আল্ট্রা এইচডি কোয়ালিটিতে সিনেমা ও নাটক উপভোগ করুন!',
      messageEn: 'Congratulations! Your VIP Subscription is active. Enjoy 100% ad-free streaming in 4K UHD!',
    });
  };

  const cancelPendingSubscription = () => {
    if (!user) return;
    setUser({
      ...user,
      pendingSubscription: undefined,
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
      pauseDays: undefined,
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '🎉 ভিআইপি মেম্বারশিপ সক্রিয় হয়েছে!',
      titleEn: '🎉 VIP Membership Activated!',
      messageBn: `অভিনন্দন! আপনার ${tier === 'vip' ? 'ভিআইপি' : 'প্রিমিয়াম'} সাবস্ক্রিপশন সক্রিয় হয়েছে। এখন ১০০% বিজ্ঞাপনমুক্ত উপভোগ করুন!`,
      messageEn: `Congratulations! Your ${tier.toUpperCase()} subscription is active. Enjoy 100% ad-free streaming!`,
    });
  };

  // Cancel active subscription immediately
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
      cancellationReason: reason || 'User cancelled subscription',
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '❌ সাবস্ক্রিপশন বাতিল করা হয়েছে',
      titleEn: '❌ Subscription Cancelled',
      messageBn: 'আপনার সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে। আপনার অ্যাকাউন্ট ফ্রি সংস্করণে ফিরে এসেছে (ভিডিও শুরুর আগে বিজ্ঞাপন প্রদর্শিত হবে)।',
      messageEn: 'Your subscription has been cancelled immediately. Your account has returned to Free tier (sponsored ads enabled).',
    });
  };

  // Pause active subscription (maximum 7 days)
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
      subscriptionEndDate: newEndDate,
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '⏸️ সাবস্ক্রিপশন পজ করা হয়েছে',
      titleEn: '⏸️ Subscription Paused',
      messageBn: `আপনার সাবস্ক্রিপশন আগামী ${clampedDays} দিনের জন্য সফলভাবে পজ রাখা হয়েছে। মেয়াদ সংরক্ষিত থাকবে!`,
      messageEn: `Your subscription has been paused for ${clampedDays} days. Your remaining days are preserved!`,
    });
  };

  // Resume paused subscription immediately
  const resumeSubscription = () => {
    if (!user) return;
    setUser({
      ...user,
      isPaused: false,
      pausedUntil: undefined,
      pauseDays: undefined,
    });
    dispatchAppNotification({
      type: 'system',
      titleBn: '▶️ সাবস্ক্রিপশন পুনরায় চালু হয়েছে',
      titleEn: '▶️ Subscription Resumed',
      messageBn: 'আপনার সাবস্ক্রিপশন সফলভাবে পুনরায় চালু হয়েছে। বিজ্ঞাপনমুক্ত সিনেমা ও নাটক উপভোগ করুন!',
      messageEn: 'Your subscription has resumed. Enjoy 100% ad-free cinema!',
    });
  };

  // Check if paused subscription has reached its pause duration
  useEffect(() => {
    if (user?.isPaused && user?.pausedUntil) {
      const expiry = new Date(user.pausedUntil).getTime();
      if (Date.now() >= expiry) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isPaused: false,
                pausedUntil: undefined,
                pauseDays: undefined,
              }
            : null
        );
      }
    }
  }, [user?.isPaused, user?.pausedUntil]);

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
      createdAt: new Date().toISOString(),
    };
    setMovieRequests((prev) => [newReq, ...prev]);
  };

  // Support / Admin Help Ticket
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
      createdAt: new Date().toISOString(),
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  const isPremium = (user?.tier === 'standard' || user?.tier === 'vip') && !user?.isPaused;
  const currentTier: SubscriptionTier = user?.tier || 'free';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        isPremium,
        tier: currentTier,
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
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        },
        openRegisterModal: () => {
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        },
        openSubscriptionModal: () => setIsSubscriptionModalOpen(true),
        openProfileModal: () => setIsProfileModalOpen(true),
        openRequestModal: () => setIsRequestModalOpen(true),
        openSupportModal: () => setIsSupportModalOpen(true),
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
