export type AdminRoute =
  | '/admin'
  | '/admin/movies'
  | '/admin/drama'
  | '/admin/web-series'
  | '/admin/actors'
  | '/admin/genres'
  | '/admin/users'
  | '/admin/subscriptions'
  | '/admin/payments'
  | '/admin/ads'
  | '/admin/notifications'
  | '/admin/coupons'
  | '/admin/analytics'
  | '/admin/settings'
  | '/admin/support'
  | '/admin/admins'
  | '/admin/audit-logs';

export type AdminRole = 'super_admin' | 'admin' | 'content_manager' | 'support_manager';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  roleTitle: string;
  avatar: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

export interface AdminKpi {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  accent: 'rose' | 'amber' | 'emerald' | 'blue' | 'purple';
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card';

export interface AdminPayment {
  id: string;
  trxId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar?: string;
  planName: string;
  amount: number;
  method: PaymentMethod;
  senderPhone: string;
  date: string;
  status: PaymentStatus;
  notes?: string;
}

export type UserStatus = 'active' | 'suspended' | 'pending';
export type SubscriptionTierType = 'free' | 'basic' | 'standard' | 'vip';

export interface AdminCustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  joinedDate: string;
  subscription: string;
  tier: SubscriptionTierType;
  role?: 'user' | 'admin' | 'super_admin';
  status: UserStatus;
  lastLogin: string;
  watchHistoryCount: number;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  emailVerified?: boolean;
}

export interface AdminSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  durationLabel: string;
  features: string[];
  isActive: boolean;
  badge?: string;
  subscribersCount: number;
  resolution: string;
  adFree: boolean;
}

export type AdType = 'video' | 'image' | 'banner' | 'popup' | 'pdf';
export type AdStatus = 'active' | 'scheduled' | 'expired' | 'paused';

export interface AdminAdvertisement {
  id: string;
  title: string;
  type: AdType;
  previewUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  status: AdStatus;
  impressions: number;
  clicks: number;
  mediaType?: 'image' | 'video' | 'pdf';
  storagePath?: string;
  placement?: string;
  createdAt?: string;
}

export type NotificationType = 'system' | 'promotion' | 'update' | 'alert' | 'support' | 'payment';
export type NotificationTarget = 'all' | 'vip' | 'free';
export type NotificationStatus = 'sent' | 'scheduled' | 'draft';

export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  scheduledDate: string;
  status: NotificationStatus;
  sentCount: number;
  entityType?: string;
  entityId?: string;
  isRead?: boolean;
}

export interface AdminCoupon {
  id: string;
  code: string;
  discount: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'disabled';
}

export interface AdminContentItem {
  id: string | number;
  titleBn: string;
  titleEn: string;
  year: number;
  genre: string;
  genres: string[];
  language: string;
  rating: number;
  status: 'published' | 'draft' | 'archived';
  isFeatured: boolean;
  isTop10?: number;
  views: string;
  viewsCount: number;
  poster: string;
  type: 'movie' | 'drama' | 'series';
  industry: string;
  runtime: string;
}

export interface AdminActor {
  id: string;
  nameBn: string;
  nameEn: string;
  industry: string;
  worksCount: number;
  avatar: string;
  status: 'active' | 'inactive';
  topMovie: string;
}

export interface AdminGenre {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  count: number;
  featured: boolean;
}

export interface AdminRevenueDataPoint {
  date: string;
  revenue: number;
  users: number;
  transactions: number;
}

export interface AdminAuditLog {
  id: string;
  adminUserId?: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

