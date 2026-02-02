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
    } catch (error) {
      this.logger.error(
        `Scheduled calendar sync failed: ${error.message}`,
        error.stack,
      );
    }
  }
}

