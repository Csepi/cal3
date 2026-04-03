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

  it('delegates calendar, group, and sync success paths to apiService', async () => {
    const updatedCalendar = { id: 3, name: 'Ops Updated' };
    const groups = [{ id: 9, name: 'Ops', calendars: [{ id: 3 }] }];
    const createdGroup = { id: 10, name: 'Created Group', ownerId: 1 };
    const updatedGroup = { id: 10, name: 'Renamed Group', ownerId: 1 };
    const unassignedGroup = { id: 10, calendars: [{ id: 4 }] };
    const sharedResult = { sharedCalendarIds: [3, 4] };
    const syncStatus = { providers: [{ provider: 'google', isConnected: true }] };
    const syncPayload = {
      provider: 'google' as const,
      calendars: [
        {
          externalId: 'google-1',
          localName: 'Primary',
          triggerAutomationRules: true,
          selectedRuleIds: [5],
        },
      ],
    };
    const syncResult = { imported: 1 };
    const forceResult = { queued: true };

    mockedApiService.updateCalendar.mockResolvedValueOnce(updatedCalendar as never);
    mockedApiService.deleteCalendar.mockResolvedValueOnce(undefined as never);
    mockedApiService.getCalendarGroups.mockResolvedValueOnce(groups as never);
    mockedApiService.createCalendarGroup.mockResolvedValueOnce(createdGroup as never);
    mockedApiService.updateCalendarGroup.mockResolvedValueOnce(updatedGroup as never);
    mockedApiService.deleteCalendarGroup.mockResolvedValueOnce(undefined as never);
    mockedApiService.unassignCalendarsFromGroup.mockResolvedValueOnce(
      unassignedGroup as never,
    );
    mockedApiService.shareCalendarGroup.mockResolvedValueOnce(sharedResult as never);
    mockedApiService.getCalendarSyncStatus.mockResolvedValueOnce(syncStatus as never);
    mockedApiService.getCalendarAuthUrl.mockResolvedValueOnce(
      'https://accounts.example.test/oauth',
    );
    mockedApiService.syncCalendars.mockResolvedValueOnce(syncResult as never);
    mockedApiService.disconnectCalendarProvider.mockResolvedValueOnce(
      undefined as never,
    );
    mockedApiService.forceCalendarSync.mockResolvedValueOnce(forceResult as never);

    await expect(
      calendarApi.updateCalendar(3, { name: 'Ops Updated', groupId: null } as never),
    ).resolves.toEqual(updatedCalendar);
    await expect(calendarApi.deleteCalendar(3)).resolves.toBeUndefined();
    await expect(calendarApi.getCalendarGroups()).resolves.toEqual(groups);
    await expect(
      calendarApi.createCalendarGroup({ name: 'Created Group', isVisible: true } as never),
    ).resolves.toEqual(createdGroup);
    await expect(
      calendarApi.updateCalendarGroup(10, {
        name: 'Renamed Group',
        isVisible: false,
      } as never),
    ).resolves.toEqual(updatedGroup);
    await expect(calendarApi.deleteCalendarGroup(10)).resolves.toBeUndefined();
    await expect(
      calendarApi.unassignCalendarsFromGroup(10, { calendarIds: [3] }),
    ).resolves.toEqual(unassignedGroup);
    await expect(
      calendarApi.shareCalendarGroup(10, {
        userIds: [8, 9],
        permission: 'read',
      } as never),
    ).resolves.toEqual(sharedResult);
    await expect(calendarApi.getCalendarSyncStatus()).resolves.toEqual(syncStatus);
    await expect(calendarApi.getCalendarAuthUrl('google')).resolves.toBe(
      'https://accounts.example.test/oauth',
    );
    await expect(calendarApi.syncCalendars(syncPayload)).resolves.toEqual(syncResult);
    await expect(
      calendarApi.disconnectCalendarProvider('microsoft'),
    ).resolves.toBeUndefined();
    await expect(calendarApi.forceCalendarSync()).resolves.toEqual(forceResult);

    expect(mockedApiService.updateCalendar).toHaveBeenCalledWith(3, {
      name: 'Ops Updated',
      groupId: null,
    });
    expect(mockedApiService.deleteCalendar).toHaveBeenCalledWith(3);
    expect(mockedApiService.getCalendarGroups).toHaveBeenCalledTimes(1);
    expect(mockedApiService.createCalendarGroup).toHaveBeenCalledWith({
      name: 'Created Group',
      isVisible: true,
    });
    expect(mockedApiService.updateCalendarGroup).toHaveBeenCalledWith(10, {
      name: 'Renamed Group',
      isVisible: false,
    });
    expect(mockedApiService.deleteCalendarGroup).toHaveBeenCalledWith(10);
    expect(mockedApiService.unassignCalendarsFromGroup).toHaveBeenCalledWith(
      10,
      { calendarIds: [3] },
    );
    expect(mockedApiService.shareCalendarGroup).toHaveBeenCalledWith(10, {
      userIds: [8, 9],
      permission: 'read',
    });
    expect(mockedApiService.getCalendarSyncStatus).toHaveBeenCalledTimes(1);
    expect(mockedApiService.getCalendarAuthUrl).toHaveBeenCalledWith('google');
    expect(mockedApiService.syncCalendars).toHaveBeenCalledWith(syncPayload);
    expect(mockedApiService.disconnectCalendarProvider).toHaveBeenCalledWith(
      'microsoft',
    );
    expect(mockedApiService.forceCalendarSync).toHaveBeenCalledTimes(1);
  });
});
