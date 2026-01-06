import type { Event, CreateEventRequest, UpdateEventRequest, RecurrencePattern } from '../types/Event';
import { RecurrenceType, RecurrenceEndType } from '../types/Event';
import type {
  EventComment,
  EventCommentsResponse,
  CreateEventCommentRequest,
  UpdateEventCommentRequest,
} from '../types/EventComment';
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
import type { WeekDay } from '../components/RecurrenceSelector';
import type {
  NotificationMessage,
  NotificationThreadSummary,
  NotificationPreference,
  NotificationFilter,
  NotificationCatalog,
  NotificationChannel,
  NotificationScopeMute,
  NotificationScopeOption,
} from '../types/Notification';
import type {
  Task,
  TaskLabel,
  TaskListResponse,
  TaskPriority,
  TaskStatus,
  TaskQueryParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTaskLabelRequest,
} from '../types/Task';

export interface CreateRecurringEventRequest extends CreateEventRequest {
  recurrence: RecurrencePattern;
}

export interface UpdateRecurringEventRequest extends UpdateEventRequest {
  recurrence?: RecurrencePattern;
  updateScope: 'this' | 'future' | 'all';
}

// Map frontend RecurrenceType to backend format (values are already lowercase)
const mapRecurrenceType = (type: RecurrenceType): string => {
  return type; // Direct mapping since enum values match backend expectations
};

// Map frontend RecurrencePattern to backend recurrenceRule format
const mapRecurrenceRule = (pattern: RecurrencePattern): any => {
  if (pattern.type === RecurrenceType.NONE) {
    return null;
  }

  const rule: any = {
    interval: pattern.interval || 1
  };

  // Add end condition
  if (pattern.endType === RecurrenceEndType.COUNT && pattern.count) {
    rule.count = pattern.count;
  } else if (pattern.endType === RecurrenceEndType.DATE && pattern.endDate) {
    rule.until = pattern.endDate;
  }

  // Add days of week for weekly recurrence
  if (pattern.type === RecurrenceType.WEEKLY && pattern.daysOfWeek) {
    rule.daysOfWeek = pattern.daysOfWeek;
  }

  // Add day of month for monthly recurrence
  if (pattern.type === RecurrenceType.MONTHLY && pattern.dayOfMonth) {
    rule.dayOfMonth = pattern.dayOfMonth;
  }

  // Add month of year for yearly recurrence
  if (pattern.type === RecurrenceType.YEARLY && pattern.monthOfYear) {
    rule.monthOfYear = pattern.monthOfYear;
  }

  return rule;
};

// Import centralized API configuration
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from './authErrorHandler';
import { sessionManager } from './sessionManager';

