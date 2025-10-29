import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from '../entities/log-entry.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { LoggingService } from './logging.service';
import { AppLoggerService } from './app-logger.service';
import { LogCleanupService } from './log-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntry, LogSettings])],
  providers: [LoggingService, AppLoggerService, LogCleanupService],
  exports: [LoggingService, AppLoggerService],
})
export class LoggingModule {}
