export type NotificationType = 'new_release' | 'request_update' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  movieId?: string;
  movieTitle?: string;
  poster?: string;
  timestamp: number;
  read: boolean;
}

export interface ActiveToast extends NotificationItem {
  duration?: number;
}
