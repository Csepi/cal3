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

@Module({
  imports: [TypeOrmModule.forFeature([LogEntry, LogSettings]), CommonModule],
  providers: [
    LoggingService,
    AppLoggerService,
    LogCleanupService,
    SecurityAuditService,
    RequestLoggingInterceptor,
  ],
  exports: [
    LoggingService,
    AppLoggerService,
    SecurityAuditService,
    RequestLoggingInterceptor,
  ],
})
export class LoggingModule {}
