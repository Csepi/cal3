import type { Calendar } from '../types/Calendar';
import type { CalendarGroupWithCalendars } from '../types/CalendarGroup';
import type { Event } from '../types/Event';
import { clientLogger } from '../utils/clientLogger';

export interface OfflineCacheUserIdentity {
  id?: number;
  username?: string;
  email?: string;
}

export interface OfflineTimelineSnapshot {
  cachedAt: number;
  events: Event[];
  calendars: Calendar[];
  calendarGroups: CalendarGroupWithCalendars[];
}

interface OfflineTimelineStore {
  version: number;
  snapshots: Record<string, OfflineTimelineSnapshot>;
}

interface OfflineTimelineUpdate {
  events?: Event[];
  calendars?: Calendar[];
  calendarGroups?: CalendarGroupWithCalendars[];
}

const STORAGE_KEY = 'primecal_mobile_offline_timeline_v1';
const STORE_VERSION = 1;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 1500;
const MAX_CALENDARS = 256;
const MAX_GROUPS = 128;
const MAX_STORED_USERS = 5;

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const asOptionalString = (value: unknown): string | undefined =>
  isNonEmptyString(value) ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const cloneSerializable = <T>(value: T): T | undefined => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
};

const coerceIsoTimestamp = (value: unknown, fallback: string): string =>
  isNonEmptyString(value) ? value : fallback;

const sanitizeEvent = (input: Event): Event | null => {
  const id = asNumber(input.id);
  const title = asOptionalString(input.title);
  const startDate = asOptionalString(input.startDate);
  if (!id || !title || !startDate) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const calendarId =
    asNumber(input.calendarId) ??
    asNumber(input.calendar?.id);
  const calendar =
    input.calendar && asNumber(input.calendar.id)
      ? {
          id: Number(input.calendar.id),
          name: asOptionalString(input.calendar.name) ?? 'Calendar',
          description: asOptionalString(input.calendar.description),
          color: asOptionalString(input.calendar.color) ?? '#64748b',
          visibility: asOptionalString(input.calendar.visibility) ?? 'private',
          isActive: asBoolean(input.calendar.isActive, true),
          createdAt: coerceIsoTimestamp(
            input.calendar.createdAt,
            coerceIsoTimestamp(input.createdAt, nowIso),
          ),
          updatedAt: coerceIsoTimestamp(
            input.calendar.updatedAt,
            coerceIsoTimestamp(input.updatedAt, nowIso),
          ),
          ownerId:
            asNumber(input.calendar.ownerId) ??
            asNumber(input.createdById) ??
            0,
          rank: asNumber(input.calendar.rank),
        }
      : undefined;

  return {
    id: Number(id),
    title,
    startDate,
    startTime: asOptionalString(input.startTime),
    endDate: asOptionalString(input.endDate),
    endTime: asOptionalString(input.endTime),
    isAllDay: asBoolean(input.isAllDay),
    color: asOptionalString(input.color),
    icon: asOptionalString(input.icon),
    status: asOptionalString(input.status),
    recurrenceType: asOptionalString(input.recurrenceType),
    recurrenceRule:
      input.recurrenceRule && typeof input.recurrenceRule === 'object'
        ? cloneSerializable(input.recurrenceRule)
        : undefined,
    createdAt: coerceIsoTimestamp(input.createdAt, nowIso),
    updatedAt: coerceIsoTimestamp(input.updatedAt, nowIso),
    parentEventId: asNumber(input.parentEventId),
    recurrenceId: asOptionalString(input.recurrenceId),
    isRecurring: typeof input.isRecurring === 'boolean' ? input.isRecurring : undefined,
    calendar,
    calendarId: calendarId ? Number(calendarId) : undefined,
    createdById: asNumber(input.createdById),
  };
};

