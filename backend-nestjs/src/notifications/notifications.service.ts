import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationEvaluationInput,
  NotificationPreferenceSummary,
  NotificationRuleContext,
  NotificationRuleEvaluationResult,
  NotificationRulesService,
} from './notification-rules.service';
import { NotificationThreadsService } from './notification-threads.service';
import {
  NOTIFICATIONS_DISPATCH_QUEUE,
  NOTIFICATIONS_DIGEST_QUEUE,
  NotificationChannelType,
} from './notifications.constants';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';
import { NotificationMessage } from '../entities/notification-message.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { PushDeviceToken } from '../entities/push-device-token.entity';
import { NotificationThread } from '../entities/notification-thread.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  NotificationEventDefinition,
} from './notification-definitions';

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

export interface NotificationCatalogChannel {
  id: NotificationChannelType;
  label: string;
  description: string;
  supportsFallback: boolean;
  realtime: boolean;
}

export interface NotificationCatalogScope {
  id: 'global' | 'organisation' | 'calendar' | 'reservation';
  label: string;
  description: string;
}

export interface NotificationCatalog {
  eventTypes: NotificationEventDefinition[];
  channels: NotificationCatalogChannel[];
  scopes: NotificationCatalogScope[];
}

@Injectable()
export class NotificationsService implements OnModuleInit {
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
    @InjectQueue(NOTIFICATIONS_DISPATCH_QUEUE)
    private readonly dispatchQueue: Queue,
    @InjectQueue(NOTIFICATIONS_DIGEST_QUEUE)
    private readonly digestQueue: Queue,
    private readonly rulesService: NotificationRulesService,
    @Inject(forwardRef(() => NotificationThreadsService))
    private readonly threadsService: NotificationThreadsService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const bootstrapTimeout = parseInt(
        process.env.NOTIFICATIONS_QUEUE_BOOTSTRAP_TIMEOUT_MS || '4000',
        10,
      );
      const ready = await this.waitForQueueReady(
        this.digestQueue,
        bootstrapTimeout,
      );

      if (!ready) {
        this.logger.warn(
          `Digest scheduler initialisation skipped (Redis queue not ready after ${bootstrapTimeout}ms).`,
        );
        return;
      }

