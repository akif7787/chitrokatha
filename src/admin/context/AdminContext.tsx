import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AdminRoute,
  AdminAccount,
  AdminPayment,
  AdminCustomerUser,
  AdminSubscriptionPlan,
  AdminContentItem,
  AdminActor,
  AdminGenre,
  AdminAdvertisement,
  AdminNotificationItem,
  AdminCoupon,
  PaymentStatus,
  UserStatus,
  AdStatus,
  AdminAuditLog,
} from '../types/adminTypes';
import {
  currentAdminAccount,
  initialSubscriptionPlans,
  initialMovies,
  initialDramas,
  initialWebSeries,
  initialActors,
  initialGenres,
  initialCoupons,
  initialAdmins,
} from '../data/adminMockData';
import { useAuth } from '../../context/AuthContext';
import {
  getStoredLocalPayments,
  mapPaymentRequestToAdminPayment,
  adminApprovePaymentRequest,
  adminRejectPaymentRequest,
  PAYMENT_STATUS_EVENT,
} from '../../services/paymentService';
import { sendSubscriptionConfirmationEmail } from '../../services/subscriptionEmailService';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  fetchAdminUsers,
  createAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
} from '../../services/adminUserService';
import {
  fetchAdminAdCampaigns,
  toggleAdCampaignStatus,
  deleteAdCampaign,
} from '../../services/adService';
import {
  fetchAdminSupportMessages,
  updateSupportTicketStatus,
  SupportMessageRecord,
  SUPPORT_STATUS_EVENT,
} from '../../services/supportService';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../services/adminNotificationService';
import { fetchAdminAuditLogs } from '../../services/auditService';
import {
  fetchSubscriptionPlans,
  saveSubscriptionPlan,
  togglePlanActiveState,
} from '../../services/subscriptionPlanService';
import {
  fetchAdminCoupons,
  saveCoupon,
} from '../../services/couponService';
import { fetchRealAdminAccounts } from '../../services/adminAccountService';

interface AdminContextType {
  currentRoute: AdminRoute;
  navigate: (route: AdminRoute) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  currentAdmin: AdminAccount;

  // Real Database Data States
  payments: AdminPayment[];
  users: AdminCustomerUser[];
  plans: AdminSubscriptionPlan[];
  movies: AdminContentItem[];
  dramas: AdminContentItem[];
  webSeries: AdminContentItem[];
  actors: AdminActor[];
  genres: AdminGenre[];
  advertisements: AdminAdvertisement[];
  notifications: AdminNotificationItem[];
  coupons: AdminCoupon[];
  admins: AdminAccount[];
  supportTickets: SupportMessageRecord[];
  auditLogs: AdminAuditLog[];
  isLoadingData: boolean;

  // Re-fetch triggers
  refreshUsers: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshAds: () => Promise<void>;
  refreshSupportTickets: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  refreshAdmins: () => Promise<void>;

