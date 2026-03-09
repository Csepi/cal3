import type { Calendar } from '../types/Calendar';
import { CalendarVisibility } from '../types/Calendar';
import type { CalendarGroupWithCalendars } from '../types/CalendarGroup';
import type { Event } from '../types/Event';
import {
  buildOfflineTimelineUserKey,
  clearOfflineTimelineSnapshot,
  clearOfflineTimelineSnapshots,
  getOfflineTimelineSnapshot,
  hasOfflineTimelineSnapshot,
  isNavigatorOffline,
  isOfflineNetworkError,
  upsertOfflineTimelineSnapshot,
} from '../services/offlineTimelineCache';

const makeCalendar = (id: number): Calendar => ({
  id,
  name: `Calendar ${id}`,
  color: '#0ea5e9',
  visibility: CalendarVisibility.PRIVATE,
  isActive: true,
  owner: {
    id: 1,
    username: 'owner',
    email: 'owner@example.com',
  },
  ownerId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeEvent = (id: number): Event => ({
  id,
  title: `Event ${id}`,
  startDate: '2026-03-09',
  isAllDay: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  calendarId: 1,
  createdById: 1,
});

const makeGroup = (id: number): CalendarGroupWithCalendars => ({
  id,
  name: `Group ${id}`,
  isVisible: true,
  ownerId: 1,
  calendars: [{ id: 1, name: 'Calendar 1', color: '#0ea5e9', groupId: id }],
});

const setNavigatorOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: online,
  });
};

describe('offlineTimelineCache', () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorOnline(true);
  });

  test.each([
    [{ id: 3 }, 'id:3'],
    [{ username: 'Alice' }, 'username:alice'],
    [{ email: 'A@Example.com' }, 'email:a@example.com'],
  ])('buildOfflineTimelineUserKey resolves stable key', (identity, expected) => {
    expect(buildOfflineTimelineUserKey(identity)).toBe(expected);
  });

  test('buildOfflineTimelineUserKey returns null when identity is empty', () => {
    expect(buildOfflineTimelineUserKey(null)).toBeNull();
    expect(buildOfflineTimelineUserKey(undefined)).toBeNull();
    expect(buildOfflineTimelineUserKey({ username: '   ' })).toBeNull();
  });

  test('upsert + get snapshot persists sanitized timeline data', () => {
    const user = { id: 21 };

    upsertOfflineTimelineSnapshot(user, {
      events: [makeEvent(1)],
      calendars: [makeCalendar(1)],
      calendarGroups: [makeGroup(1)],
    });

    const snapshot = getOfflineTimelineSnapshot(user);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.events).toHaveLength(1);
    expect(snapshot?.calendars).toHaveLength(1);
    expect(snapshot?.calendarGroups).toHaveLength(1);
  });

  test('upsert keeps existing sections when partial updates are provided', () => {
    const user = { id: 22 };

    upsertOfflineTimelineSnapshot(user, {
      events: [makeEvent(1)],
      calendars: [makeCalendar(1)],
      calendarGroups: [makeGroup(1)],
    });

    upsertOfflineTimelineSnapshot(user, {
      events: [makeEvent(2)],
    });

    const snapshot = getOfflineTimelineSnapshot(user);
    expect(snapshot?.events[0]?.id).toBe(2);
    expect(snapshot?.calendars).toHaveLength(1);
    expect(snapshot?.calendarGroups).toHaveLength(1);
  });

  test('invalid events are filtered out by sanitization', () => {
    const user = { id: 23 };

    upsertOfflineTimelineSnapshot(user, {
      events: [
        makeEvent(1),
        ({ id: 2, title: '', startDate: '2026-01-01' } as unknown) as Event,
        ({ id: 0, title: 'Broken', startDate: '2026-01-01' } as unknown) as Event,
      ],
    });

    const snapshot = getOfflineTimelineSnapshot(user);
    expect(snapshot?.events).toHaveLength(1);
    expect(snapshot?.events[0]?.id).toBe(1);
  });

  test('snapshot keeps only most recent 5 users', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const base = 1_700_000_000_000;
    for (let i = 1; i <= 7; i += 1) {
      nowSpy.mockReturnValue(base + i * 1_000);
      upsertOfflineTimelineSnapshot({ id: i }, { events: [makeEvent(i)] });
    }
    nowSpy.mockReturnValue(base + 8_000);

    expect(hasOfflineTimelineSnapshot({ id: 1 })).toBe(false);
    expect(hasOfflineTimelineSnapshot({ id: 2 })).toBe(false);
    expect(hasOfflineTimelineSnapshot({ id: 7 })).toBe(true);

    nowSpy.mockRestore();
  });

  test('clearOfflineTimelineSnapshot removes a single user snapshot', () => {
    const userA = { id: 31 };
    const userB = { id: 32 };

    upsertOfflineTimelineSnapshot(userA, { events: [makeEvent(1)] });
    upsertOfflineTimelineSnapshot(userB, { events: [makeEvent(2)] });

    clearOfflineTimelineSnapshot(userA);

    expect(hasOfflineTimelineSnapshot(userA)).toBe(false);
    expect(hasOfflineTimelineSnapshot(userB)).toBe(true);
  });

  test('clearOfflineTimelineSnapshots clears all cached users', () => {
    upsertOfflineTimelineSnapshot({ id: 41 }, { events: [makeEvent(1)] });
    upsertOfflineTimelineSnapshot({ id: 42 }, { events: [makeEvent(2)] });

    clearOfflineTimelineSnapshots();

    expect(hasOfflineTimelineSnapshot({ id: 41 })).toBe(false);
    expect(hasOfflineTimelineSnapshot({ id: 42 })).toBe(false);
  });

  test('stale snapshots are discarded on read', () => {
    const staleStore = {
      version: 1,
      snapshots: {
        'id:99': {
          cachedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
          events: [makeEvent(1)],
          calendars: [makeCalendar(1)],
          calendarGroups: [makeGroup(1)],
        },
      },
    };

    localStorage.setItem('primecal_mobile_offline_timeline_v1', JSON.stringify(staleStore));

    expect(getOfflineTimelineSnapshot({ id: 99 })).toBeNull();
  });

  test('corrupted cache json fails safely', () => {
    localStorage.setItem('primecal_mobile_offline_timeline_v1', '{invalid-json');
    expect(getOfflineTimelineSnapshot({ id: 50 })).toBeNull();
  });

  test('isNavigatorOffline reflects navigator.onLine state', () => {
    setNavigatorOnline(true);
    expect(isNavigatorOffline()).toBe(false);

    setNavigatorOnline(false);
    expect(isNavigatorOffline()).toBe(true);
  });

  test.each([
    [new TypeError('Failed to fetch'), true],
    [new Error('Network request failed'), true],
    [new Error('random failure'), false],
    ['NetworkError when attempting to fetch resource.', true],
  ])('isOfflineNetworkError handles %p', (value, expected) => {
    setNavigatorOnline(true);
    expect(isOfflineNetworkError(value)).toBe(expected);
  });

  test('isOfflineNetworkError short-circuits when navigator is offline', () => {
    setNavigatorOnline(false);
    expect(isOfflineNetworkError(new Error('anything'))).toBe(true);
  });

  test('large event arrays are capped to retention size', () => {
    const user = { id: 77 };
    const events = Array.from({ length: 1600 }, (_, index) => makeEvent(index + 1));

    upsertOfflineTimelineSnapshot(user, { events });

    const snapshot = getOfflineTimelineSnapshot(user);
    expect(snapshot?.events.length).toBe(1500);
  });
});
