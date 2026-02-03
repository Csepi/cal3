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
  /** Fetch all calendars accessible to the current user. */
  getCalendars: (): Promise<Calendar[]> => apiService.getAllCalendars(),
  /** Create a new calendar. */
  createCalendar: (payload: CreateCalendarRequest): Promise<Calendar> =>
    apiService.createCalendar(payload),
  /** Update calendar metadata and settings. */
  updateCalendar: (calendarId: number, payload: UpdateCalendarRequest): Promise<Calendar> =>
    apiService.updateCalendar(calendarId, payload),
  /** Delete a calendar by id. */
  deleteCalendar: (calendarId: number): Promise<void> => apiService.deleteCalendar(calendarId),
  /** List calendar groups with assigned calendars. */
  getCalendarGroups: (): Promise<CalendarGroupWithCalendars[]> => apiService.getCalendarGroups(),
  /** Create a new calendar group. */
  createCalendarGroup: (payload: CreateCalendarGroupRequest): Promise<CalendarGroup> =>
    apiService.createCalendarGroup(payload),
  /** Update calendar group details. */
  updateCalendarGroup: (groupId: number, payload: UpdateCalendarGroupRequest): Promise<CalendarGroup> =>
    apiService.updateCalendarGroup(groupId, payload),
  /** Remove a calendar group. */
  deleteCalendarGroup: (groupId: number): Promise<void> => apiService.deleteCalendarGroup(groupId),
  /** Assign calendars to a group in one operation. */
  assignCalendarsToGroup: (groupId: number, payload: AssignCalendarsToGroupRequest): Promise<CalendarGroupWithCalendars> =>
    apiService.assignCalendarsToGroup(groupId, payload),
  /** Unassign calendars from a group in one operation. */
  unassignCalendarsFromGroup: (groupId: number, payload: AssignCalendarsToGroupRequest): Promise<CalendarGroupWithCalendars> =>
    apiService.unassignCalendarsFromGroup(groupId, payload),
  /** Share all calendars in a group with target users. */
  shareCalendarGroup: (groupId: number, payload: ShareCalendarGroupRequest): Promise<{ sharedCalendarIds: number[] }> =>
    apiService.shareCalendarGroup(groupId, payload),
  /** Remove previously shared group calendars from target users. */
  unshareCalendarGroup: (groupId: number, payload: ShareCalendarGroupRequest): Promise<{ unsharedCalendarIds: number[] }> =>
    apiService.unshareCalendarGroup(groupId, payload.userIds),
  /** Read current external sync state. */
  getCalendarSyncStatus: () => apiService.getCalendarSyncStatus(),
  /** Get OAuth authorization URL for a provider. */
  getCalendarAuthUrl: (provider: 'google' | 'microsoft') => apiService.getCalendarAuthUrl(provider),
  /** Configure and trigger provider calendar synchronization. */
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
  /** Disconnect a calendar sync provider integration. */
  disconnectCalendarProvider: (provider?: 'google' | 'microsoft') => apiService.disconnectCalendarProvider(provider),
  /** Force an immediate background sync run. */
  forceCalendarSync: () => apiService.forceCalendarSync(),
  // Phase 5B compatibility aliases
  /** Compatibility alias for sync endpoint used by legacy callers. */
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
  /** Compatibility alias for user calendar settings. */
  getCalendarSettings: () => http.get<unknown>('/api/user/profile'),
  /** Compatibility alias for patching user calendar settings. */
  updateCalendarSettings: (settings: Record<string, unknown>) =>
    http.patch<unknown>('/api/user/profile', settings),
} as const;
