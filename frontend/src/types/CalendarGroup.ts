import { SharePermission } from './Calendar';

export interface CalendarGroup {
  id: number;
  name: string;
  isVisible: boolean;
  ownerId: number;
}

export interface CalendarGroupWithCalendars extends CalendarGroup {
  calendars: Array<{
    id: number;
    name?: string;
    color?: string;
    groupId?: number | null;
  }>;
}

export interface CreateCalendarGroupRequest {
  name: string;
  isVisible?: boolean;
}

export interface UpdateCalendarGroupRequest {
  name?: string;
  isVisible?: boolean;
}

export interface AssignCalendarsToGroupRequest {
  calendarIds: number[];
}

export interface ShareCalendarGroupRequest {
  userIds: number[];
  permission: SharePermission;
}
