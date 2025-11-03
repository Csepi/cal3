import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationThreadsService } from './notification-threads.service';
import { NotificationChannelType } from './notifications.constants';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';
import { NotificationMessage } from '../entities/notification-message.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { PushDeviceToken } from '../entities/push-device-token.entity';

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
}
