export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  color?: string;
  status?: string;
  recurrenceType?: string;
  recurrenceRule?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  calendar?: {
    id: number;
    name: string;
    description?: string;
    color: string;
    visibility: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ownerId: number;
  };
  calendarId?: number;
  createdBy?: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  createdById?: number;
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum RecurrenceUpdateMode {
  SINGLE = 'single',
  ALL = 'all',
  FUTURE = 'future'
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  calendarId?: number;
  recurrenceType?: RecurrenceType;
  recurrenceRule?: any;
}

export interface UpdateEventRequest extends CreateEventRequest {
  updateMode?: RecurrenceUpdateMode;
}