import type { Booking, Calendar, Event, Organization } from './domain';

export interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export interface UseCalendarDataResult {
  events: AsyncState<Event[]>;
  calendars: AsyncState<Calendar[]>;
  organizations: AsyncState<Organization[]>;
  reservations: AsyncState<Booking[]>;
}
