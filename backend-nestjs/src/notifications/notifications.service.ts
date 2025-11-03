import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationThreadsService } from './notification-threads.service';
import {
  NOTIFICATIONS_DISPATCH_QUEUE,
  NotificationChannelType,
} from './notifications.constants';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';
import { NotificationMessage } from '../entities/notification-message.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { PushDeviceToken } from '../entities/push-device-token.entity';
import { NotificationThread } from '../entities/notification-thread.entity';
import { NotificationThreadState } from '../entities/notification-thread-state.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

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
    @InjectRepository(NotificationMessage)
    private readonly messageRepository: Repository<NotificationMessage>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(PushDeviceToken)
    private readonly pushDeviceRepository: Repository<PushDeviceToken>,
    @InjectRepository(NotificationThread)
    private readonly threadRepository: Repository<NotificationThread>,
    @InjectRepository(NotificationThreadState)
    private readonly threadStateRepository: Repository<NotificationThreadState>,
    @InjectQueue(NOTIFICATIONS_DISPATCH_QUEUE)
    private readonly dispatchQueue: Queue,
    private readonly rulesService: NotificationRulesService,
    private readonly threadsService: NotificationThreadsService,
  ) {}

  async publish(options: PublishNotificationOptions): Promise<void> {
    const createdMessages: NotificationMessage[] = [];

    const preferenceMap = await this.loadEffectivePreferences(
      options.recipients,
      options.eventType,
    );

    for (const recipientId of options.recipients) {
      const threadSummary = options.context?.threadKey
        ? await this.threadsService.registerThread(
            recipientId,
            options.context.threadKey,
            options.context.contextType,
            options.context.contextId,
          )
        : null;

      const message = this.messageRepository.create({
        userId: recipientId,
        eventType: options.eventType,
        title: options.title ?? null,
        body: options.body,
        data: options.data ?? null,
        isRead: false,
        archived: false,
        threadId: threadSummary?.id ?? null,
        threadKey: options.context?.threadKey ?? null,
      });

      const saved = await this.messageRepository.save(message);
      createdMessages.push(saved);

      if (threadSummary) {
        await this.threadRepository.update(threadSummary.id, {
          lastMessageAt: saved.createdAt,
        });
      }

      const preferredChannels =
        preferenceMap.get(recipientId)?.channels ?? options.preferredChannels;

      await this.enqueueDeliveries(saved, preferredChannels);
    }

    if (createdMessages.length > 0) {
      this.notifyRealtime(createdMessages);
    }
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
    query?: ListNotificationsQueryDto,
  ): Promise<NotificationMessage[]> {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .take(50);

    if (query?.unreadOnly) {
      qb.andWhere('message.isRead = false');
    }

    if (query?.archived !== undefined) {
      qb.andWhere('message.archived = :archived', {
        archived: query.archived,
      });
    }

    if (query?.threadId) {
      qb.andWhere('message.threadId = :threadId', {
        threadId: query.threadId,
      });
    }

    if (query?.afterCursor) {
      const cursorDate = new Date(query.afterCursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        qb.andWhere('message.createdAt < :cursor', { cursor: cursorDate });
      }
    }

    return qb.getMany();
  }

  async markMessageRead(userId: number, messageId: number): Promise<void> {
    const message = await this.ensureUserMessage(userId, messageId);
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await this.messageRepository.save(message);
    }
  }

  async markMessageUnread(userId: number, messageId: number): Promise<void> {
    const message = await this.ensureUserMessage(userId, messageId);
    if (message.isRead) {
      message.isRead = false;
      message.readAt = null;
      await this.messageRepository.save(message);
    }
  }

  async markAllRead(userId: number): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: () => 'CURRENT_TIMESTAMP' })
      .where('userId = :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }

  async registerDevice(
    userId: number,
    platform: string,
    token: string,
    userAgent?: string,
  ): Promise<{ id: number }> {
    let device = await this.pushDeviceRepository.findOne({
      where: { token },
    });

    if (device && device.userId !== userId) {
      device.userId = userId;
    }

    if (!device) {
      device = this.pushDeviceRepository.create({
        userId,
        platform,
        token,
      });
    }

    device.userAgent = userAgent ?? null;
    device.lastSeenAt = new Date();

    const saved = await this.pushDeviceRepository.save(device);
    return { id: saved.id };
  }

  async removeDevice(userId: number, deviceId: number): Promise<void> {
    const device = await this.pushDeviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Cannot remove device for another user');
    }

    await this.pushDeviceRepository.remove(device);
  }

  private async ensureUserMessage(
    userId: number,
    messageId: number,
  ): Promise<NotificationMessage> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, userId },
    });

    if (!message) {
      throw new NotFoundException('Notification not found');
    }

    return message;
  }

  private async enqueueDeliveries(
    message: NotificationMessage,
    preferredChannels?: NotificationChannelType[],
  ): Promise<void> {
    const channels = preferredChannels && preferredChannels.length > 0
      ? preferredChannels
      : ['inapp'];
    for (const channel of channels) {
      const delivery = await this.deliveryRepository.save(
        this.deliveryRepository.create({
          notificationId: message.id,
          channel,
          status: channel === 'inapp' ? 'sent' : 'pending',
          sentAt: channel === 'inapp' ? new Date() : null,
        }),
      );

      if (channel !== 'inapp') {
        await this.dispatchQueue.add(
          {
            messageId: message.id,
            channel,
            attempt: 1,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
          },
        );
      }
    }
  }

  private notifyRealtime(messages: NotificationMessage[]): void {
    for (const message of messages) {
      const sockets = this.getActiveSocketIds(message.userId);
      if (sockets.length === 0) {
        continue;
      }
      // Actual implementation will emit events via gateway/server integration.
      this.logger.debug(
        `Would emit realtime notification to user ${message.userId} sockets=${sockets.join(',')}`,
      );
    }
  }

  private async loadEffectivePreferences(
    userIds: number[],
    eventType: string,
  ): Promise<Map<number, { channels: NotificationChannelType[] }>> {
    const map = new Map<number, { channels: NotificationChannelType[] }>();

    if (userIds.length === 0) {
      return map;
    }

    const prefs = await this.rulesService.getUserPreferencesForEvent(
      userIds,
      eventType,
    );

    prefs.forEach((pref) => {
      const enabledChannels = Object.entries(pref.channels)
        .filter(([, enabled]) => !!enabled)
        .map(([channel]) => channel as NotificationChannelType);
      map.set(pref.userId, { channels: enabledChannels });
    });

    return map;
  }
}
