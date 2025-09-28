import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../entities/organisation-calendar-permission.entity';
import { ReservationCalendarRole } from '../entities/reservation-calendar-role.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { UserPermissionsService } from './services/user-permissions.service';

@Global() // Make this module global so its exports are available everywhere
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organisation,
      OrganisationAdmin,
      OrganisationUser,
      OrganisationResourceTypePermission,
      OrganisationCalendarPermission,
      ReservationCalendarRole,
      ReservationCalendar,
      ResourceType,
    ]),
  ],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService, TypeOrmModule],
})
export class CommonModule {}