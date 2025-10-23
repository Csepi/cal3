/**
 * Calendars API Service
 * API methods for calendar CRUD operations
 */

import { apiClient } from './client';
import type {
  Calendar,
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from '@types/Calendar';

export const calendarsApi = {
  /**
   * Get all user calendars
   */
  getCalendars: (): Promise<Calendar[]> => {
    return apiClient.get<Calendar[]>('/api/calendars');
  },

  /**
   * Get a single calendar by ID
   */
  getCalendar: (id: number): Promise<Calendar> => {
    return apiClient.get<Calendar>(`/api/calendars/${id}`);
  },

  /**
   * Create a new calendar
   */
  createCalendar: (data: CreateCalendarRequest): Promise<Calendar> => {
    return apiClient.post<Calendar>('/api/calendars', data);
  },

  /**
   * Update an existing calendar
   */
  updateCalendar: (id: number, data: UpdateCalendarRequest): Promise<Calendar> => {
    return apiClient.patch<Calendar>(`/api/calendars/${id}`, data);
  },

  /**
   * Delete a calendar
   */
  deleteCalendar: (id: number): Promise<void> => {
    return apiClient.delete(`/api/calendars/${id}`);
  },

  /**
   * Get the default calendar
   */
  getDefaultCalendar: (): Promise<Calendar> => {
    return apiClient.get<Calendar>('/api/calendars/default');
  },
};
