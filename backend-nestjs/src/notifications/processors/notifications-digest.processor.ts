import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATIONS_DIGEST_QUEUE,
  NotificationChannelType,
} from '../notifications.constants';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { NotificationMessage } from '../../entities/notification-message.entity';
import { NotificationChannelSkipError } from '../channels/notification-channel.interface';
import { NotificationChannelRegistry } from '../channels/notification-channel.registry';
import type { Queue } from 'bull';

interface DigestJobPayload {
  deliveryId?: number;
}

const parseReleaseAt = (value: any): number => {
  if (
    value instanceof Date ||
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return new Date(value).getTime();
  }
  return 0;
};

@Processor(NOTIFICATIONS_DIGEST_QUEUE)
export class NotificationsDigestProcessor {
  private readonly logger = new Logger(NotificationsDigestProcessor.name);

  constructor(
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationMessage)
    private readonly messageRepository: Repository<NotificationMessage>,
    @InjectQueue(NOTIFICATIONS_DIGEST_QUEUE)
    private readonly digestQueue: Queue,
    private readonly channelRegistry: NotificationChannelRegistry,
  ) {}

  @Process()
  async handle(job: Job<DigestJobPayload>): Promise<void> {
    if (job.data?.deliveryId) {
      await this.processDelivery(job.data.deliveryId);
      return;
    }

    await this.processDueDeliveries();
  }

  private async processDueDeliveries(): Promise<void> {
    const deliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.notification', 'notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('delivery.status = :status', { status: 'scheduled' })
      .limit(50)
      .getMany();

    if (deliveries.length === 0) {
      return;
    }

    const now = Date.now();
    for (const delivery of deliveries) {
      const releaseAt = parseReleaseAt(delivery.metadata?.releaseAt);

      if (releaseAt && releaseAt > now) {
        await this.scheduleDelivery(delivery.id, releaseAt - now);
        continue;
      }

      await this.dispatchDelivery(delivery);
    }
  }

  private async processDelivery(deliveryId: number): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['notification', 'notification.user'],
    });

    if (!delivery || delivery.status !== 'scheduled') {
      return;
    }

    const releaseAt = parseReleaseAt(delivery.metadata?.releaseAt);
    const now = Date.now();
    if (releaseAt && releaseAt > now) {
      await this.scheduleDelivery(delivery.id, releaseAt - now);
      return;
    }

    await this.dispatchDelivery(delivery);
  }

  private async dispatchDelivery(
    delivery: NotificationDelivery,
  ): Promise<void> {
    const message = delivery.notification
      ? delivery.notification
      : await this.messageRepository.findOne({
          where: { id: delivery.notificationId },
          relations: ['user'],
        });

    if (!message) {
      await this.deliveryRepository.update(delivery.id, {
        status: 'failed',
        lastError: 'Notification message not found',
      });
      return;
    }

    const channel = delivery.channel as NotificationChannelType;
    const attemptCount = (delivery.attemptCount ?? 0) + 1;
    await this.deliveryRepository.update(delivery.id, {
      attemptCount,
      status: 'pending',
    });

    try {
      await this.channelRegistry.send(channel, { message, delivery });
      await this.deliveryRepository.update(delivery.id, {
        status: 'sent',
        sentAt: new Date(),
        attemptCount: (delivery.attemptCount ?? 0) + 1,
        lastError: null,
      });
    } catch (error) {
      if (error instanceof NotificationChannelSkipError) {
        await this.deliveryRepository.update(delivery.id, {
          status: 'skipped',
          lastError: error.message,
        });
        return;
      }

      this.logger.error(
        `Digest dispatch failed for delivery ${delivery.id} on channel ${channel}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.deliveryRepository.update(delivery.id, {
        status: 'failed',
        lastError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async scheduleDelivery(
    deliveryId: number,
    delay: number,
  ): Promise<void> {
    const safeDelay = Math.max(delay, 1000);
    await this.digestQueue.add(
      'delivery-release',
      { deliveryId },
      {
        jobId: `delivery-${deliveryId}`,
        delay: safeDelay,
        attempts: 3,
      },
    );
  }
}
