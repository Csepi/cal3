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
  visibility: CalendarVisibility;
  isActive: boolean;
  owner: {
    id: number;
    username: string;
    email: string;
  };
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
  visibility?: CalendarVisibility;
}

export interface UpdateCalendarRequest {
  name?: string;
  description?: string;
  color?: string;
  visibility?: CalendarVisibility;
}