export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'vip';

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  plan: SubscriptionTier;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'upay';
  senderPhone: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  tier: SubscriptionTier;
  subscriptionEndDate?: string;
  joinedAt: string;
  pendingSubscription?: PaymentRequest;
  isPaused?: boolean;
  pausedUntil?: string;
  pauseDays?: number;
  cancellationReason?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'pending' | 'unverified' | 'suspended' | 'banned';
}

export interface MovieRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  movieTitle: string;
  category: 'cinema' | 'natok' | 'series' | 'hollywood' | 'other';
  releaseYear?: string;
  note?: string;
  status: 'pending' | 'reviewed' | 'uploaded';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  subject: string;
  category: 'payment' | 'video' | 'account' | 'other';
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  nameBn: string;
  nameEn: string;
  price: number;
  periodBn: string;
  periodEn: string;
  badgeBn?: string;
  badgeEn?: string;
  popular?: boolean;
  featuresBn: string[];
  featuresEn: string[];
  resolution: string;
  adFree: boolean;
  devices: number;
}

export interface VideoAd {
  id: string;
  brandName: string;
  taglineBn: string;
  taglineEn: string;
  videoUrl: string;
  durationSeconds: number;
  skipAfterSeconds: number;
  ctaTextBn: string;
  ctaTextEn: string;
  ctaUrl: string;
}
