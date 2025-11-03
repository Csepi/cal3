import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { NotificationMessage } from '../entities/notification-message.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { PushDeviceToken } from '../entities/push-device-token.entity';
import { NotificationThread } from '../entities/notification-thread.entity';
import { NotificationThreadState } from '../entities/notification-thread-state.entity';
import { NotificationInboxRule } from '../entities/notification-inbox-rule.entity';
import { NotificationScopeMute } from '../entities/notification-scope-mute.entity';
import { NotificationsService } from './notifications.service';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationThreadsService } from './notification-threads.service';
import { NotificationsController } from './notifications.controller';
import { NotificationRulesController } from './notification-rules.controller';
import { NotificationThreadsController } from './notification-threads.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsDispatchProcessor } from './processors/notifications-dispatch.processor';
import { NotificationsDigestProcessor } from './processors/notifications-digest.processor';
import {
  NOTIFICATIONS_DIGEST_QUEUE,
  NOTIFICATIONS_DISPATCH_QUEUE,
} from './notifications.constants';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379/0';
        return {
          url: redisUrl,
        };
      },
    }),
    BullModule.registerQueue(
      {
        name: NOTIFICATIONS_DISPATCH_QUEUE,
      },
      {
        name: NOTIFICATIONS_DIGEST_QUEUE,
      },
    ),
    TypeOrmModule.forFeature([
      NotificationMessage,
      NotificationDelivery,
      UserNotificationPreference,
      PushDeviceToken,
      NotificationThread,
      NotificationThreadState,
      NotificationInboxRule,
      NotificationScopeMute,
      User,
    ]),
  ],
  controllers: [
    NotificationsController,
    NotificationRulesController,
    NotificationThreadsController,
    NotificationsAdminController,
  ],
  providers: [
    NotificationsService,
    NotificationRulesService,
    NotificationThreadsService,
    NotificationsGateway,
    NotificationsDispatchProcessor,
    NotificationsDigestProcessor,
  ],
  exports: [
    NotificationsService,
    NotificationRulesService,
    NotificationThreadsService,
  ],
})
export class NotificationsModule {}
