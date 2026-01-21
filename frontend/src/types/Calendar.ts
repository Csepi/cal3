export enum CalendarVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

export enum SharePermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export interface Calendar {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  visibility: CalendarVisibility;
  isActive: boolean;
  isReservationCalendar?: boolean;
  isTasksCalendar?: boolean;
  rank?: number;
  groupId?: number | null;
  group?: {
    id: number;
    name: string;
    isVisible: boolean;
    ownerId?: number;
  } | null;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  ownerId?: number;
  sharedWith?: Array<{
    id: number;
    username: string;
    permission: SharePermission;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility?: CalendarVisibility;
  groupId?: number | null;
  rank?: number;
}

export interface UpdateCalendarRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility?: CalendarVisibility;
  groupId?: number | null;
  rank?: number;
}
