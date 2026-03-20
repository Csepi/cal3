import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CalendarsModule } from './calendars/calendars.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { CalendarSyncModule } from './modules/calendar-sync/calendar-sync.module';
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
import { CalendarGroup } from './entities/calendar-group.entity';
import { Event } from './entities/event.entity';
import { Task } from './entities/task.entity';
import { LoggingModule } from './logging/logging.module';
import { AgentsModule } from './agents/agents.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { TasksModule } from './tasks/tasks.module';
import { DatabaseModule } from './common/database/database.module';
import { RequestSanitizationMiddleware } from './common/middleware/request-sanitization.middleware';
import { StrictOriginMiddleware } from './common/middleware/strict-origin.middleware';
import { CsrfProtectionMiddleware } from './common/middleware/csrf-protection.middleware';
import { MonitoringModule } from './monitoring/monitoring.module';
import { ApiSecurityModule } from './api-security/api-security.module';
import { IpBlockMiddleware } from './api-security/middleware/ip-block.middleware';
import { RequestHardeningMiddleware } from './api-security/middleware/request-hardening.middleware';
import { ComplianceModule } from './compliance/compliance.module';
import { AppI18nModule } from './i18n/i18n.module';
import { LanguagePreferenceMiddleware } from './i18n/language-preference.middleware';
import { UserLanguageController } from './controllers/user-language.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
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
    MonitoringModule,
    ApiSecurityModule,
    ComplianceModule,
    AppI18nModule,
    TypeOrmModule.forFeature([
      User,
      Calendar,
      CalendarShare,
      CalendarGroup,
      Event,
      Task,
    ]),
  ],
  controllers: [
    AppController,
    UserProfileController,
    UserPermissionsController,
    UserLanguageController,
    FeatureFlagsController,
  ],
  providers: [
    AppService,
    DatabaseDiagnosticsService,
    FeatureFlagsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        LanguagePreferenceMiddleware,
        RequestContextMiddleware,
        IpBlockMiddleware,
        RequestHardeningMiddleware,
        RequestSanitizationMiddleware,
        StrictOriginMiddleware,
        CsrfProtectionMiddleware,
      )
      .forRoutes('*');
  }
}
