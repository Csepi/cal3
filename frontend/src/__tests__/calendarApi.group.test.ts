import { calendarApi } from '../services/calendarApi';
import { apiService } from '../services/api';
import { http } from '../lib/http';

jest.mock('../services/api', () => ({
  apiService: {
    getAllCalendars: jest.fn(),
    createCalendar: jest.fn(),
    updateCalendar: jest.fn(),
    deleteCalendar: jest.fn(),
    getCalendarGroups: jest.fn(),
    createCalendarGroup: jest.fn(),
    updateCalendarGroup: jest.fn(),
    deleteCalendarGroup: jest.fn(),
    assignCalendarsToGroup: jest.fn(),
    unassignCalendarsFromGroup: jest.fn(),
    shareCalendarGroup: jest.fn(),
    unshareCalendarGroup: jest.fn(),
    getCalendarSyncStatus: jest.fn(),
    getCalendarAuthUrl: jest.fn(),
    syncCalendars: jest.fn(),
    disconnectCalendarProvider: jest.fn(),
    forceCalendarSync: jest.fn(),
  },
}));

jest.mock('../lib/http', () => ({
  http: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('calendarApi wrappers', () => {
  const mockedApiService = apiService as jest.Mocked<typeof apiService>;
  const mockedHttp = http as jest.Mocked<typeof http>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards unshareCalendarGroup using only payload.userIds', async () => {
    mockedApiService.unshareCalendarGroup.mockResolvedValueOnce({
      unsharedCalendarIds: [11, 12],
    });

    const result = await calendarApi.unshareCalendarGroup(7, {
      userIds: [22, 23],
      permission: 'read',
    } as never);

    expect(mockedApiService.unshareCalendarGroup).toHaveBeenCalledWith(7, [
      22,
      23,
    ]);
    expect(result).toEqual({ unsharedCalendarIds: [11, 12] });
  });

  it('uses http aliases for syncCalendar and settings compatibility routes', async () => {
    mockedHttp.post.mockResolvedValueOnce({ ok: true } as never);
    mockedHttp.get.mockResolvedValueOnce({
      timezone: 'UTC',
      defaultCalendarView: 'week',
    } as never);
    mockedHttp.patch.mockResolvedValueOnce({
      timezone: 'Europe/Budapest',
    } as never);

    await expect(
      calendarApi.syncCalendar({
        provider: 'google',
        calendars: [{ externalId: 'g-1', localName: 'Google primary' }],
      }),
    ).resolves.toEqual({ ok: true });
    await expect(calendarApi.getCalendarSettings()).resolves.toEqual({
      timezone: 'UTC',
      defaultCalendarView: 'week',
    });
    await expect(
      calendarApi.updateCalendarSettings({ timezone: 'Europe/Budapest' }),
    ).resolves.toEqual({ timezone: 'Europe/Budapest' });

    expect(mockedHttp.post).toHaveBeenCalledWith('/api/calendar-sync/sync', {
      provider: 'google',
      calendars: [{ externalId: 'g-1', localName: 'Google primary' }],
    });
    expect(mockedHttp.get).toHaveBeenCalledWith('/api/user/profile');
    expect(mockedHttp.patch).toHaveBeenCalledWith('/api/user/profile', {
      timezone: 'Europe/Budapest',
    });
  });

  it('delegates core calendar and group methods to apiService', async () => {
    mockedApiService.getAllCalendars.mockResolvedValueOnce([{ id: 1 }] as never);
    mockedApiService.createCalendar.mockResolvedValueOnce({ id: 2 } as never);
    mockedApiService.assignCalendarsToGroup.mockResolvedValueOnce({
      id: 9,
      calendars: [{ id: 2 }],
    } as never);

    await expect(calendarApi.getCalendars()).resolves.toEqual([{ id: 1 }]);
    await expect(
      calendarApi.createCalendar({ name: 'Ops' } as never),
    ).resolves.toEqual({ id: 2 });
    await expect(
      calendarApi.assignCalendarsToGroup(9, { calendarIds: [2] }),
    ).resolves.toEqual({ id: 9, calendars: [{ id: 2 }] });

    expect(mockedApiService.getAllCalendars).toHaveBeenCalledTimes(1);
    expect(mockedApiService.createCalendar).toHaveBeenCalledWith({
      name: 'Ops',
    });
    expect(mockedApiService.assignCalendarsToGroup).toHaveBeenCalledWith(9, {
      calendarIds: [2],
    });
  });
});
