import { NotificationChannelType } from '../notifications.constants';
import { NotificationMessage } from '../../entities/notification-message.entity';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';

export interface NotificationDeliveryJob {
  messageId: number;
  channel: NotificationChannelType;
  attempt?: number;
}

export interface NotificationChannelContext {
  message: NotificationMessage;
  delivery: NotificationDelivery;
}

export class NotificationChannelSkipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationChannelSkipError';
  }
}

export interface NotificationChannelProvider {
  readonly channel: NotificationChannelType;
  canSend(): Promise<boolean> | boolean;
  send(context: NotificationChannelContext): Promise<void>;
}
