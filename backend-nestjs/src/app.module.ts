import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres' ? {
        type: 'postgres',
        host: process.env.DB_HOST || 'cal2db.postgres.database.azure.com',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'db_admin',
        password: process.env.DB_PASSWORD || 'Enter.Enter',
        database: process.env.DB_NAME || 'cal3',
        entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping, Organisation, OrganisationAdmin, OrganisationUser, OrganisationResourceTypePermission, OrganisationCalendarPermission, ReservationCalendar, ReservationCalendarRole, ResourceType, Resource, OperatingHours, Reservation, AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog],
        synchronize: process.env.NODE_ENV !== 'production',
        ssl: { rejectUnauthorized: false },
        logging: process.env.NODE_ENV === 'development',
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
