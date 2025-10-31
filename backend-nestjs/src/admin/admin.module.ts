import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';
import { Reservation } from '../entities/reservation.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { Resource } from '../entities/resource.entity';
import { OperatingHours } from '../entities/operating-hours.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import { LoggingModule } from '../logging/logging.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { AdminConfigurationController } from './admin.configuration.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Calendar,
      Event,
      CalendarShare,
      Reservation,
      Organisation,
      OrganisationUser,
      OrganisationAdmin,
      ResourceType,
      Resource,
      OperatingHours,
      AutomationRule,
    ]),
    LoggingModule,
    ConfigurationModule,
  ],
  controllers: [AdminController, AdminConfigurationController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
