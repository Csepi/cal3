import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import {
  NotificationChannelProvider,
  NotificationChannelContext,
  NotificationChannelSkipError,
} from './notification-channel.interface';
import { PushDeviceToken } from '../../entities/push-device-token.entity';

@Injectable()
export class MobilePushChannelProvider implements NotificationChannelProvider {
  readonly channel = 'mobilepush' as const;

  private readonly logger = new Logger(MobilePushChannelProvider.name);
  private initialized = false;
  private available = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushDeviceToken)
    private readonly pushDeviceRepository: Repository<PushDeviceToken>,
  ) {}

  async canSend(): Promise<boolean> {
    await this.ensureInitialized();
    return this.available;
  }

  async send({ message }: NotificationChannelContext): Promise<void> {
    await this.ensureInitialized();

    if (!this.available) {
      throw new NotificationChannelSkipError('Mobile push not configured');
    }

    const tokens = await this.pushDeviceRepository.find({
      where: [
        { userId: message.userId, platform: 'ios' },
        { userId: message.userId, platform: 'android' },
      ],
    });

    if (tokens.length === 0) {
      throw new NotificationChannelSkipError(
        'No mobile push tokens registered',
      );
    }

    const registrationTokens = tokens.map((token) => token.token);

    try {
      const response = await admin.messaging().sendMulticast({
        tokens: registrationTokens,
        notification: {
          title: message.title ?? 'New notification',
          body: message.body,
        },
        data: {
          eventType: message.eventType,
          messageId: String(message.id),
          threadKey: message.threadKey ?? '',
        },
      });

      if (
        response.failureCount === response.successCount &&
        response.successCount === 0
      ) {
        throw new Error('All FCM sends failed');
      }

      if (response.failureCount > 0) {
        response.responses.forEach((res, index) => {
          if (!res.success) {
            this.logger.warn(
              `FCM send failed for token ${registrationTokens[index]}: ${res.error?.message}`,
            );
          }
        });
      }
    } catch (error) {
      this.logger.error(
        `Mobile push send failed for user ${message.userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const credentialJson = this.configService.get<string>('FCM_CLIENT_JSON');

    if (!credentialJson) {
      this.logger.warn('FCM_CLIENT_JSON not configured; mobile push disabled');
      this.initialized = true;
      this.available = false;
      return;
    }

    try {
      const credential = JSON.parse(credentialJson);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(credential),
          projectId:
            credential.project_id ||
            this.configService.get<string>('FCM_PROJECT_ID') ||
            undefined,
        });
      }
      this.available = true;
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.available = false;
    }

    this.initialized = true;
  }
}
