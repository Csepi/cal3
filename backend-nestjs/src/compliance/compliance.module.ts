import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calendar } from '../entities/calendar.entity';
import { DataSubjectRequest } from '../entities/data-subject-request.entity';
import { Event } from '../entities/event.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { Reservation } from '../entities/reservation.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { UserConsent } from '../entities/user-consent.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { ComplianceAdminController } from './compliance-admin.controller';
import { ComplianceController } from './compliance.controller';
import { ComplianceReportingService } from './compliance-reporting.service';
import { ComplianceService } from './compliance.service';
import { LoggingModule } from '../logging/logging.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserConsent,
      DataSubjectRequest,
      Calendar,
      Event,
      Reservation,
      Task,
      LogSettings,
      OrganisationAdmin,
      AuditEvent,
    ]),
    LoggingModule,
  ],
  controllers: [ComplianceController, ComplianceAdminController],
  providers: [ComplianceService, ComplianceReportingService, AdminGuard],
  exports: [ComplianceService, ComplianceReportingService],
})
export class ComplianceModule {}
