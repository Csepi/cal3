import { MiddlewareConsumer, Module, NestModule, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CalendarsModule } from './calendars/calendars.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { CalendarSyncModule } from './calendar-sync/calendar-sync.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { ResourceTypesModule } from './resource-types/resource-types.module';
import { ResourcesModule } from './resources/resources.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AutomationModule } from './automation/automation.module';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { CommonModule } from './common/common.module';
import { FeatureFlagsController } from './common/feature-flags.controller';
import { FeatureFlagsService } from './common/feature-flags.service';
import { DatabaseDiagnosticsService } from './database/database-diagnostics.service';
import { User } from './entities/user.entity';
import { Calendar, CalendarShare } from './entities/calendar.entity';
import { Event } from './entities/event.entity';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
} from './entities/calendar-sync.entity';
import { Organisation } from './entities/organisation.entity';
import { OrganisationAdmin } from './entities/organisation-admin.entity';
import { OrganisationUser } from './entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from './entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from './entities/organisation-calendar-permission.entity';
import { ReservationCalendar } from './entities/reservation-calendar.entity';
import { ReservationCalendarRole } from './entities/reservation-calendar-role.entity';
import { ResourceType } from './entities/resource-type.entity';
import { Resource } from './entities/resource.entity';
import { OperatingHours } from './entities/operating-hours.entity';
import { Reservation } from './entities/reservation.entity';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationCondition } from './entities/automation-condition.entity';
import { AutomationAction } from './entities/automation-action.entity';
import { AutomationAuditLog } from './entities/automation-audit-log.entity';
import { LogEntry } from './entities/log-entry.entity';
import { LogSettings } from './entities/log-settings.entity';
import { LoggingModule } from './logging/logging.module';
import { AgentsModule } from './agents/agents.module';
import { AgentProfile } from './entities/agent-profile.entity';
import { AgentPermission } from './entities/agent-permission.entity';
import { AgentApiKey } from './entities/agent-api-key.entity';
import { ConfigurationModule } from './configuration/configuration.module';
import { ConfigurationSetting } from './entities/configuration-setting.entity';
import { NotificationMessage } from './entities/notification-message.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { UserNotificationPreference } from './entities/user-notification-preference.entity';
import { PushDeviceToken } from './entities/push-device-token.entity';
import { NotificationThread } from './entities/notification-thread.entity';
import { NotificationThreadState } from './entities/notification-thread-state.entity';
import { NotificationInboxRule } from './entities/notification-inbox-rule.entity';
import { NotificationScopeMute } from './entities/notification-scope-mute.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { IdempotencyRecord } from './entities/idempotency-record.entity';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { Task } from './entities/task.entity';
import { TaskLabel } from './entities/task-label.entity';
import { TasksModule } from './tasks/tasks.module';

