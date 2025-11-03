import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import {
  NOTIFICATIONS_DISPATCH_QUEUE,
  NotificationChannelType,
} from '../notifications.constants';

interface DispatchJobPayload {
  messageId: number;
  channel: NotificationChannelType;
  attempt?: number;
}

@Processor(NOTIFICATIONS_DISPATCH_QUEUE)
export class NotificationsDispatchProcessor {
  private readonly logger = new Logger(NotificationsDispatchProcessor.name);

  @Process()
  async handle(job: Job<DispatchJobPayload>): Promise<void> {
    const { messageId, channel, attempt } = job.data;
    this.logger.debug(
      `Dispatch processor placeholder handling message ${messageId} on channel ${channel} (attempt ${attempt ?? 1})`,
    );
  }
}
