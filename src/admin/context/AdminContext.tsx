import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdminRoute,
  AdminAccount,
  AdminPayment,
  AdminCustomerUser,
  AdminSubscriptionPlan,
  AdminAdvertisement,
  AdminNotificationItem,
  AdminCoupon,
  AdminContentItem,
  AdminActor,
  AdminGenre,
  PaymentStatus,
  UserStatus
} from '../types/adminTypes';
import {
  currentAdminAccount,
  initialPayments,
  initialUsers,
  initialSubscriptionPlans,
  initialMovies,
  initialDramas,
  initialWebSeries,
  initialActors,
  initialGenres,
  initialAdvertisements,
  initialNotifications,
  initialCoupons,
  initialAdmins
} from '../data/adminMockData';
import { useAuth } from '../../context/AuthContext';

interface AdminContextType {
  currentRoute: AdminRoute;
  navigate: (route: AdminRoute) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  currentAdmin: AdminAccount;
  
  // Data States
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

  // Interactive Actions (UI Mock)
  selectedPayment: AdminPayment | null;
  setSelectedPayment: (payment: AdminPayment | null) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, note?: string) => void;
  updateUserStatus: (id: string, status: UserStatus) => void;
  togglePlanStatus: (id: string) => void;
  toggleAdStatus: (id: string) => void;
  deleteContentItem: (type: 'movie' | 'drama' | 'series', id: string | number) => void;
  addContentItem: (item: AdminContentItem) => void;
  addPlan: (plan: AdminSubscriptionPlan) => void;
  addCoupon: (coupon: AdminCoupon) => void;
  addAdvertisement: (ad: AdminAdvertisement) => void;
  addNotification: (notif: AdminNotificationItem) => void;
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
    permissions: ['all_access', 'manage_content', 'manage_users', 'manage_finance', 'manage_system']
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive UI Mock Data Stores
  const [payments, setPayments] = useState<AdminPayment[]>(initialPayments);
  const [users, setUsers] = useState<AdminCustomerUser[]>(initialUsers);
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>(initialSubscriptionPlans);
  const [movies, setMovies] = useState<AdminContentItem[]>(initialMovies);
  const [dramas, setDramas] = useState<AdminContentItem[]>(initialDramas);
  const [webSeries, setWebSeries] = useState<AdminContentItem[]>(initialWebSeries);
  const [actors, setActors] = useState<AdminActor[]>(initialActors);
  const [genres, setGenres] = useState<AdminGenre[]>(initialGenres);
  const [advertisements, setAdvertisements] = useState<AdminAdvertisement[]>(initialAdvertisements);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(initialNotifications);
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [admins, setAdmins] = useState<AdminAccount[]>(initialAdmins);

  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

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
    setIsSidebarOpen(false); // Close mobile drawer on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus, note?: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, notes: note || p.notes } : p))
    );
    if (selectedPayment && selectedPayment.id === id) {
      setSelectedPayment((prev) => (prev ? { ...prev, status, notes: note || prev.notes } : null));
    }
  };

  const updateUserStatus = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const togglePlanStatus = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const toggleAdStatus = (id: string) => {
    setAdvertisements((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? { ...ad, status: ad.status === 'active' ? 'expired' : 'active' }
          : ad
      )
    );
  };

  const deleteContentItem = (type: 'movie' | 'drama' | 'series', id: string | number) => {
    if (type === 'movie') setMovies((prev) => prev.filter((m) => m.id !== id));
    if (type === 'drama') setDramas((prev) => prev.filter((d) => d.id !== id));
    if (type === 'series') setWebSeries((prev) => prev.filter((s) => s.id !== id));
  };

  const addContentItem = (item: AdminContentItem) => {
    if (item.type === 'movie') setMovies((prev) => [item, ...prev]);
    else if (item.type === 'drama') setDramas((prev) => [item, ...prev]);
    else setWebSeries((prev) => [item, ...prev]);
  };

  const addPlan = (plan: AdminSubscriptionPlan) => {
    setPlans((prev) => [...prev, plan]);
  };

  const addCoupon = (coupon: AdminCoupon) => {
    setCoupons((prev) => [coupon, ...prev]);
  };

  const addAdvertisement = (ad: AdminAdvertisement) => {
    setAdvertisements((prev) => [ad, ...prev]);
  };

  const addNotification = (notif: AdminNotificationItem) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  const addAdmin = (admin: AdminAccount) => {
    setAdmins((prev) => [...prev, admin]);
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
        selectedPayment,
        setSelectedPayment,
        updatePaymentStatus,
        updateUserStatus,
        togglePlanStatus,
        toggleAdStatus,
        deleteContentItem,
        addContentItem,
        addPlan,
        addCoupon,
        addAdvertisement,
        addNotification,
        addAdmin,
        searchQuery,
        setSearchQuery
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
