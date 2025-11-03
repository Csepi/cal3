import { Injectable, Logger } from '@nestjs/common';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationThreadsService } from './notification-threads.service';
import { NotificationChannelType } from './notifications.constants';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';

export interface PublishNotificationOptions {
  eventType: string;
  actorId?: number | null;
  recipients: number[];
  title?: string | null;
  body: string;
  data?: Record<string, any> | null;
  context?: {
    threadKey?: string;
    contextType?: string | null;
    contextId?: string | null;
  } | null;
  preferredChannels?: NotificationChannelType[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly activeSockets = new Map<number, Set<string>>();

  constructor(
    private readonly rulesService: NotificationRulesService,
    private readonly threadsService: NotificationThreadsService,
  ) {}

  async publish(options: PublishNotificationOptions): Promise<void> {
    this.logger.debug(
      `publish placeholder invoked for event ${options.eventType} to recipients ${options.recipients.join(',')}`,
    );
  }

  trackConnection(userId: number, socketId: string): void {
    const sockets = this.activeSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.activeSockets.set(userId, sockets);
  }

  dropConnection(userId: number, socketId: string): void {
    const sockets = this.activeSockets.get(userId);
    if (!sockets) {
      return;
    }
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.activeSockets.delete(userId);
    }
  }

  getActiveSocketIds(userId: number): string[] {
    return Array.from(this.activeSockets.get(userId) ?? []);
  }

  async listMessages(
    userId: number,
    _query?: ListNotificationsQueryDto,
  ): Promise<any[]> {
    this.logger.debug(`listMessages placeholder invoked for user ${userId}`);
    return [];
  }

  async markMessageRead(userId: number, messageId: number): Promise<void> {
    this.logger.debug(
      `markMessageRead placeholder invoked for user ${userId}, message ${messageId}`,
    );
  }

  async markMessageUnread(userId: number, messageId: number): Promise<void> {
    this.logger.debug(
      `markMessageUnread placeholder invoked for user ${userId}, message ${messageId}`,
    );
  }

  async markAllRead(userId: number): Promise<void> {
    this.logger.debug(`markAllRead placeholder invoked for user ${userId}`);
  }

  async registerDevice(
    userId: number,
    platform: string,
    token: string,
    userAgent?: string,
  ): Promise<{ id: number }> {
    this.logger.debug(
      `registerDevice placeholder invoked for user ${userId} on platform ${platform}`,
    );
    return { id: 0 };
  }

  async removeDevice(userId: number, deviceId: number): Promise<void> {
    this.logger.debug(
      `removeDevice placeholder invoked for user ${userId}, device ${deviceId}`,
    );
  }
}
