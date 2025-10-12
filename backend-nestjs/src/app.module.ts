import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres' ? {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'cal3',
        entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping, Organisation, OrganisationAdmin, OrganisationUser, OrganisationResourceTypePermission, OrganisationCalendarPermission, ReservationCalendar, ReservationCalendarRole, ResourceType, Resource, OperatingHours, Reservation, AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog],
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
        // SSL configuration - enable for cloud databases (Azure, AWS RDS, etc.)
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
        logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
        // Connection pool settings for production
        extra: {
          max: parseInt(process.env.DB_POOL_MAX || '10', 10),
          min: parseInt(process.env.DB_POOL_MIN || '2', 10),
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
        },
      } : {
        type: 'sqlite',
        database: process.env.DB_DATABASE || 'cal3.db',
        entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping, Organisation, OrganisationAdmin, OrganisationUser, OrganisationResourceTypePermission, OrganisationCalendarPermission, ReservationCalendar, ReservationCalendarRole, ResourceType, Resource, OperatingHours, Reservation, AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
      }
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
  providers: [AppService],
})
export class AppModule {}
