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
  icon?: string;
  status?: string;
  recurrenceType?: string;
  recurrenceRule?: RecurrencePattern | Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Recurring event properties
  parentEventId?: number;
  recurrenceId?: string;
  isRecurring?: boolean;
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
    rank?: number;
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

export enum RecurrenceEndType {
  NEVER = 'never',
  COUNT = 'count',
  DATE = 'date'
}

export interface RecurrencePattern {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endType?: RecurrenceEndType;
  count?: number;
  endDate?: string;
  timezone?: string;
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
  icon?: string;
  calendarId?: number;
  recurrenceType?: RecurrenceType;
  recurrenceRule?: RecurrencePattern | Record<string, unknown>;
}

export interface UpdateEventRequest extends CreateEventRequest {
  updateMode?: RecurrenceUpdateMode;
}
