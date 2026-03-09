import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from '../entities/log-entry.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { LoggingService } from './logging.service';
import { AppLoggerService } from './app-logger.service';
import { LogCleanupService } from './log-cleanup.service';
import { SecurityAuditService } from './security-audit.service';
import { CommonModule } from '../common/common.module';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { AuditEvent } from '../entities/audit-event.entity';
import { AuditTrailService } from './audit-trail.service';
import { AuditMutationSubscriber } from './audit-mutation.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntry, LogSettings, AuditEvent]),
    CommonModule,
  ],
  providers: [
    LoggingService,
    AppLoggerService,
    LogCleanupService,
    SecurityAuditService,
    AuditTrailService,
    AuditMutationSubscriber,
    RequestLoggingInterceptor,
  ],
  exports: [
    LoggingService,
    AppLoggerService,
    SecurityAuditService,
    AuditTrailService,
    RequestLoggingInterceptor,
  ],
})
export class LoggingModule {}
