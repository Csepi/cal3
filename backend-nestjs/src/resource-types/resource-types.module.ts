import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceType } from '../entities/resource-type.entity';
import { Organisation } from '../entities/organisation.entity';
import { User } from '../entities/user.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../entities/organisation-calendar-permission.entity';
import { ReservationCalendarRole } from '../entities/reservation-calendar-role.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ResourceTypesController } from './resource-types.controller';
import { ResourceTypesService } from './resource-types.service';
import { UserPermissionsService } from '../common/services/user-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResourceType,
      Organisation,
      User,
      OrganisationAdmin,
      OrganisationUser,
      OrganisationResourceTypePermission,
      OrganisationCalendarPermission,
      ReservationCalendarRole,
      ReservationCalendar,
    ]),
  ],
  controllers: [ResourceTypesController],
  providers: [ResourceTypesService, UserPermissionsService],
  exports: [ResourceTypesService],
})
export class ResourceTypesModule {}
