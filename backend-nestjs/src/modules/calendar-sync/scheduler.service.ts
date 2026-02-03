import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CalendarSyncService } from './calendar-sync.service';

@Injectable()
export class CalendarSyncSchedulerService {
  private readonly logger = new Logger(CalendarSyncSchedulerService.name);

  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledSync(): Promise<void> {
    try {
      await this.calendarSyncService.syncAllActiveConnections();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Scheduled calendar sync failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
