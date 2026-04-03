import { Logger } from '@nestjs/common';
import { CalendarSyncSchedulerService } from './scheduler.service';
import { CalendarSyncService } from './calendar-sync.service';

describe('CalendarSyncSchedulerService', () => {
  let calendarSyncService: {
    syncAllActiveConnections: jest.Mock<Promise<void>, []>;
  };
  let service: CalendarSyncSchedulerService;

  beforeEach(() => {
    jest.restoreAllMocks();
    calendarSyncService = {
      syncAllActiveConnections: jest.fn(async () => undefined),
    };
    service = new CalendarSyncSchedulerService(
      calendarSyncService as unknown as CalendarSyncService,
    );
  });

  it('runs scheduled sync successfully', async () => {
    await expect(service.runScheduledSync()).resolves.toBeUndefined();
    expect(calendarSyncService.syncAllActiveConnections).toHaveBeenCalledTimes(
      1,
    );
  });

  it('logs and swallows scheduler errors', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    calendarSyncService.syncAllActiveConnections.mockRejectedValueOnce(
      new Error('sync boom'),
    );

    await expect(service.runScheduledSync()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      'Scheduled calendar sync failed: sync boom',
      expect.any(String),
    );
  });
});

