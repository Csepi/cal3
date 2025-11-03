import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import {
  NOTIFICATIONS_DISPATCH_QUEUE,
  NotificationChannelType,
} from '../notifications.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { NotificationMessage } from '../../entities/notification-message.entity';
import { NotificationChannelRegistry } from '../channels/notification-channel.registry';
import { NotificationChannelSkipError } from '../channels/notification-channel.interface';

interface DispatchJobPayload {
  messageId: number;
  channel: NotificationChannelType;
  attempt?: number;
}

@Processor(NOTIFICATIONS_DISPATCH_QUEUE)
export class NotificationsDispatchProcessor {
  private readonly logger = new Logger(NotificationsDispatchProcessor.name);

  constructor(
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationMessage)
    private readonly messageRepository: Repository<NotificationMessage>,
    private readonly channelRegistry: NotificationChannelRegistry,
  ) {}

  @Process()
  async handle(job: Job<DispatchJobPayload>): Promise<void> {
    const { messageId, channel, attempt } = job.data;
    this.logger.debug(
      `Dispatch processor handling message ${messageId} on channel ${channel} (attempt ${attempt ?? 1})`,
    );

    const delivery = await this.deliveryRepository.findOne({
      where: { notificationId: messageId, channel },
    });

    if (!delivery) {
      this.logger.warn(
        `Delivery row not found for message ${messageId} channel ${channel}`,
      );
      return;
    }

    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['user'],
    });

    if (!message) {
      this.logger.warn(`Message ${messageId} not found. Marking delivery failed`);
      await this.deliveryRepository.update(delivery.id, {
        status: 'failed',
        lastError: 'Notification message not found',
      });
      return;
    }

    const attemptCount = (delivery.attemptCount ?? 0) + 1;
    await this.deliveryRepository.update(delivery.id, {
      attemptCount,
    });

    try {
      const canSend = await this.channelRegistry.canSend(channel);
      if (!canSend) {
        await this.deliveryRepository.update(delivery.id, {
          status: 'skipped',
          lastError: 'Channel not configured',
        });
        return;
      }

      await this.channelRegistry.send(channel, { message, delivery });

      await this.deliveryRepository.update(delivery.id, {
        status: 'sent',
        sentAt: new Date(),
        lastError: null,
      });
    } catch (error) {
      if (error instanceof NotificationChannelSkipError) {
        this.logger.debug(
          `Channel ${channel} skipped for message ${messageId}: ${error.message}`,
        );
        await this.deliveryRepository.update(delivery.id, {
          status: 'skipped',
          lastError: error.message,
        });
        return;
      }

      this.logger.error(
        `Channel ${channel} failed for message ${messageId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      const shouldFail = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      await this.deliveryRepository.update(delivery.id, {
        status: shouldFail ? 'failed' : 'pending',
        lastError: error instanceof Error ? error.message : String(error),
      });

      if (!shouldFail) {
        throw error;
      }
    }
  }
}