      await this.digestQueue.add(
        'notifications-scheduler',
        {},
        {
          jobId: 'notifications-scheduler',
          repeat: { cron: '*/5 * * * *' },
        },
      );
    } catch (error) {
      this.logger.debug(
        'Digest scheduler initialisation skipped',
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async waitForQueueReady(
    queue: Queue,
    timeoutMs: number,
  ): Promise<boolean> {
    const client: any = (queue as any).client;
    if (!client) {
      return false;
    }

    if (client.status === 'ready') {
      return true;
    }

    return new Promise((resolve) => {
      let isResolved = false;
      const onReady = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(true);
        }
      };
      const onError = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(false);
        }
      };
      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        client.off?.('ready', onReady);
        client.off?.('error', onError);
      };

      client.once?.('ready', onReady);
      client.once?.('error', onError);
    });
  }

  async publish(options: PublishNotificationOptions): Promise<void> {
    const createdMessages: NotificationMessage[] = [];

    const preferenceMap = await this.loadEffectivePreferences(
      options.recipients,
      options.eventType,
    );

    const ruleContextMap = await this.rulesService.buildRuleContext(
      options.recipients,
    );

    const evaluationInput: NotificationEvaluationInput = {
      eventType: options.eventType,
      actorId: options.actorId ?? null,
      contextType: options.context?.contextType ?? null,
      contextId: options.context?.contextId ?? null,
      threadKey: options.context?.threadKey ?? null,
      data: options.data ?? null,
    };

    for (const recipientId of options.recipients) {
      const preference = preferenceMap.get(recipientId);
      const ruleContext: NotificationRuleContext | undefined =
        ruleContextMap.get(recipientId);
      const evaluation: NotificationRuleEvaluationResult =
        this.rulesService.evaluateNotification(ruleContext, evaluationInput);

      if (evaluation.suppressed) {
        this.logger.debug(
          `Notification for user ${recipientId} suppressed by rules ${evaluation.appliedRuleIds.join(', ')}`,
        );
        continue;
      }

      const threadSummary =
        options.context?.threadKey && options.context.threadKey.length > 0
          ? await this.threadsService.registerThread(
              recipientId,
              options.context.threadKey,
              options.context.contextType,
              options.context.contextId,
            )
          : null;

      const now = new Date();
      const messageMetadata =
        evaluation.appliedRuleIds.length > 0 ||
        Object.keys(evaluation.metadata ?? {}).length > 0
          ? {
              appliedRules: evaluation.appliedRuleIds,
              evaluation: evaluation.metadata,
            }
          : null;

      const message = this.messageRepository.create({
        userId: recipientId,
        eventType: options.eventType,
        title: options.title ?? null,
        body: options.body,
        data: options.data ?? null,
        isRead: evaluation.markRead,
        readAt: evaluation.markRead ? now : null,
        archived: evaluation.archive,
        archivedAt: evaluation.archive ? now : null,
        threadId: threadSummary?.id ?? null,
        threadKey: options.context?.threadKey ?? null,
        metadata: messageMetadata,
      });

      const saved = await this.messageRepository.save(message);

      if (threadSummary) {
        await this.threadRepository.update(threadSummary.id, {
          lastMessageAt: saved.createdAt,
        });

        if (evaluation.muteThread) {
          await this.threadsService.setThreadMuted(
            recipientId,
            threadSummary.id,
            true,
          );
        }

        if (evaluation.archive) {
          await this.threadsService.setThreadArchived(
            recipientId,
            threadSummary.id,
            true,
          );
        }
      }

      const suppressedSet = new Set<NotificationChannelType>(
        evaluation.suppressChannels ?? [],
      );

      const enabledChannelsFromPreference = preference
        ? Object.entries(preference.channels || {})
            .filter(([, enabled]) => Boolean(enabled))
            .map(([channel]) => channel as NotificationChannelType)
        : undefined;

      const baseChannels =
        options.preferredChannels && options.preferredChannels.length > 0
          ? options.preferredChannels
          : (enabledChannelsFromPreference ?? []);

      const filteredChannels = baseChannels.filter(
        (channel) => !suppressedSet.has(channel),
      );

      await this.enqueueDeliveries(saved, filteredChannels, preference);

      if (!evaluation.metadata?.silent) {
        createdMessages.push(saved);
      }
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

  getCatalog(userId: number): NotificationCatalog {
    void userId; // currently unused but reserved for personalised catalog view

    const channels: NotificationCatalogChannel[] = [
      {
        id: 'inapp',
        label: 'In-app',
        description: 'Appears in the bell icon and notification center.',
        supportsFallback: false,
        realtime: true,
      },
      {
        id: 'email',
        label: 'Email',
        description: 'Delivers via the configured email provider.',
        supportsFallback: true,
        realtime: false,
      },
      {
        id: 'webpush',
        label: 'Web Push',
        description: 'Browser push notifications for subscribed devices.',
        supportsFallback: true,
        realtime: true,
      },
      {
        id: 'mobilepush',
        label: 'Mobile Push',
        description: 'Mobile push notifications via the mobile app.',
        supportsFallback: true,
        realtime: true,
      },
      {
        id: 'slack',
        label: 'Slack',
        description: 'Posts to configured Slack channels or webhooks.',
        supportsFallback: true,
        realtime: true,
      },
      {
        id: 'teams',
        label: 'Microsoft Teams',
        description: 'Posts to configured Teams channels or webhooks.',
        supportsFallback: true,
        realtime: true,
      },
    ];

    const scopes: NotificationCatalogScope[] = [
      {
        id: 'global',
        label: 'All notifications',
        description:
          'Applies across every calendar, reservation, and organisation.',
      },
      {
        id: 'organisation',
        label: 'Organisation',
        description: 'Targets activity within a specific organisation.',
      },
      {
        id: 'calendar',
        label: 'Calendar',
        description: 'Targets a specific calendar and its events.',
      },
      {
        id: 'reservation',
        label: 'Reservation',
        description: 'Targets reservations for a specific resource.',
      },
    ];

    return {
      eventTypes: NOTIFICATION_EVENT_DEFINITIONS,
      channels,
      scopes,
    };
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
    preferredChannels: NotificationChannelType[],
    preference?: NotificationPreferenceSummary,
  ): Promise<void> {
    const channelSet = new Set<NotificationChannelType>(['inapp']);
    (preferredChannels ?? []).forEach((channel) => channelSet.add(channel));
    const channels = Array.from(channelSet);

    const fallbackCandidates = (preference?.fallbackOrder ??
      []) as NotificationChannelType[];
    let fallbackChain = fallbackCandidates
      .map((channel) => channel)
      .filter((channel) => channel !== 'inapp' && channelSet.has(channel));
    if (fallbackChain.length === 0) {
      fallbackChain = channels.filter((channel) => channel !== 'inapp');
    }

    for (const [index, channel] of channels.entries()) {
      const isInApp = channel === 'inapp';
      const digestDelay = isInApp ? 0 : this.computeDigestDelay(preference);
      const quietDelay = isInApp
        ? 0
        : this.calculateQuietHoursDelay(preference?.quietHours);
      const releaseDelay = Math.max(digestDelay, quietDelay);

      const metadata: Record<string, any> = {
        fallbackChain,
        position: index,
      };

      if (!isInApp && releaseDelay > 0) {
        metadata.releaseAt = new Date(Date.now() + releaseDelay).toISOString();
      }
      if (!isInApp && preference?.digest && preference.digest !== 'immediate') {
        metadata.digest = preference.digest;
      }
      if (!isInApp && quietDelay > 0) {
        metadata.quietUntil = new Date(Date.now() + quietDelay).toISOString();
      }

      const delivery = await this.deliveryRepository.save(
        this.deliveryRepository.create({
          notificationId: message.id,
          channel,
          status: isInApp ? 'sent' : releaseDelay > 0 ? 'scheduled' : 'pending',
          sentAt: isInApp && releaseDelay === 0 ? new Date() : null,
          metadata,
        }),
      );

      if (isInApp) {
        continue;
      }

      if (releaseDelay > 0) {
        await this.digestQueue.add(
          'delivery-release',
          { deliveryId: delivery.id },
          {
            jobId: `delivery-${delivery.id}`,
            delay: releaseDelay,
            attempts: 3,
          },
        );
      } else {
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

  private computeDigestDelay(
    preference?: NotificationPreferenceSummary,
  ): number {
    if (!preference?.digest || preference.digest === 'immediate') {
      return 0;
    }
    if (preference.digest === 'hourly') {
      return 60 * 60 * 1000;
    }
    if (preference.digest === 'daily') {
      return 24 * 60 * 60 * 1000;
    }
    return 0;
  }

  private calculateQuietHoursDelay(
    quietHours?: Record<string, any> | null,
  ): number {
    if (!quietHours || quietHours.suppressImmediate === false) {
      return 0;
    }

    const { start, end, timezone } = quietHours;
    if (!start || !end) {
      return 0;
    }

    const startMinutes = this.parseTimeToMinutes(start);
    const endMinutes = this.parseTimeToMinutes(end);
    if (startMinutes === endMinutes) {
      return 0;
    }

    const currentMinutes = this.getLocalMinutes(timezone || 'UTC');

    const isWithinQuietHours =
      startMinutes < endMinutes
        ? currentMinutes >= startMinutes && currentMinutes < endMinutes
        : currentMinutes >= startMinutes || currentMinutes < endMinutes;

    if (!isWithinQuietHours) {
      return 0;
    }

    if (startMinutes < endMinutes) {
      return (endMinutes - currentMinutes) * 60 * 1000;
    }

    const minutesUntilMidnight = 24 * 60 - currentMinutes;
    return (minutesUntilMidnight + endMinutes) * 60 * 1000;
  }

  private parseTimeToMinutes(time: string): number {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
    if (!match) {
      return 0;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours * 60 + minutes;
  }

  private getLocalMinutes(timezone: string): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const formatted = formatter.format(new Date());
      const [hourStr, minuteStr] = formatted.split(':');
      return Number(hourStr) * 60 + Number(minuteStr);
    } catch (error) {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
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
  ): Promise<Map<number, NotificationPreferenceSummary & { userId: number }>> {
    const map = new Map<
      number,
      NotificationPreferenceSummary & { userId: number }
    >();

    if (userIds.length === 0) {
      return map;
    }

    const prefs = await this.rulesService.getUserPreferencesForEvent(
      userIds,
      eventType,
    );

    prefs.forEach((pref) => {
      map.set(pref.userId, pref);
    });

    return map;
  }
}