// Create logger instance for database connection logging
const dbLogger = new Logger('DatabaseConnection');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_SEC ?? '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '120', 10),
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(
      (() => {
        const dbType = process.env.DB_TYPE;

        if (dbType === 'postgres') {
          const host = process.env.DB_HOST || 'localhost';
          const port = parseInt(process.env.DB_PORT || '5432', 10);
          const username = process.env.DB_USERNAME || 'postgres';
          const database = process.env.DB_NAME || 'cal3';
          const sslEnabled = process.env.DB_SSL === 'true';
          const sslRejectUnauthorized =
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
          const connectionTimeout = parseInt(
            process.env.DB_CONNECTION_TIMEOUT || '10000',
            10,
          );

          // Log database configuration at startup
          dbLogger.log('========================================');
          dbLogger.log('PostgreSQL Connection Configuration');
          dbLogger.log('========================================');
          dbLogger.log(`Host: ${host}`);
          dbLogger.log(`Port: ${port}`);
          dbLogger.log(`Database: ${database}`);
          dbLogger.log(`Username: ${username}`);
          dbLogger.log(
            `Password: ${process.env.DB_PASSWORD ? '[SET - ' + process.env.DB_PASSWORD.length + ' chars]' : '[NOT SET]'}`,
          );
          dbLogger.log(`SSL Enabled: ${sslEnabled}`);
          dbLogger.log(`SSL Reject Unauthorized: ${sslRejectUnauthorized}`);
          dbLogger.log(`Connection Timeout: ${connectionTimeout}ms`);
          dbLogger.log(`Pool Max: ${process.env.DB_POOL_MAX || '10'}`);
          dbLogger.log(`Pool Min: ${process.env.DB_POOL_MIN || '2'}`);
          dbLogger.log(
            `Connection String: postgresql://${username}:***@${host}:${port}/${database}`,
          );
          dbLogger.log('========================================');

          // Warnings for common issues
          if (host.includes('azure.com') || host.includes('amazonaws.com')) {
            dbLogger.warn('⚠️  Detected cloud database provider');
            dbLogger.warn(
              '⚠️  Ensure firewall rules allow connections from this IP',
            );
          }
          if (connectionTimeout < 30000) {
            dbLogger.warn(
              `⚠️  Connection timeout (${connectionTimeout}ms) may be too short for cloud databases`,
            );
            dbLogger.warn(
              '⚠️  Recommended: 60000ms (60 seconds) for Azure/AWS',
            );
          }

          const config = {
            type: 'postgres' as const,
            host,
            port,
            username,
            password: process.env.DB_PASSWORD,
            database,
            entities: [
              User,
              Calendar,
              CalendarShare,
              Event,
              Task,
              TaskLabel,
              CalendarSyncConnection,
              SyncedCalendar,
              SyncEventMapping,
              Organisation,
              OrganisationAdmin,
              OrganisationUser,
              OrganisationResourceTypePermission,
              OrganisationCalendarPermission,
              ReservationCalendar,
              ReservationCalendarRole,
              ResourceType,
              Resource,
              OperatingHours,
              Reservation,
              AutomationRule,
              AutomationCondition,
              AutomationAction,
              AutomationAuditLog,
              LogEntry,
              LogSettings,
              AgentProfile,
              AgentPermission,
              AgentApiKey,
              ConfigurationSetting,
              NotificationMessage,
              NotificationDelivery,
              UserNotificationPreference,
              PushDeviceToken,
              NotificationThread,
              NotificationThreadState,
              NotificationInboxRule,
              NotificationScopeMute,
              RefreshToken,
              IdempotencyRecord,
            ],
            ssl: sslEnabled
              ? { rejectUnauthorized: sslRejectUnauthorized }
              : false,
            logging:
              process.env.NODE_ENV === 'development' ||
              process.env.DB_LOGGING === 'true',
            logger: 'advanced-console' as const,
            extra: {
              max: parseInt(process.env.DB_POOL_MAX || '10', 10),
              min: parseInt(process.env.DB_POOL_MIN || '2', 10),
              idleTimeoutMillis: parseInt(
                process.env.DB_IDLE_TIMEOUT || '30000',
                10,
              ),
              connectionTimeoutMillis: connectionTimeout,
            },
          };

          const synchronizeSchema = process.env.DB_SYNCHRONIZE === 'true';
          if (!synchronizeSchema && process.env.NODE_ENV === 'development') {
            dbLogger.warn(
              '⚠️  DB_SYNCHRONIZE is disabled for PostgreSQL even in development. Enable it explicitly only against disposable databases.',
            );
          }

          dbLogger.log('🔌 Attempting to connect to PostgreSQL...');
          const startTime = Date.now();

          // Note: We can't use async/await here, but we can add event listeners
          // These will be triggered by TypeORM's internal connection logic
          process.nextTick(() => {
            dbLogger.log(
              `⏱️  Connection attempt started at ${new Date().toISOString()}`,
            );
          });

          return {
            ...config,
            synchronize: synchronizeSchema,
          };
        } else {
          dbLogger.log('Using SQLite database');
          return {
            type: 'sqlite' as const,
            database: process.env.DB_DATABASE || 'cal3.db',
            entities: [
              User,
              Calendar,
              CalendarShare,
              Event,
              Task,
              TaskLabel,
              CalendarSyncConnection,
              SyncedCalendar,
              SyncEventMapping,
              Organisation,
              OrganisationAdmin,
              OrganisationUser,
              OrganisationResourceTypePermission,
              OrganisationCalendarPermission,
              ReservationCalendar,
              ReservationCalendarRole,
              ResourceType,
              Resource,
              OperatingHours,
              Reservation,
              AutomationRule,
              AutomationCondition,
              AutomationAction,
              AutomationAuditLog,
              LogEntry,
              LogSettings,
              AgentProfile,
              AgentPermission,
              AgentApiKey,
              ConfigurationSetting,
              NotificationMessage,
              NotificationDelivery,
              UserNotificationPreference,
              PushDeviceToken,
              NotificationThread,
              NotificationThreadState,
              NotificationInboxRule,
              NotificationScopeMute,
              RefreshToken,
              IdempotencyRecord,
            ],
            synchronize: true,
            logging: process.env.NODE_ENV === 'development',
          };
        }
      })(),
    ),
    AuthModule,
    UsersModule,
    CalendarsModule,
    EventsModule,
    AdminModule,
    CalendarSyncModule,
    OrganisationsModule,
    ResourceTypesModule,
    ResourcesModule,
    ReservationsModule,
    AutomationModule,
    CommonModule,
    LoggingModule,
    AgentsModule,
    NotificationsModule,
    ConfigurationModule,
    TasksModule,
    TypeOrmModule.forFeature([User, Calendar, CalendarShare, Task]),
  ],
  controllers: [
    AppController,
    UserProfileController,
    UserPermissionsController,
    FeatureFlagsController,
  ],
  providers: [
    AppService,
    DatabaseDiagnosticsService,
    FeatureFlagsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
