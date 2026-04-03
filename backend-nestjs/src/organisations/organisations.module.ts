import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ReservationCalendarRole } from '../entities/reservation-calendar-role.entity';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { OrganisationAdminController } from './organisation-admin.controller';
import { OrganisationAdminService } from './organisation-admin.service';
import { ReservationCalendarController } from './reservation-calendar.controller';
import { ReservationCalendarService } from './reservation-calendar.service';
import { CalendarsModule } from '../calendars/calendars.module';
import { CommonModule } from '../common/common.module';
import { AdminGuard } from '../auth/guards/admin.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organisation,
      OrganisationAdmin,
      OrganisationUser,
      User,
      Calendar,
      ReservationCalendar,
      ReservationCalendarRole,
    ]),
    CalendarsModule,
    CommonModule, // This imports UserPermissionsService
    NotificationsModule,
  ],
  controllers: [
    OrganisationsController,
    OrganisationAdminController,
    ReservationCalendarController,
  ],
  providers: [
    OrganisationsService,
    OrganisationAdminService,
    ReservationCalendarService,
    AdminGuard,
  ],
  exports: [
    OrganisationsService,
    OrganisationAdminService,
    ReservationCalendarService,
  ],
})
export class OrganisationsModule {}