  // Management actions
  selectedPayment: AdminPayment | null;
  setSelectedPayment: (payment: AdminPayment | null) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, note?: string) => Promise<void>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>;
  createUserAccount: (params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    plan?: 'free' | 'standard' | 'vip';
  }) => Promise<{ success: boolean; user?: any; error?: string }>;
  resetUserPassword: (userId: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  editUserProfile: (params: {
    userId: string;
    email?: string;
    fullName?: string;
    phone?: string;
    role?: 'user' | 'admin';
    status?: UserStatus;
    plan?: 'free' | 'standard' | 'vip';
  }) => Promise<{ success: boolean; error?: string }>;
  togglePlanStatus: (id: string) => void;
  toggleAdStatus: (id: string) => Promise<void>;
  deleteAd: (id: string, storagePath?: string) => Promise<void>;
  updateTicketStatus: (
    ticketId: string,
    status: 'new' | 'in_progress' | 'resolved',
    adminNotes?: string,
    targetUserId?: string
  ) => Promise<boolean>;
  deleteContentItem: (type: 'movie' | 'drama' | 'series', id: string | number) => void;
  addContentItem: (item: AdminContentItem) => void;
  addPlan: (plan: AdminSubscriptionPlan) => void;
  addCoupon: (coupon: AdminCoupon) => void;
  addAdvertisement: (ad: AdminAdvertisement) => void;
  addNotification: (notif: AdminNotificationItem) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addAdmin: (admin: AdminAccount) => void;

  // Search filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  // Sync with browser URL pathname
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(() => {
    const path = window.location.pathname as AdminRoute;
    if (path.startsWith('/admin')) {
      return path;
    }
    return '/admin';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, profile, isSuperAdmin } = useAuth();

  const currentAdmin: AdminAccount = {
    id: profile?.id || user?.id || currentAdminAccount.id,
    name: profile?.full_name || user?.name || currentAdminAccount.name,
    email: user?.email || currentAdminAccount.email,
    role: isSuperAdmin ? 'super_admin' : 'admin',
    roleTitle: isSuperAdmin ? 'Super Admin' : 'Administrator',
    avatar:
      profile?.avatar_url ||
      user?.avatar ||
      currentAdminAccount.avatar,
    status: 'active',
    lastLogin: 'Active Now',
    permissions: ['all_access', 'manage_content', 'manage_users', 'manage_finance', 'manage_system'],
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Live Database States
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [users, setUsers] = useState<AdminCustomerUser[]>([]);
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>(initialSubscriptionPlans);
  const [movies, setMovies] = useState<AdminContentItem[]>(initialMovies);
  const [dramas, setDramas] = useState<AdminContentItem[]>(initialDramas);
  const [webSeries, setWebSeries] = useState<AdminContentItem[]>(initialWebSeries);
  const [actors, setActors] = useState<AdminActor[]>(initialActors);
  const [genres, setGenres] = useState<AdminGenre[]>(initialGenres);
  const [advertisements, setAdvertisements] = useState<AdminAdvertisement[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [admins, setAdmins] = useState<AdminAccount[]>(initialAdmins);
  const [supportTickets, setSupportTickets] = useState<SupportMessageRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  // 1. Fetch Real Payments
  const refreshPayments = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPayments(
            data.map((d: any) => ({
              id: d.id,
              trxId: d.trx_id,
              userName: d.user_name,
              userEmail: d.user_email,
              userPhone: d.user_phone || '',
              userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
              planName: d.plan === 'vip' ? 'ChitroKatha VIP All-Access' : 'Standard Pass',
              amount: Number(d.amount),
              method: d.method,
              senderPhone: d.sender_phone,
              date: new Date(d.created_at).toLocaleDateString('bn-BD'),
              status: d.status,
              notes: d.notes,
            }))
          );
          return;
        }
      } catch (err: any) {
        console.warn('[AdminContext] Error loading payments:', err?.message);
      }
    }

    const localList = getStoredLocalPayments();
    setPayments(localList.map(mapPaymentRequestToAdminPayment));
  }, []);

  // 2. Fetch Real Users
  const refreshUsers = useCallback(async () => {
    const realUsers = await fetchAdminUsers();
    setUsers(realUsers);
  }, []);

  // 3. Fetch Real Ads
  const refreshAds = useCallback(async () => {
    const realAds = await fetchAdminAdCampaigns();
    setAdvertisements(realAds);
  }, []);

  // 4. Fetch Real Support Tickets
  const refreshSupportTickets = useCallback(async () => {
    const tickets = await fetchAdminSupportMessages();
    setSupportTickets(tickets);
  }, []);

  // 5. Fetch Real Notifications
  const refreshNotifications = useCallback(async () => {
    const notifs = await fetchAdminNotifications();
    setNotifications(notifs);
  }, []);

  // 6. Fetch Real Audit Logs
  const refreshAuditLogs = useCallback(async () => {
    const logs = await fetchAdminAuditLogs(40);
    setAuditLogs(logs);
  }, []);

  // 7. Fetch Real Subscription Plans
  const refreshPlans = useCallback(async () => {
    const p = await fetchSubscriptionPlans();
    setPlans(p);
  }, []);

  // 8. Fetch Real Coupons
  const refreshCoupons = useCallback(async () => {
    const c = await fetchAdminCoupons();
    setCoupons(c);
  }, []);

  // 9. Fetch Real Admins
  const refreshAdmins = useCallback(async () => {
    const a = await fetchRealAdminAccounts();
    setAdmins(a);
  }, []);

  // Initial load
  useEffect(() => {
    async function loadAllData() {
      setIsLoadingData(true);
      await Promise.all([
        refreshPayments(),
        refreshUsers(),
        refreshAds(),
        refreshSupportTickets(),
        refreshNotifications(),
        refreshAuditLogs(),
        refreshPlans(),
        refreshCoupons(),
        refreshAdmins(),
      ]);
      setIsLoadingData(false);
    }
    loadAllData();
  }, [refreshPayments, refreshUsers, refreshAds, refreshSupportTickets, refreshNotifications, refreshAuditLogs, refreshPlans, refreshCoupons, refreshAdmins]);

  // Realtime Supabase Channels for Admin Data
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('admin_global_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests' },
        () => {
          refreshPayments();
          refreshAuditLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refreshUsers();
          refreshAdmins();
          refreshAuditLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        () => {
          refreshUsers();
          refreshPlans();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_messages' },
        () => {
          refreshSupportTickets();
          refreshNotifications();
          refreshAuditLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertisement_campaigns' },
        () => {
          refreshAds();
          refreshAuditLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => {
          refreshNotifications();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_activity_logs' },
        () => {
          refreshAuditLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_plans' },
        () => {
          refreshPlans();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        () => {
          refreshCoupons();
        }
      )
      .subscribe();

    const handleLocalPayment = () => refreshPayments();
    const handleLocalSupport = () => refreshSupportTickets();

    window.addEventListener(PAYMENT_STATUS_EVENT, handleLocalPayment);
    window.addEventListener(SUPPORT_STATUS_EVENT, handleLocalSupport);

    return () => {
      channel.unsubscribe();
      window.removeEventListener(PAYMENT_STATUS_EVENT, handleLocalPayment);
      window.removeEventListener(SUPPORT_STATUS_EVENT, handleLocalSupport);
    };
  }, [refreshPayments, refreshUsers, refreshAds, refreshSupportTickets, refreshNotifications, refreshAuditLogs, refreshPlans, refreshCoupons, refreshAdmins]);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as AdminRoute;
      if (path.startsWith('/admin')) {
        setCurrentRoute(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: AdminRoute) => {
    setCurrentRoute(route);
    if (window.location.pathname !== route) {
      window.history.pushState(null, '', route);
    }
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Payment Status mutator
  const updatePaymentStatus = async (id: string, status: PaymentStatus, note?: string) => {
    if (status === 'approved') {
      await adminApprovePaymentRequest(id, note);
    } else if (status === 'rejected') {
      await adminRejectPaymentRequest(id, note);
    }

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (status === 'approved' && p.status !== 'approved' && p.userEmail) {
            sendSubscriptionConfirmationEmail({
              recipientEmail: p.userEmail,
              recipientName: p.userName,
              planName: p.planName || 'ChitroKatha VIP All-Access Pass',
              tier: p.planName?.toLowerCase().includes('vip') ? 'vip' : 'standard',
              amount: p.amount,
              trxId: p.trxId,
              startDate: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            }).catch((err) => console.warn('[SubscriptionEmail] Admin approval email failed:', err));
          }
          return { ...p, status, notes: note || p.notes };
        }
        return p;
      })
    );
    if (selectedPayment && selectedPayment.id === id) {
      setSelectedPayment((prev) => (prev ? { ...prev, status, notes: note || prev.notes } : null));
    }
    refreshAuditLogs();
  };

  // User actions
  const updateUserStatus = async (id: string, status: UserStatus) => {
    await updateAdminUser({ userId: id, status });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    refreshAuditLogs();
  };

  const createUserAccount = async (params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    plan?: 'free' | 'standard' | 'vip';
  }) => {
    const res = await createAdminUser(params);
    if (res.success) {
      await refreshUsers();
      await refreshAuditLogs();
    }
    return res;
  };

  const resetUserPassword = async (userId: string, newPass: string) => {
    const res = await resetAdminUserPassword(userId, newPass);
    if (res.success) {
      await refreshAuditLogs();
    }
    return res;
  };

  const editUserProfile = async (params: {
    userId: string;
    email?: string;
    fullName?: string;
    phone?: string;
    role?: 'user' | 'admin';
    status?: UserStatus;
    plan?: 'free' | 'standard' | 'vip';
  }) => {
    const res = await updateAdminUser(params);
    if (res.success) {
      await refreshUsers();
      await refreshAuditLogs();
    }
    return res;
  };

  // Support ticket update
  const updateTicketStatus = async (
    ticketId: string,
    status: 'new' | 'in_progress' | 'resolved',
    adminNotes?: string,
    targetUserId?: string
  ): Promise<boolean> => {
    const res = await updateSupportTicketStatus({
      ticketId,
      status,
      adminNotes,
      adminUserId: currentAdmin.id,
      targetUserId,
    });
    if (res.success) {
      await refreshSupportTickets();
      await refreshAuditLogs();
      return true;
    }
    return false;
  };

  // Ad campaign actions
  const toggleAdStatus = async (id: string) => {
    const target = advertisements.find((a) => a.id === id);
    if (!target) return;
    const res = await toggleAdCampaignStatus(id, target.status, currentAdmin.id);
    if (res.success && res.nextStatus) {
      setAdvertisements((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, status: res.nextStatus! } : ad))
      );
      refreshAuditLogs();
    }
  };

  const deleteAd = async (id: string, storagePath?: string) => {
    const res = await deleteAdCampaign(id, storagePath, currentAdmin.id);
    if (res.success) {
      setAdvertisements((prev) => prev.filter((ad) => ad.id !== id));
      refreshAuditLogs();
    }
  };

  const togglePlanStatus = async (id: string) => {
    const target = plans.find((p) => p.id === id);
    if (!target) return;
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
    await togglePlanActiveState(id, target.isActive);
    await refreshPlans();
  };

  const deleteContentItem = (type: 'movie' | 'drama' | 'series', id: string | number) => {
    if (type === 'movie') setMovies((prev) => prev.filter((m) => m.id !== id));
    else if (type === 'drama') setDramas((prev) => prev.filter((d) => d.id !== id));
    else if (type === 'series') setWebSeries((prev) => prev.filter((s) => s.id !== id));
  };

  const addContentItem = (item: AdminContentItem) => {
    if (item.type === 'movie') setMovies((prev) => [item, ...prev]);
    else if (item.type === 'drama') setDramas((prev) => [item, ...prev]);
    else if (item.type === 'series') setWebSeries((prev) => [item, ...prev]);
  };

  const addPlan = async (plan: AdminSubscriptionPlan) => {
    setPlans((prev) => [plan, ...prev]);
    await saveSubscriptionPlan(plan);
    await refreshPlans();
  };

  const addCoupon = async (coupon: AdminCoupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    await saveCoupon(coupon);
    await refreshCoupons();
  };

  const addAdvertisement = (ad: AdminAdvertisement) => setAdvertisements((prev) => [ad, ...prev]);
  const addNotification = (notif: AdminNotificationItem) => setNotifications((prev) => [notif, ...prev]);

  const markNotificationRead = async (id: string) => {
    await markAdminNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await markAllAdminNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addAdmin = async (admin: AdminAccount) => {
    setAdmins((prev) => [admin, ...prev]);
    await refreshAdmins();
  };

  return (
    <AdminContext.Provider
      value={{
        currentRoute,
        navigate,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        currentAdmin,
        payments,
        users,
        plans,
        movies,
        dramas,
        webSeries,
        actors,
        genres,
        advertisements,
        notifications,
        coupons,
        admins,
        supportTickets,
        auditLogs,
        isLoadingData,
        refreshUsers,
        refreshPayments,
        refreshAds,
        refreshSupportTickets,
        refreshNotifications,
        refreshAuditLogs,
        refreshPlans,
        refreshCoupons,
        refreshAdmins,
        selectedPayment,
        setSelectedPayment,
        updatePaymentStatus,
        updateUserStatus,
        createUserAccount,
        resetUserPassword,
        editUserProfile,
        togglePlanStatus,
        toggleAdStatus,
        deleteAd,
        updateTicketStatus,
        deleteContentItem,
        addContentItem,
        addPlan,
        addCoupon,
        addAdvertisement,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        addAdmin,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