const sanitizeCalendar = (input: Calendar): Calendar | null => {
  const id = asNumber(input.id);
  const name = asOptionalString(input.name);
  if (!id || !name) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const ownerId =
    asNumber(input.owner?.id) ??
    asNumber(input.ownerId) ??
    0;

  return {
    id: Number(id),
    name,
    description: asOptionalString(input.description),
    color: asOptionalString(input.color) ?? '#64748b',
    icon: asOptionalString(input.icon),
    visibility: asOptionalString(input.visibility) as Calendar['visibility'] ?? 'private',
    isActive: asBoolean(input.isActive, true),
    isReservationCalendar: asBoolean(input.isReservationCalendar),
    isTasksCalendar: asBoolean(input.isTasksCalendar),
    rank: asNumber(input.rank),
    groupId: asNumber(input.groupId) ?? null,
    group:
      input.group && asNumber(input.group.id)
        ? {
            id: Number(input.group.id),
            name: asOptionalString(input.group.name) ?? 'Group',
            isVisible: asBoolean(input.group.isVisible, true),
            ownerId: asNumber(input.group.ownerId),
          }
        : null,
    owner: {
      id: Number(ownerId),
      username: asOptionalString(input.owner?.username) ?? '',
      email: '',
    },
    ownerId: Number(ownerId),
    createdAt: coerceIsoTimestamp(input.createdAt, nowIso),
    updatedAt: coerceIsoTimestamp(input.updatedAt, nowIso),
  };
};

const sanitizeCalendarGroup = (
  input: CalendarGroupWithCalendars,
): CalendarGroupWithCalendars | null => {
  const id = asNumber(input.id);
  const name = asOptionalString(input.name);
  if (!id || !name) {
    return null;
  }

  const calendars = Array.isArray(input.calendars)
    ? input.calendars
        .map((calendar) => {
          const calendarId = asNumber(calendar.id);
          if (!calendarId) {
            return null;
          }
          return {
            id: Number(calendarId),
            name: asOptionalString(calendar.name),
            color: asOptionalString(calendar.color),
            groupId: asNumber(calendar.groupId) ?? null,
          };
        })
        .filter((calendar): calendar is NonNullable<typeof calendar> => calendar !== null)
    : [];

  return {
    id: Number(id),
    name,
    isVisible: asBoolean(input.isVisible, true),
    ownerId: asNumber(input.ownerId) ?? 0,
    calendars,
  };
};

const sanitizeEvents = (events: Event[]): Event[] =>
  events
    .map((event) => sanitizeEvent(event))
    .filter((event): event is Event => event !== null)
    .slice(0, MAX_EVENTS);

const sanitizeCalendars = (calendars: Calendar[]): Calendar[] =>
  calendars
    .map((calendar) => sanitizeCalendar(calendar))
    .filter((calendar): calendar is Calendar => calendar !== null)
    .slice(0, MAX_CALENDARS);

const sanitizeCalendarGroups = (
  groups: CalendarGroupWithCalendars[],
): CalendarGroupWithCalendars[] =>
  groups
    .map((group) => sanitizeCalendarGroup(group))
    .filter((group): group is CalendarGroupWithCalendars => group !== null)
    .slice(0, MAX_GROUPS);

const sanitizeSnapshot = (value: unknown): OfflineTimelineSnapshot | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as Partial<OfflineTimelineSnapshot>;
  const cachedAt = asNumber(candidate.cachedAt);
  if (!cachedAt) {
    return null;
  }

  const events = Array.isArray(candidate.events)
    ? sanitizeEvents(candidate.events as Event[])
    : [];
  const calendars = Array.isArray(candidate.calendars)
    ? sanitizeCalendars(candidate.calendars as Calendar[])
    : [];
  const calendarGroups = Array.isArray(candidate.calendarGroups)
    ? sanitizeCalendarGroups(candidate.calendarGroups as CalendarGroupWithCalendars[])
    : [];

  return {
    cachedAt: Number(cachedAt),
    events,
    calendars,
    calendarGroups,
  };
};

const createEmptyStore = (): OfflineTimelineStore => ({
  version: STORE_VERSION,
  snapshots: {},
});

