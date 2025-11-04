export const NOTIFICATIONS_DISPATCH_QUEUE = 'notifications:dispatch';
export const NOTIFICATIONS_DIGEST_QUEUE = 'notifications:digest';

export const NOTIFICATION_WS_NAMESPACE = '/ws/notifications';
export const NOTIFICATION_WS_PATH = '/socket.io';

export type NotificationChannelType =
  | 'inapp'
  | 'email'
  | 'webpush'
  | 'mobilepush'
  | 'slack'
  | 'teams';

export type NotificationDeliveryStatus =
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'skipped';
