import { NotificationChannelType } from '../notifications.constants';

export interface NotificationDeliveryJob {
  messageId: number;
  channel: NotificationChannelType;
  payload: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface NotificationChannelProvider {
  readonly channel: NotificationChannelType;
  send(job: NotificationDeliveryJob): Promise<void>;
}
