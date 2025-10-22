/**
 * Event Type Definitions
 * Matches backend Event entity
 */

import type { CalendarColor } from '@constants/theme';

export interface Event {
  id: number;
  title: string;
  description?: string;
  location?: string;
  notes?: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  isAllDay: boolean;
  color?: CalendarColor;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  calendarId: number;
  calendar?: {
    id: number;
    name: string;
    color?: CalendarColor;
  };
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  notes?: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  isAllDay: boolean;
  color?: CalendarColor;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  calendarId: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  color?: CalendarColor;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  calendarId?: number;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  calendarId?: number;
  status?: string;
}
