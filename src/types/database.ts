export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'pending' | 'unverified' | 'suspended' | 'banned';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  country: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: 'bn' | 'en';
  theme: 'dark' | 'light';
  autoplay: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'drama' | 'series';
  progress_seconds: number;
  duration_seconds: number;
  last_watched_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'drama' | 'series';
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'drama' | 'series';
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'system' | 'promotion' | 'update' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Partial<UserPreferences> & { user_id: string };
        Update: Partial<UserPreferences>;
      };
      watch_history: {
        Row: WatchHistory;
        Insert: Omit<WatchHistory, 'id' | 'last_watched_at'>;
        Update: Partial<WatchHistory>;
      };
      watchlist: {
        Row: WatchlistItem;
        Insert: Omit<WatchlistItem, 'id' | 'created_at'>;
        Update: Partial<WatchlistItem>;
      };
      favorites: {
        Row: FavoriteItem;
        Insert: Omit<FavoriteItem, 'id' | 'created_at'>;
        Update: Partial<FavoriteItem>;
      };
      user_notifications: {
        Row: UserNotification;
        Insert: Omit<UserNotification, 'id' | 'created_at'>;
        Update: Partial<UserNotification>;
      };
      admin_activity_logs: {
        Row: AdminActivityLog;
        Insert: Omit<AdminActivityLog, 'id' | 'created_at'>;
        Update: Partial<AdminActivityLog>;
      };
      auth_otp_codes: {
        Row: AuthOtpCode;
        Insert: Omit<AuthOtpCode, 'id' | 'created_at'>;
        Update: Partial<AuthOtpCode>;
      };
    };
  };
}

export type OtpPurpose = 'signup' | 'login';

export interface AuthOtpCode {
  id: string;
  email: string;
  otp_hash: string;
  purpose: OtpPurpose;
  attempts_left: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  expires_in_seconds?: number;
  cooldown_seconds?: number;
  cooldown_remaining?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  attempts_left?: number;
}