class ApiService {
  /**
   * Secure fetch wrapper that handles auth errors automatically
   * Use this for all API calls to ensure consistent security handling
   */
  private async secureApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return secureFetch(url, options);
  }

  private buildTaskQuery(params: TaskQueryParams = {}): string {
    const searchParams = new URLSearchParams();
    if (params.status) {
      searchParams.append('status', params.status);
    }
    if (params.priority) {
      searchParams.append('priority', params.priority);
    }
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.dueFrom) {
      searchParams.append('dueFrom', params.dueFrom);
    }
    if (params.dueTo) {
      searchParams.append('dueTo', params.dueTo);
    }
    if (params.labelIds?.length) {
      const normalizedLabelIds = Array.from(
        new Set(
          (params.labelIds as Array<string | number>).flatMap((raw) =>
            String(raw)
              .split(':')
              .map((part) => Number(part))
              .filter((num) => Number.isFinite(num) && num >= 0),
          ),
        ),
      );
      normalizedLabelIds.forEach((id) =>
        searchParams.append('labelIds', String(id)),
      );
    }
    if (params.sortBy) {
      searchParams.append('sortBy', params.sortBy);
    }
    if (params.sortDirection) {
      searchParams.append('sortDirection', params.sortDirection);
    }
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.limit) {
      searchParams.append('limit', String(params.limit));
    }
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  async getAllEvents(): Promise<Event[]> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events`);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    const events = await response.json();
    return events; // Return events as-is since they already have the correct format
  }

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create event');
    }

    return await response.json();
  }

  // Create event with recurrence pattern mapped to backend format
  async createEventWithRecurrence(eventData: CreateEventRequest, recurrence: RecurrencePattern): Promise<Event> {
    const recurringEventData = {
      ...eventData,
      recurrence: {
        type: mapRecurrenceType(recurrence.type),
        interval: recurrence.interval || 1,
        daysOfWeek: recurrence.daysOfWeek,
        dayOfMonth: recurrence.dayOfMonth,
        monthOfYear: recurrence.monthOfYear,
        endType: recurrence.endType || RecurrenceEndType.NEVER,
        count: recurrence.count,
        endDate: recurrence.endDate,
        timezone: recurrence.timezone
      }
    };

    const response = await this.secureApiFetch(`${BASE_URL}/api/events/recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recurringEventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to create recurring events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create recurring event');
    }

    const events = await response.json();
    return events[0]; // Return the parent event
  }

  async updateEvent(eventId: number, eventData: UpdateEventRequest): Promise<Event> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
    }

    return await response.json();
  }

  async deleteEvent(eventId: number, scope: 'this' | 'future' | 'all' = 'this'): Promise<void> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events/${eventId}?scope=${scope}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to delete events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete event');
    }
  }

  // Event comments

  async getEventComments(eventId: number): Promise<EventCommentsResponse> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events/${eventId}/comments`);
    if (!response.ok) {
      throw new Error('Failed to load comments for event');
    }
    return (await response.json()) as EventCommentsResponse;
  }

  async addEventComment(
    eventId: number,
    payload: CreateEventCommentRequest,
  ): Promise<EventComment> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to add comment');
    }

    return (await response.json()) as EventComment;
  }

  async replyToEventComment(
    eventId: number,
    parentCommentId: number,
    payload: CreateEventCommentRequest,
  ): Promise<EventComment> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/events/${eventId}/comments/${parentCommentId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reply to comment');
    }

    return (await response.json()) as EventComment;
  }

  async updateEventComment(
    eventId: number,
    commentId: number,
    payload: UpdateEventCommentRequest,
  ): Promise<EventComment> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/events/${eventId}/comments/${commentId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update comment');
    }

    return (await response.json()) as EventComment;
  }

  async flagEventComment(
    eventId: number,
    commentId: number,
    isFlagged: boolean,
  ): Promise<EventComment> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/events/${eventId}/comments/${commentId}/flag`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update flag on comment');
    }

    return (await response.json()) as EventComment;
  }

  async trackEventOpen(eventId: number, note?: string): Promise<EventComment | null> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/events/${eventId}/comments/track-open`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note ? { note } : {}),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to track event open');
    }

    if (response.status === 204) {
      return null;
    }

    // When a recent tracking entry exists, the backend may return null
    const bodyText = await response.text();
    if (!bodyText) return null;
    try {
      return JSON.parse(bodyText) as EventComment;
    } catch {
      return null;
    }
  }

  // Recurring event methods

  async updateRecurringEvent(eventId: number, eventData: UpdateRecurringEventRequest): Promise<Event[]> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/events/${eventId}/recurring`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update recurring events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update recurring event');
    }

    return await response.json();
  }

  // Calendar methods
  async getAllCalendars(): Promise<Calendar[]> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendars`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view calendars.');
      }
      throw new Error('Failed to fetch calendars');
    }
    return await response.json();
  }

  async createCalendar(calendarData: CreateCalendarRequest): Promise<Calendar> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to create calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create calendar');
    }

    return await response.json();
  }

  async updateCalendar(calendarId: number, calendarData: UpdateCalendarRequest): Promise<Calendar> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendars/${calendarId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update calendar');
    }

    return await response.json();
  }

  async deleteCalendar(calendarId: number): Promise<void> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendars/${calendarId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to delete calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete calendar');
    }
  }

  async getCalendarGroups(): Promise<CalendarGroupWithCalendars[]> {
    const tryFetch = async (path: string) => {
      const response = await this.secureApiFetch(`${BASE_URL}${path}`);
      if (!response.ok) {
        return { ok: false, response };
      }
      return { ok: true, data: (await response.json()) as CalendarGroupWithCalendars[] };
    };

    const primary = await tryFetch('/api/calendar-groups');
    if (primary.ok) return primary.data;

    if (primary.response && primary.response.status === 404) {
      const fallback = await tryFetch('/api/calendars/groups');
      if (fallback.ok) return fallback.data;
    }

    if (primary.response?.status === 401) {
      throw new Error('Authentication required. Please log in to view calendar groups.');
    }

    const errorData = await primary.response?.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Failed to fetch calendar groups');
  }

  async createCalendarGroup(
    payload: CreateCalendarGroupRequest,
  ): Promise<CalendarGroup> {
    const tryPost = async (path: string) => {
      const response = await this.secureApiFetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return { ok: false, response };
      }
      return { ok: true, data: (await response.json()) as CalendarGroup };
    };

    const primary = await tryPost('/api/calendar-groups');
    if (primary.ok) return primary.data;

    if (primary.response?.status === 404) {
      const fallback = await tryPost('/api/calendars/groups');
      if (fallback.ok) return fallback.data;
    }

    if (primary.response?.status === 401) {
      throw new Error('Authentication required. Please log in to create calendar groups.');
    }

    const errorData = await primary.response?.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Failed to create calendar group');
  }

  async updateCalendarGroup(
    groupId: number,
    payload: UpdateCalendarGroupRequest,
  ): Promise<CalendarGroup> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update calendar groups.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update calendar group');
    }

    return (await response.json()) as CalendarGroup;
  }

  async deleteCalendarGroup(groupId: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to delete calendar groups.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete calendar group');
    }
  }

  async assignCalendarsToGroup(
    groupId: number,
    payload: AssignCalendarsToGroupRequest,
  ): Promise<CalendarGroupWithCalendars> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}/calendars`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to assign calendars.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to assign calendars to group');
    }

    return (await response.json()) as CalendarGroupWithCalendars;
  }

  async unassignCalendarsFromGroup(
    groupId: number,
    payload: AssignCalendarsToGroupRequest,
  ): Promise<CalendarGroupWithCalendars> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}/calendars/unassign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update calendar groups.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to unassign calendars from group');
    }

    return (await response.json()) as CalendarGroupWithCalendars;
  }

  async shareCalendarGroup(
    groupId: number,
    payload: ShareCalendarGroupRequest,
  ): Promise<{ sharedCalendarIds: number[] }> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}/share`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to share calendar groups.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to share calendar group');
    }

    return (await response.json()) as { sharedCalendarIds: number[] };
  }

  async unshareCalendarGroup(
    groupId: number,
    userIds: number[],
  ): Promise<{ unsharedCalendarIds: number[] }> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/calendar-groups/${groupId}/share`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update calendar groups.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to unshare calendar group');
    }

    return (await response.json()) as { unsharedCalendarIds: number[] };
  }

  // Authentication methods
  async login(usernameOrEmail: string, password: string): Promise<{ token: string, user: any }> {
    const response = await secureFetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameOrEmail, password }),
      auth: false,
      csrf: true,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    sessionManager.setSessionFromResponse(data);
    return { token: data.access_token, user: data.user };
  }

  async register(userData: { username: string, email: string, password: string, firstName?: string, lastName?: string }): Promise<{ token: string, user: any }> {
    const response = await secureFetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      auth: false,
      csrf: true,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    sessionManager.setSessionFromResponse(data);
    return { token: data.access_token, user: data.user };
  }

  async logout(): Promise<void> {
    await secureFetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    sessionManager.clearSession();
  }

  isAuthenticated(): boolean {
    return sessionManager.hasActiveSession();
  }

  // OAuth methods
  initiateGoogleLogin(): void {
    window.location.href = `${BASE_URL}/api/auth/google`;
  }

  initiateMicrosoftLogin(): void {
    window.location.href = `${BASE_URL}/api/auth/microsoft`;
  }

  // User Profile methods
  async getUserProfile(): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/user/profile`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view profile.');
      }
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  }

  async updateUserProfile(profileData: any): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update profile.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return await response.json();
  }

  async updateUserTheme(themeColor: string): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/user/theme`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ themeColor }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update theme.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update theme');
    }

    return await response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/user/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to change password');
    }

    return await response.json();
  }

  // Generic HTTP methods
  async get(endpoint: string): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api${endpoint}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch ${endpoint}`);
    }

    return await response.json();
  }

  async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to post to ${endpoint}`);
    }

    return await response.json();
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to patch ${endpoint}`);
    }

    return await response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      if (response.status !== 204) { // 204 No Content is ok for deletes
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${endpoint}`);
      }
    }

    return response.status === 204 ? null : await response.json();
  }

  // Calendar Sync methods
  async getCalendarSyncStatus(): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendar-sync/status`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view sync status.');
      }
      // Return default status if sync not configured yet
      if (response.status === 404) {
        return {
          providers: [
            { provider: 'google', isConnected: false, calendars: [], syncedCalendars: [] },
            { provider: 'microsoft', isConnected: false, calendars: [], syncedCalendars: [] }
          ]
        };
      }
      throw new Error('Failed to fetch sync status');
    }

    return await response.json();
  }

  async getCalendarAuthUrl(provider: 'google' | 'microsoft'): Promise<string> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendar-sync/auth/${provider}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to connect calendar.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get authorization URL');
    }

    const data = await response.json();
    return data.authUrl;
  }

  async syncCalendars(syncData: {
    provider: string,
    calendars: Array<{
      externalId: string,
      localName: string,
      triggerAutomationRules?: boolean,
      selectedRuleIds?: number[]
    }>
  }): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendar-sync/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to sync calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync calendars');
    }

    return await response.json();
  }

  async disconnectCalendarProvider(provider?: 'google' | 'microsoft'): Promise<void> {
    const url = provider
      ? `${BASE_URL}/api/calendar-sync/disconnect/${provider}`
      : `${BASE_URL}/api/calendar-sync/disconnect`;

    const response = await this.secureApiFetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to disconnect provider.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to disconnect provider');
    }
  }

  async forceCalendarSync(): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/calendar-sync/force`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to force sync.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to force sync');
    }

    return await response.json();
  }

  // ---------------------- Notifications APIs ----------------------

  async getNotifications(params?: {
    unreadOnly?: boolean;
    archived?: boolean;
    threadId?: number;
    afterCursor?: string;
  }): Promise<NotificationMessage[]> {
    const query = new URLSearchParams();
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    if (params?.archived !== undefined)
      query.append('archived', params.archived ? 'true' : 'false');
    if (params?.threadId) query.append('threadId', String(params.threadId));
    if (params?.afterCursor) query.append('afterCursor', params.afterCursor);

    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications${query.toString() ? `?${query.toString()}` : ''}`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notifications');
    }
    return (await response.json()) as NotificationMessage[];
  }

  async markNotificationRead(id: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/${id}/read`,
      { method: 'PATCH' },
    );
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markNotificationUnread(id: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/${id}/unread`,
      { method: 'PATCH' },
    );
    if (!response.ok) {
      throw new Error('Failed to mark notification as unread');
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/read-all`,
      { method: 'POST' },
    );
    if (!response.ok) {
      throw new Error('Failed to mark all notifications read');
    }
  }

  async getNotificationThreads(): Promise<NotificationThreadSummary[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/threads`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification threads');
    }
    return (await response.json()) as NotificationThreadSummary[];
  }

  async toggleThreadMute(id: number, mute: boolean): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/threads/${id}/${mute ? 'mute' : 'unmute'}`,
      { method: 'PATCH' },
    );
    if (!response.ok) {
      throw new Error('Failed to update thread mute state');
    }
  }

  async toggleThreadArchive(id: number, archive: boolean): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/threads/${id}/${archive ? 'archive' : 'unarchive'}`,
      { method: 'PATCH' },
    );
    if (!response.ok) {
      throw new Error('Failed to update thread archive state');
    }
  }

  async getOrganisations(): Promise<Array<{ id: number; name?: string }>> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/organisations`,
    );
    if (!response.ok) {
      throw new Error('Unable to load organisations');
    }
    return (await response.json()) as Array<{ id: number; name?: string }>;
  }

  async getReservations(resourceId?: string | number): Promise<any[]> {
    const query = resourceId !== undefined
      ? `?resourceId=${encodeURIComponent(String(resourceId))}`
      : '';
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/reservations${query}`,
    );
    if (!response.ok) {
      throw new Error('Unable to load reservations');
    }
    return await response.json();
  }

  async getNotificationPreferences(): Promise<NotificationPreference[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/preferences`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification preferences');
    }
    return (await response.json()) as NotificationPreference[];
  }

  async updateNotificationPreferences(preferences: NotificationPreference[]): Promise<NotificationPreference[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/preferences`,
      {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to update notification preferences');
    }
    return (await response.json()) as NotificationPreference[];
  }

  async registerNotificationDevice(platform: 'web' | 'ios' | 'android', token: string, userAgent?: string): Promise<number> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/notifications/devices`, {
      method: 'POST',
      body: JSON.stringify({ platform, token, userAgent }),
    });
    if (!response.ok) {
      throw new Error('Failed to register device');
    }
    const body = await response.json();
    return body.id as number;
  }

  async removeNotificationDevice(deviceId: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/devices/${deviceId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      throw new Error('Failed to remove device');
    }
  }

  async getNotificationCatalog(): Promise<NotificationCatalog> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/catalog`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification catalog');
    }
    return (await response.json()) as NotificationCatalog;
  }

  async getNotificationFilters(): Promise<NotificationFilter[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/filters`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification filters');
    }
    return (await response.json()) as NotificationFilter[];
  }

  async saveNotificationFilter(filter: NotificationFilter): Promise<NotificationFilter> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/filters`,
      {
        method: 'POST',
        body: JSON.stringify(filter),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to save notification filter');
    }
    return (await response.json()) as NotificationFilter;
  }

  async reorderNotificationFilters(filters: NotificationFilter[]): Promise<NotificationFilter[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/filters`,
      {
        method: 'PATCH',
        body: JSON.stringify({ rules: filters }),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to reorder notification filters');
    }
    return (await response.json()) as NotificationFilter[];
  }

  async deleteNotificationFilter(filterId: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/filters/${filterId}`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      throw new Error('Failed to delete notification filter');
    }
  }

  /**
   * Legacy aliases for backward compatibility with existing components
   * still referencing the older "rules" terminology.
   */
  async getNotificationRules(): Promise<NotificationFilter[]> {
    return this.getNotificationFilters();
  }

  async saveNotificationRule(rule: NotificationFilter): Promise<NotificationFilter> {
    return this.saveNotificationFilter(rule);
  }

  async reorderNotificationRules(rules: NotificationFilter[]): Promise<NotificationFilter[]> {
    return this.reorderNotificationFilters(rules);
  }

  async deleteNotificationRule(ruleId: number): Promise<void> {
    return this.deleteNotificationFilter(ruleId);
  }

  async getNotificationScopeOptions(
    types?: string | string[],
  ): Promise<Record<string, NotificationScopeOption[]>> {
    let query = '';
    if (typeof types === 'string' && types.trim().length > 0) {
      query = `?type=${encodeURIComponent(types.trim())}`;
    } else if (Array.isArray(types) && types.length > 0) {
      const filtered = types
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (filtered.length > 0) {
        query = `?type=${encodeURIComponent(filtered.join(','))}`;
      }
    }

    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/scopes${query}`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification scope options');
    }
    const result = await response.json();
    return result as Record<string, NotificationScopeOption[]>;
  }

  async getNotificationScopeMutes(): Promise<NotificationScopeMute[]> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/mutes`,
    );
    if (!response.ok) {
      throw new Error('Unable to load notification mutes');
    }
    return (await response.json())?.map((mute: any) => ({
      scopeType: mute.scopeType,
      scopeId: String(mute.scopeId),
      isMuted: Boolean(mute.isMuted),
      createdAt: mute.createdAt,
      updatedAt: mute.updatedAt,
    })) as NotificationScopeMute[];
  }

  async setNotificationScopeMute(
    scopeType: string,
    scopeId: string,
    isMuted: boolean,
  ): Promise<NotificationScopeMute | null> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/mutes`,
      {
        method: 'POST',
        body: JSON.stringify({ scopeType, scopeId, isMuted }),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to update notification mute');
    }
    const body = await response.json();
    if (!body?.mute) {
      return null;
    }
    return {
      scopeType: body.mute.scopeType,
      scopeId: String(body.mute.scopeId),
      isMuted: Boolean(body.mute.isMuted),
      createdAt: body.mute.createdAt,
      updatedAt: body.mute.updatedAt,
    };
  }

  async removeNotificationScopeMute(
    scopeType: string,
    scopeId: string,
  ): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/notifications/mutes/${scopeType}/${encodeURIComponent(scopeId)}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      throw new Error('Failed to remove notification mute');
    }
  }

  async getNotificationChannelsEnabled(): Promise<Record<NotificationChannel, boolean>> {
    const prefs = await this.getNotificationPreferences();
    const channels = new Set<NotificationChannel>();
    prefs.forEach((pref) => {
      Object.entries(pref.channels).forEach(([channel, enabled]) => {
        if (enabled) {
          channels.add(channel as NotificationChannel);
        }
      });
    });
    const enabled: Record<NotificationChannel, boolean> = {
      inapp: false,
      email: false,
      webpush: false,
      mobilepush: false,
      slack: false,
      teams: false,
    };
    channels.forEach((channel) => {
      if (enabled[channel] !== undefined) {
        enabled[channel] = true;
      }
    });
    return enabled;
  }

  async getAdminNotificationConfig(): Promise<any> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/admin/notifications/config`);
    if (!response.ok) {
      throw new Error('Unable to load notification admin config');
    }
    return await response.json();
  }

  async updateAdminNotificationConfig(key: string, value: string | boolean | null): Promise<any> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/admin/notifications/config/${key}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to update notification admin config');
    }
    return await response.json();
  }

  async getTasks(params: TaskQueryParams = {}): Promise<TaskListResponse> {
    const query = this.buildTaskQuery(params);
    const response = await this.secureApiFetch(`${BASE_URL}/api/tasks${query}`);
    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }
    return (await response.json()) as TaskListResponse;
  }

  async createTask(payload: CreateTaskRequest): Promise<Task> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create task');
    }
    return (await response.json()) as Task;
  }

  async updateTask(taskId: number, payload: UpdateTaskRequest): Promise<Task> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update task');
    }
    return (await response.json()) as Task;
  }

  async deleteTask(taskId: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/tasks/${taskId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete task');
    }
  }

  async getTaskLabels(): Promise<TaskLabel[]> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/task-labels`);
    if (!response.ok) {
      throw new Error('Failed to load task labels');
    }
    return (await response.json()) as TaskLabel[];
  }

  async createTaskLabel(
    payload: CreateTaskLabelRequest,
  ): Promise<TaskLabel> {
    const response = await this.secureApiFetch(`${BASE_URL}/api/task-labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create label');
    }
    return (await response.json()) as TaskLabel;
  }

  async updateTaskLabel(
    labelId: number,
    payload: CreateTaskLabelRequest,
  ): Promise<TaskLabel> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/task-labels/${labelId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update label');
    }
    return (await response.json()) as TaskLabel;
  }

  async deleteTaskLabel(labelId: number): Promise<void> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/task-labels/${labelId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete label');
    }
  }

  async addTaskLabels(
    taskId: number,
    payload: { labelIds?: number[]; inlineLabels?: CreateTaskLabelRequest[] },
  ): Promise<Task> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/tasks/${taskId}/labels`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update labels');
    }
    return (await response.json()) as Task;
  }

  async removeTaskLabel(taskId: number, labelId: number): Promise<Task> {
    const response = await this.secureApiFetch(
      `${BASE_URL}/api/tasks/${taskId}/labels/${labelId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to remove label');
    }
    return (await response.json()) as Task;
  }
}

export const apiService = new ApiService();
