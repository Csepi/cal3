import { useQuery } from '@tanstack/react-query';
import type { Calendar } from '../types/Calendar';
import type { CalendarGroupWithCalendars } from '../types/CalendarGroup';
import type { Event } from '../types/Event';
import { eventsApi } from '../services/eventsApi';
import { calendarApi } from '../services/calendarApi';
import { resourcesApi } from '../services/resourcesApi';
import { http } from '../lib/http';
import type { Booking, Organization, ResourceType } from '../types';
import { sessionManager } from '../services/sessionManager';
import { isNativeClient } from '../services/clientPlatform';
import {
  getOfflineTimelineSnapshot,
  isOfflineNetworkError,
  upsertOfflineTimelineSnapshot,
} from '../services/offlineTimelineCache';
import { clientLogger } from '../utils/clientLogger';

export type ReservationRecord = Booking;
export type { Organization };

export const calendarQueryKeys = {
  root: ['calendar'] as const,
  events: ['calendar', 'events'] as const,
  calendars: ['calendar', 'calendars'] as const,
  calendarGroups: ['calendar', 'calendar-groups'] as const,
  orgsAndReservations: ['calendar', 'orgs-reservations'] as const,
};

interface UseCalendarDataOptions {
  offlineMode?: boolean;
}

const resolveOfflineSnapshot = () =>
  getOfflineTimelineSnapshot(sessionManager.snapshotUserMetadata());

const fetchEvents = async (offlineMode: boolean): Promise<Event[]> => {
  if (offlineMode) {
    return resolveOfflineSnapshot()?.events ?? [];
  }

  try {
    const events = await eventsApi.getEvents();
    if (isNativeClient()) {
      upsertOfflineTimelineSnapshot(sessionManager.snapshotUserMetadata(), {
        events,
      });
    }
    return events;
  } catch (error) {
    if (isNativeClient() && isOfflineNetworkError(error)) {
      const snapshot = resolveOfflineSnapshot();
      if (snapshot) {
        clientLogger.warn('calendar-data', 'using offline events snapshot after fetch failure', {
          events: snapshot.events.length,
          cachedAt: new Date(snapshot.cachedAt).toISOString(),
        });
        return snapshot.events;
      }
    }
    throw error;
  }
};

const fetchCalendars = async (offlineMode: boolean): Promise<Calendar[]> => {
  if (offlineMode) {
    return resolveOfflineSnapshot()?.calendars ?? [];
  }

  try {
    const calendars = await calendarApi.getCalendars();
    if (isNativeClient()) {
      upsertOfflineTimelineSnapshot(sessionManager.snapshotUserMetadata(), {
        calendars,
      });
    }
    return calendars;
  } catch (error) {
    if (isNativeClient() && isOfflineNetworkError(error)) {
      const snapshot = resolveOfflineSnapshot();
      if (snapshot) {
        clientLogger.warn('calendar-data', 'using offline calendars snapshot after fetch failure', {
          calendars: snapshot.calendars.length,
          cachedAt: new Date(snapshot.cachedAt).toISOString(),
        });
        return snapshot.calendars;
      }
    }
    throw error;
  }
};

const fetchCalendarGroups = async (
  offlineMode: boolean,
): Promise<CalendarGroupWithCalendars[]> => {
  if (offlineMode) {
    return resolveOfflineSnapshot()?.calendarGroups ?? [];
  }

  try {
    const groups = await calendarApi.getCalendarGroups();
    if (isNativeClient()) {
      upsertOfflineTimelineSnapshot(sessionManager.snapshotUserMetadata(), {
        calendarGroups: groups,
      });
    }
    return groups;
  } catch (error) {
    if (isNativeClient() && isOfflineNetworkError(error)) {
      const snapshot = resolveOfflineSnapshot();
      if (snapshot) {
        clientLogger.warn(
          'calendar-data',
          'using offline calendar group snapshot after fetch failure',
          {
            calendarGroups: snapshot.calendarGroups.length,
            cachedAt: new Date(snapshot.cachedAt).toISOString(),
          },
        );
        return snapshot.calendarGroups;
      }
    }
    console.error('Error loading calendar groups:', error);
    return [];
  }
};

const fetchOrganizationsAndReservations = async (): Promise<{
  organizations: Organization[];
  reservations: ReservationRecord[];
}> => {
  let organizations: Organization[] = [];
  let reservations: ReservationRecord[] = [];

  try {
    const orgsData = await http.get<
      Array<{ id: number; name: string; role?: string; color?: string }>
    >('/api/user-permissions/accessible-organizations');

    const orgsWithResourceTypes = await Promise.all(
      orgsData.map(async (org) => {
        try {
          const resourceTypes = await http.get<ResourceType[]>(
            `/api/resource-types?organisationId=${org.id}`,
          );
          return {
            id: org.id,
            name: org.name,
            role: org.role || 'USER',
            color: org.color || '#000000',
            resourceTypes: resourceTypes || [],
          } as Organization;
        } catch (err) {
          console.error(`Error loading resource types for org ${org.id}:`, err);
          return {
            id: org.id,
            name: org.name,
            role: org.role || 'USER',
            color: org.color || '#000000',
            resourceTypes: [],
          } as Organization;
        }
      }),
    );

    organizations = orgsWithResourceTypes;
    reservations = await resourcesApi.getReservations<ReservationRecord[]>().catch(
      () => [] as ReservationRecord[],
    );
  } catch (err) {
    console.error('Error loading organizations/reservations:', err);
  }

  return { organizations, reservations };
};

export const useCalendarData = ({
  offlineMode = false,
}: UseCalendarDataOptions = {}) => {
  const eventsQuery = useQuery<Event[]>({
    queryKey: calendarQueryKeys.events,
    queryFn: () => fetchEvents(offlineMode),
    refetchInterval: offlineMode ? false : 30000,
    refetchIntervalInBackground: false,
    retry: offlineMode ? 0 : 1,
  });

  const calendarsQuery = useQuery<Calendar[]>({
    queryKey: calendarQueryKeys.calendars,
    queryFn: () => fetchCalendars(offlineMode),
    retry: offlineMode ? 0 : 1,
  });

  const calendarGroupsQuery = useQuery<CalendarGroupWithCalendars[]>({
    queryKey: calendarQueryKeys.calendarGroups,
    queryFn: () => fetchCalendarGroups(offlineMode),
    retry: offlineMode ? 0 : 1,
  });

  const orgsQuery = useQuery<{
    organizations: Organization[];
    reservations: ReservationRecord[];
  }>({
    queryKey: calendarQueryKeys.orgsAndReservations,
    queryFn: () =>
      offlineMode
        ? Promise.resolve({
            organizations: [],
            reservations: [],
          })
        : fetchOrganizationsAndReservations(),
    enabled: !offlineMode,
  });

  const isLoading = eventsQuery.isLoading || calendarsQuery.isLoading;
  const isFetching =
    eventsQuery.isFetching ||
    calendarsQuery.isFetching ||
    calendarGroupsQuery.isFetching ||
    orgsQuery.isFetching;
  const error = eventsQuery.error ?? calendarsQuery.error;

  return {
    eventsQuery,
    calendarsQuery,
    calendarGroupsQuery,
    orgsQuery,
    isLoading,
    isFetching,
    error,
  };
};
