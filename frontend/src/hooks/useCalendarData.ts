import { useQuery } from '@tanstack/react-query';
import type { Calendar } from '../types/Calendar';
import type { CalendarGroupWithCalendars } from '../types/CalendarGroup';
import type { Event } from '../types/Event';
import { apiService } from '../services/api';

export interface ResourceType {
  id: number;
  name: string;
  organisationId: number;
  color: string;
}

export interface Organization {
  id: number;
  name: string;
  role: string;
  color: string;
  resourceTypes: ResourceType[];
}

export const calendarQueryKeys = {
  root: ['calendar'] as const,
  events: ['calendar', 'events'] as const,
  calendars: ['calendar', 'calendars'] as const,
  calendarGroups: ['calendar', 'calendar-groups'] as const,
  orgsAndReservations: ['calendar', 'orgs-reservations'] as const,
};

const fetchCalendarGroups = async (): Promise<CalendarGroupWithCalendars[]> => {
  try {
    return await apiService.getCalendarGroups();
  } catch (error) {
    console.error('Error loading calendar groups:', error);
    return [];
  }
};

const fetchOrganizationsAndReservations = async (): Promise<{
  organizations: Organization[];
  reservations: any[];
}> => {
  let organizations: Organization[] = [];
  let reservations: any[] = [];

  try {
    const orgsData = await apiService.get(
      '/user-permissions/accessible-organizations',
    );

    const orgsWithResourceTypes = await Promise.all(
      orgsData.map(async (org: any) => {
        try {
          const resourceTypes = await apiService.get(
            `/resource-types?organisationId=${org.id}`,
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
    reservations = await apiService.get('/reservations').catch(() => []);
  } catch (err) {
    console.error('Error loading organizations/reservations:', err);
  }

  return { organizations, reservations };
};

export const useCalendarData = () => {
  const eventsQuery = useQuery<Event[]>({
    queryKey: calendarQueryKeys.events,
    queryFn: () => apiService.getAllEvents(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const calendarsQuery = useQuery<Calendar[]>({
    queryKey: calendarQueryKeys.calendars,
    queryFn: () => apiService.getAllCalendars(),
  });

  const calendarGroupsQuery = useQuery<CalendarGroupWithCalendars[]>({
    queryKey: calendarQueryKeys.calendarGroups,
    queryFn: fetchCalendarGroups,
  });

  const orgsQuery = useQuery<{
    organizations: Organization[];
    reservations: any[];
  }>({
    queryKey: calendarQueryKeys.orgsAndReservations,
    queryFn: fetchOrganizationsAndReservations,
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
