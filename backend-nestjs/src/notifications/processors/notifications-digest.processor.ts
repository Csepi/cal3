import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NOTIFICATIONS_DIGEST_QUEUE } from '../notifications.constants';

interface DigestJobPayload {
  userId: number;
  digestType: 'hourly' | 'daily';
  scheduledAt: string;
}

@Processor(NOTIFICATIONS_DIGEST_QUEUE)
export class NotificationsDigestProcessor {
  private readonly logger = new Logger(NotificationsDigestProcessor.name);

  @Process()
  async handle(job: Job<DigestJobPayload>): Promise<void> {
    const { userId, digestType, scheduledAt } = job.data;
    this.logger.debug(
      `Digest processor placeholder handling ${digestType} digest for user ${userId} scheduled at ${scheduledAt}`,
    );
  }
}