const readStore = (): OfflineTimelineStore => {
  if (!isStorageAvailable()) {
    return createEmptyStore();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyStore();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OfflineTimelineStore>;
    const snapshotsSource =
      parsed && typeof parsed === 'object' && parsed.snapshots
        ? parsed.snapshots
        : {};

    const now = Date.now();
    const snapshots = Object.entries(snapshotsSource as Record<string, unknown>)
      .reduce<Record<string, OfflineTimelineSnapshot>>((acc, [key, value]) => {
        const sanitized = sanitizeSnapshot(value);
        if (!sanitized) {
          return acc;
        }
        if (now - sanitized.cachedAt > RETENTION_MS) {
          return acc;
        }
        acc[key] = sanitized;
        return acc;
      }, {});

    return {
      version: STORE_VERSION,
      snapshots,
    };
  } catch (error) {
    clientLogger.warn('offline-cache', 'failed to parse offline timeline cache', error);
    return createEmptyStore();
  }
};

const persistStore = (store: OfflineTimelineStore): void => {
  if (!isStorageAvailable()) {
    return;
  }

  const snapshotKeys = Object.keys(store.snapshots);
  if (snapshotKeys.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const trimmedEntries = snapshotKeys
    .map((key) => ({ key, snapshot: store.snapshots[key] }))
    .sort((a, b) => b.snapshot.cachedAt - a.snapshot.cachedAt)
    .slice(0, MAX_STORED_USERS);

  const trimmedSnapshots = trimmedEntries.reduce<Record<string, OfflineTimelineSnapshot>>(
    (acc, entry) => {
      acc[entry.key] = entry.snapshot;
      return acc;
    },
    {},
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORE_VERSION,
      snapshots: trimmedSnapshots,
    } satisfies OfflineTimelineStore),
  );
};

export const buildOfflineTimelineUserKey = (
  user: OfflineCacheUserIdentity | null | undefined,
): string | null => {
  if (!user) {
    return null;
  }

  const id = asNumber(user.id);
  if (id && id > 0) {
    return `id:${Math.trunc(id)}`;
  }

  const username = asOptionalString(user.username)?.toLowerCase();
  if (username) {
    return `username:${username}`;
  }

  const email = asOptionalString(user.email)?.toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  return null;
};

export const isNavigatorOffline = (): boolean =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

export const isOfflineNetworkError = (error: unknown): boolean => {
  if (isNavigatorOffline()) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return /failed to fetch|networkerror|load failed|network request failed/i.test(
    message,
  );
};

export const getOfflineTimelineSnapshot = (
  user: OfflineCacheUserIdentity | null | undefined,
): OfflineTimelineSnapshot | null => {
  const userKey = buildOfflineTimelineUserKey(user);
  if (!userKey) {
    return null;
  }

  const store = readStore();
  return store.snapshots[userKey] ?? null;
};

export const hasOfflineTimelineSnapshot = (
  user: OfflineCacheUserIdentity | null | undefined,
): boolean => {
  return getOfflineTimelineSnapshot(user) !== null;
};

export const upsertOfflineTimelineSnapshot = (
  user: OfflineCacheUserIdentity | null | undefined,
  update: OfflineTimelineUpdate,
): void => {
  const userKey = buildOfflineTimelineUserKey(user);
  if (!userKey || !isStorageAvailable()) {
    return;
  }

  const store = readStore();
  const existing = store.snapshots[userKey];
  const nextSnapshot: OfflineTimelineSnapshot = {
    cachedAt: Date.now(),
    events:
      update.events !== undefined
        ? sanitizeEvents(update.events)
        : existing?.events ?? [],
    calendars:
      update.calendars !== undefined
        ? sanitizeCalendars(update.calendars)
        : existing?.calendars ?? [],
    calendarGroups:
      update.calendarGroups !== undefined
        ? sanitizeCalendarGroups(update.calendarGroups)
        : existing?.calendarGroups ?? [],
  };

  store.snapshots[userKey] = nextSnapshot;
  persistStore(store);
};

export const clearOfflineTimelineSnapshot = (
  user: OfflineCacheUserIdentity | null | undefined,
): void => {
  const userKey = buildOfflineTimelineUserKey(user);
  if (!userKey || !isStorageAvailable()) {
    return;
  }

  const store = readStore();
  if (!store.snapshots[userKey]) {
    return;
  }

  delete store.snapshots[userKey];
  persistStore(store);
};

export const clearOfflineTimelineSnapshots = (): void => {
  if (!isStorageAvailable()) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
};
