import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NotificationChannelProvider,
  NotificationChannelContext,
  NotificationChannelSkipError,
} from './notification-channel.interface';
import { PushDeviceToken } from '../../entities/push-device-token.entity';

@Injectable()
export class WebPushChannelProvider implements NotificationChannelProvider {
  readonly channel = 'webpush' as const;

  private readonly logger = new Logger(WebPushChannelProvider.name);
  private initialized = false;
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushDeviceToken)
    private readonly pushDeviceRepository: Repository<PushDeviceToken>,
  ) {}

  async canSend(): Promise<boolean> {
    await this.ensureConfigured();
    return this.isConfigured;
  }

  async send({ message }: NotificationChannelContext): Promise<void> {
    await this.ensureConfigured();

    if (!this.isConfigured) {
      throw new NotificationChannelSkipError('Web push not configured');
    }

    const tokens = await this.pushDeviceRepository.find({
      where: { userId: message.userId, platform: 'web' },
    });

    if (tokens.length === 0) {
      throw new NotificationChannelSkipError('No web push subscriptions found');
    }

    const payload = JSON.stringify({
      title: message.title ?? 'New notification',
      body: message.body,
      data: {
        eventType: message.eventType,
        messageId: message.id,
        threadKey: message.threadKey ?? undefined,
      },
    });

    const failures: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        try {
          const subscription = JSON.parse(token.token);
          await webPush.sendNotification(subscription, payload);
        } catch (error) {
          const messageText = error instanceof Error ? error.message : String(error);
          failures.push(messageText);
          this.logger.warn(
            `Web push send failed for user ${message.userId}: ${messageText}`,
          );
          // If subscription invalid, remove it
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            (error as any).statusCode === 410
          ) {
            await this.pushDeviceRepository.delete(token.id);
          }
        }
      }),
    );

    if (failures.length === tokens.length) {
      throw new Error('All web push attempts failed');
    }
  }

  private async ensureConfigured(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const publicKey = this.configService.get<string>('WEBPUSH_VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('WEBPUSH_VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('WEBPUSH_VAPID_SUBJECT') || 'mailto:support@cal3.local';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys missing; web push disabled');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
    this.isConfigured = true;
    this.initialized = true;
  }
}
