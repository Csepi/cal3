import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from '../entities/log-entry.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { LoggingService } from './logging.service';
import { AppLoggerService } from './app-logger.service';
import { LogCleanupService } from './log-cleanup.service';
import { SecurityAuditService } from './security-audit.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntry, LogSettings]), CommonModule],
  providers: [
    LoggingService,
    AppLoggerService,
    LogCleanupService,
    SecurityAuditService,
  ],
  exports: [LoggingService, AppLoggerService, SecurityAuditService],
})
export class LoggingModule {}
