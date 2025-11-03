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
    });

    if (!message) {
      this.logger.warn(`Message ${messageId} not found. Marking delivery failed`);
      await this.deliveryRepository.update(delivery.id, {
        status: 'failed',
        lastError: 'Notification message not found',
      });
      return;
    }

    // TODO: route to concrete channel provider. For now, mark as sent.
    await this.deliveryRepository.update(delivery.id, {
      status: 'sent',
      sentAt: new Date(),
      attemptCount: (delivery.attemptCount ?? 0) + 1,
    });
  }
}
