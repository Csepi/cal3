/**
 * useEvents Hook
 * TanStack Query hooks for event operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@api/events';
import { queryKeys } from '@config/react-query';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
} from '@types/Event';

/**
 * Get all events with optional filters
 */
export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: [...queryKeys.events.all, filters],
    queryFn: () => eventsApi.getEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get events by date range
 */
export const useEventsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.events.byDateRange(startDate, endDate),
    queryFn: () => eventsApi.getEventsByDateRange(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get a single event by ID
 */
export const useEvent = (id: number) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsApi.getEvent(id),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get upcoming events (next 7 days)
 */
export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: queryKeys.events.upcoming,
    queryFn: () => eventsApi.getUpcomingEvents(),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent refresh)
  });
};

/**
 * Create a new event
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.createEvent(data),
    onSuccess: () => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

/**
 * Update an existing event
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEventRequest }) =>
      eventsApi.updateEvent(id, data),
    onSuccess: (updatedEvent) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      // Update the specific event in cache
      queryClient.setQueryData(
        queryKeys.events.detail(updatedEvent.id),
        updatedEvent
      );
    },
  });
};

/**
 * Delete an event
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventsApi.deleteEvent(id),
    onSuccess: (_, deletedId) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      // Remove the specific event from cache
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(deletedId) });
    },
  });
};
