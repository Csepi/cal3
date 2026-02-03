import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from './logging.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);

  constructor(private readonly loggingService: LoggingService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCleanup() {
    try {
      const deleted = await this.loggingService.purgeExpiredLogs();
      if (deleted > 0) {
        this.logger.log(
          `Log retention job removed ${deleted} expired entries.`,
        );
      }
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'log-cleanup.service' }));
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Log retention job failed', stack);
    }
  }
}
