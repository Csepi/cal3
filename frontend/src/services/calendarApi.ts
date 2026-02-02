import { apiService } from './api';
import { http } from '../lib/http';
import type {
  Calendar,
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from '../types/Calendar';
import type {
  CalendarGroup,
  CalendarGroupWithCalendars,
  CreateCalendarGroupRequest,
  UpdateCalendarGroupRequest,
  AssignCalendarsToGroupRequest,
  ShareCalendarGroupRequest,
} from '../types/CalendarGroup';

export const calendarApi = {
  getCalendars: (): Promise<Calendar[]> => apiService.getAllCalendars(),
  createCalendar: (payload: CreateCalendarRequest): Promise<Calendar> =>
    apiService.createCalendar(payload),
  updateCalendar: (calendarId: number, payload: UpdateCalendarRequest): Promise<Calendar> =>
    apiService.updateCalendar(calendarId, payload),
  deleteCalendar: (calendarId: number): Promise<void> => apiService.deleteCalendar(calendarId),
  getCalendarGroups: (): Promise<CalendarGroupWithCalendars[]> => apiService.getCalendarGroups(),
  createCalendarGroup: (payload: CreateCalendarGroupRequest): Promise<CalendarGroup> =>
    apiService.createCalendarGroup(payload),
  updateCalendarGroup: (groupId: number, payload: UpdateCalendarGroupRequest): Promise<CalendarGroup> =>
    apiService.updateCalendarGroup(groupId, payload),
  deleteCalendarGroup: (groupId: number): Promise<void> => apiService.deleteCalendarGroup(groupId),
  assignCalendarsToGroup: (groupId: number, payload: AssignCalendarsToGroupRequest): Promise<CalendarGroupWithCalendars> =>
    apiService.assignCalendarsToGroup(groupId, payload),
  unassignCalendarsFromGroup: (groupId: number, payload: AssignCalendarsToGroupRequest): Promise<CalendarGroupWithCalendars> =>
    apiService.unassignCalendarsFromGroup(groupId, payload),
  shareCalendarGroup: (groupId: number, payload: ShareCalendarGroupRequest): Promise<{ sharedCalendarIds: number[] }> =>
    apiService.shareCalendarGroup(groupId, payload),
  unshareCalendarGroup: (groupId: number, payload: ShareCalendarGroupRequest): Promise<{ unsharedCalendarIds: number[] }> =>
    apiService.unshareCalendarGroup(groupId, payload.userIds),
  getCalendarSyncStatus: () => apiService.getCalendarSyncStatus(),
  getCalendarAuthUrl: (provider: 'google' | 'microsoft') => apiService.getCalendarAuthUrl(provider),
  syncCalendars: (payload: {
    provider: 'google' | 'microsoft';
    calendars: Array<{
      externalId: string;
      localName: string;
      bidirectionalSync?: boolean;
      triggerAutomationRules?: boolean;
      selectedRuleIds?: number[];
    }>;
  }) => apiService.syncCalendars(payload),
  disconnectCalendarProvider: (provider?: 'google' | 'microsoft') => apiService.disconnectCalendarProvider(provider),
  forceCalendarSync: () => apiService.forceCalendarSync(),
  // Phase 5B compatibility aliases
  syncCalendar: (payload: {
    provider: 'google' | 'microsoft';
    calendars: Array<{
      externalId: string;
      localName: string;
      bidirectionalSync?: boolean;
      triggerAutomationRules?: boolean;
      selectedRuleIds?: number[];
    }>;
  }) => http.post<unknown>('/api/calendar-sync/sync', payload),
  getCalendarSettings: () => http.get<unknown>('/api/user/profile'),
  updateCalendarSettings: (settings: Record<string, unknown>) =>
    http.patch<unknown>('/api/user/profile', settings),
} as const;
