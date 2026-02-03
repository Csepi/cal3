import type { Booking, Calendar, Event, Organization, User } from './domain';

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface CalendarState {
  events: Event[];
  calendars: Calendar[];
  selectedCalendarId?: number | null;
}

export interface ReservationsState {
  organizations: Organization[];
  reservations: Booking[];
  selectedOrganizationId?: number | null;
}
