import { Module, Logger } from '@nestjs/common';
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
import { CalendarSyncModule } from './calendar-sync/calendar-sync.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { ResourceTypesModule } from './resource-types/resource-types.module';
import { ResourcesModule } from './resources/resources.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AutomationModule } from './automation/automation.module';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { CommonModule } from './common/common.module';
import { DatabaseDiagnosticsService } from './database/database-diagnostics.service';
import { User } from './entities/user.entity';
import { Calendar, CalendarShare } from './entities/calendar.entity';
import { Event } from './entities/event.entity';
import { CalendarSyncConnection, SyncedCalendar, SyncEventMapping } from './entities/calendar-sync.entity';
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

// Create logger instance for database connection logging
const dbLogger = new Logger('DatabaseConnection');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
          const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
          const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10);

          // Log database configuration at startup
          dbLogger.log('========================================');
          dbLogger.log('PostgreSQL Connection Configuration');
          dbLogger.log('========================================');
          dbLogger.log(`Host: ${host}`);
          dbLogger.log(`Port: ${port}`);
          dbLogger.log(`Database: ${database}`);
          dbLogger.log(`Username: ${username}`);
          dbLogger.log(`Password: ${process.env.DB_PASSWORD ? '[SET - ' + process.env.DB_PASSWORD.length + ' chars]' : '[NOT SET]'}`);
          dbLogger.log(`SSL Enabled: ${sslEnabled}`);
          dbLogger.log(`SSL Reject Unauthorized: ${sslRejectUnauthorized}`);
          dbLogger.log(`Connection Timeout: ${connectionTimeout}ms`);
          dbLogger.log(`Pool Max: ${process.env.DB_POOL_MAX || '10'}`);
          dbLogger.log(`Pool Min: ${process.env.DB_POOL_MIN || '2'}`);
          dbLogger.log(`Connection String: postgresql://${username}:***@${host}:${port}/${database}`);
          dbLogger.log('========================================');

          // Warnings for common issues
          if (host.includes('azure.com') || host.includes('amazonaws.com')) {
            dbLogger.warn('⚠️  Detected cloud database provider');
            dbLogger.warn('⚠️  Ensure firewall rules allow connections from this IP');
          }
          if (connectionTimeout < 30000) {
            dbLogger.warn(`⚠️  Connection timeout (${connectionTimeout}ms) may be too short for cloud databases`);
            dbLogger.warn('⚠️  Recommended: 60000ms (60 seconds) for Azure/AWS');
          }

          const config = {
            type: 'postgres' as const,
            host,
            port,
            username,
            password: process.env.DB_PASSWORD,
            database,
            entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping, Organisation, OrganisationAdmin, OrganisationUser, OrganisationResourceTypePermission, OrganisationCalendarPermission, ReservationCalendar, ReservationCalendarRole, ResourceType, Resource, OperatingHours, Reservation, AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog],
            synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
            ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
            logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
            logger: 'advanced-console' as const,
            extra: {
              max: parseInt(process.env.DB_POOL_MAX || '10', 10),
              min: parseInt(process.env.DB_POOL_MIN || '2', 10),
              idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
              connectionTimeoutMillis: connectionTimeout,
            },
          };

          dbLogger.log('🔌 Attempting to connect to PostgreSQL...');
          const startTime = Date.now();

          // Note: We can't use async/await here, but we can add event listeners
          // These will be triggered by TypeORM's internal connection logic
          process.nextTick(() => {
            dbLogger.log(`⏱️  Connection attempt started at ${new Date().toISOString()}`);
          });

          return config;
        } else {
          dbLogger.log('Using SQLite database');
          return {
            type: 'sqlite' as const,
            database: process.env.DB_DATABASE || 'cal3.db',
            entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping, Organisation, OrganisationAdmin, OrganisationUser, OrganisationResourceTypePermission, OrganisationCalendarPermission, ReservationCalendar, ReservationCalendarRole, ResourceType, Resource, OperatingHours, Reservation, AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog],
            synchronize: true,
            logging: process.env.NODE_ENV === 'development',
          };
        }
      })()
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
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AppController, UserProfileController, UserPermissionsController],
  providers: [AppService, DatabaseDiagnosticsService],
})
export class AppModule {}
