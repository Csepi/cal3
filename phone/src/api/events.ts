/**
 * Events API Service
 * API methods for event CRUD operations
 */

import { apiClient } from './client';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
} from '@types/Event';

export const eventsApi = {
  /**
   * Get all events with optional filters
   */
  getEvents: (filters?: EventFilters): Promise<Event[]> => {
    return apiClient.get<Event[]>('/api/events', { params: filters });
  },

  /**
   * Get events by date range
   */
  getEventsByDateRange: (startDate: string, endDate: string): Promise<Event[]> => {
    return apiClient.get<Event[]>('/api/events', {
      params: { startDate, endDate },
    });
  },

  /**
   * Get a single event by ID
   */
  getEvent: (id: number): Promise<Event> => {
    return apiClient.get<Event>(`/api/events/${id}`);
  },

  /**
   * Create a new event
   */
  createEvent: (data: CreateEventRequest): Promise<Event> => {
    return apiClient.post<Event>('/api/events', data);
  },

  /**
   * Update an existing event
   */
  updateEvent: (id: number, data: UpdateEventRequest): Promise<Event> => {
    return apiClient.patch<Event>(`/api/events/${id}`, data);
  },

  /**
   * Delete an event
   */
  deleteEvent: (id: number): Promise<void> => {
    return apiClient.delete(`/api/events/${id}`);
  },

  /**
   * Get upcoming events (next 7 days)
   */
  getUpcomingEvents: (): Promise<Event[]> => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return apiClient.get<Event[]>('/api/events', {
      params: {
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
      },
    });
  },
};
