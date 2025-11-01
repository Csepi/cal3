import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from '../entities/resource.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { Reservation } from '../entities/reservation.entity';
import { OperatingHours } from '../entities/operating-hours.entity';
import { User } from '../entities/user.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../entities/organisation-calendar-permission.entity';
import { ReservationCalendarRole } from '../entities/reservation-calendar-role.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resource,
      ResourceType,
      Reservation,
      OperatingHours,
      User,
      Organisation,
      OrganisationAdmin,
      OrganisationUser,
      OrganisationResourceTypePermission,
      OrganisationCalendarPermission,
      ReservationCalendarRole,
      ReservationCalendar,
    ]),
    ConfigurationModule,
  ],
  controllers: [ResourcesController, PublicBookingController],
  providers: [ResourcesService, PublicBookingService, UserPermissionsService],
  exports: [ResourcesService, PublicBookingService],
})
export class ResourcesModule {}
