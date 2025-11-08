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
import { Resource } from '../entities/resource.entity';
import { Reservation } from '../entities/reservation.entity';
import { IdempotencyRecord } from '../entities/idempotency-record.entity';
import { RequestContextService } from './services/request-context.service';
import { IdempotencyService } from './services/idempotency.service';
import { OrganisationOwnershipGuard } from '../auth/guards/organisation-ownership.guard';
import { UserPermissionsService } from './services/user-permissions.service';
import { CascadeDeletionService } from './services/cascade-deletion.service';
import { ReservationAvailabilityService } from './services/reservation-availability.service';

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
      Resource,
      Reservation,
      IdempotencyRecord,
    ]),
  ],
  providers: [
    UserPermissionsService,
    CascadeDeletionService,
    ReservationAvailabilityService,
    RequestContextService,
    IdempotencyService,
    OrganisationOwnershipGuard,
  ],
  exports: [
    UserPermissionsService,
    CascadeDeletionService,
    ReservationAvailabilityService,
    RequestContextService,
    IdempotencyService,
    OrganisationOwnershipGuard,
    TypeOrmModule,
  ],
})
export class CommonModule {}
