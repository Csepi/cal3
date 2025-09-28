import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { User } from '../entities/user.entity';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { OrganisationAdminController } from './organisation-admin.controller';
import { OrganisationAdminService } from './organisation-admin.service';
import { CalendarsModule } from '../calendars/calendars.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organisation,
      OrganisationAdmin,
      User
    ]),
    CalendarsModule
  ],
  controllers: [
    OrganisationsController,
    OrganisationAdminController
  ],
  providers: [
    OrganisationsService,
    OrganisationAdminService
  ],
  exports: [
    OrganisationsService,
    OrganisationAdminService
  ],
})
export class OrganisationsModule {}