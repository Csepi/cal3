import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { Task } from './entities/task.entity';
import { LoggingModule } from './logging/logging.module';
import { AgentsModule } from './agents/agents.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { TasksModule } from './tasks/tasks.module';
import { DatabaseModule } from './common/database/database.module';

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
    TypeOrmModule.forFeature([User, Calendar, CalendarShare, CalendarGroup, Task]),
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
