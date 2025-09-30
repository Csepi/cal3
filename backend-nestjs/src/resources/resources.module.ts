import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from '../entities/resource.entity';
import { ResourceType } from '../entities/resource-type.entity';
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
import { UserPermissionsService } from '../common/services/user-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Resource,
    ResourceType,
    User,
    Organisation,
    OrganisationAdmin,
    OrganisationUser,
    OrganisationResourceTypePermission,
    OrganisationCalendarPermission,
    ReservationCalendarRole,
    ReservationCalendar
  ])],
  controllers: [ResourcesController],
  providers: [ResourcesService, UserPermissionsService],
  exports: [ResourcesService],
})
export class ResourcesModule {}