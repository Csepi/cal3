/**
 * useCalendars Hook
 * TanStack Query hooks for calendar operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarsApi } from '@api/calendars';
import { queryKeys } from '@config/react-query';
import type {
  Calendar,
  CreateCalendarRequest,
  UpdateCalendarRequest,
} from '@types/Calendar';

/**
 * Get all user calendars
 */
export const useCalendars = () => {
  return useQuery({
    queryKey: queryKeys.calendars.all,
    queryFn: () => calendarsApi.getCalendars(),
    staleTime: 10 * 60 * 1000, // 10 minutes (calendars don't change often)
  });
};

/**
 * Get a single calendar by ID
 */
export const useCalendar = (id: number) => {
  return useQuery({
    queryKey: queryKeys.calendars.detail(id),
    queryFn: () => calendarsApi.getCalendar(id),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get the default calendar
 */
export const useDefaultCalendar = () => {
  return useQuery({
    queryKey: [...queryKeys.calendars.all, 'default'],
    queryFn: () => calendarsApi.getDefaultCalendar(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Create a new calendar
 */
export const useCreateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalendarRequest) => calendarsApi.createCalendar(data),
    onSuccess: () => {
      // Invalidate calendars query
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
  });
};

/**
 * Update an existing calendar
 */
export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCalendarRequest }) =>
      calendarsApi.updateCalendar(id, data),
    onSuccess: (updatedCalendar) => {
      // Invalidate calendars query
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
      // Update the specific calendar in cache
      queryClient.setQueryData(
        queryKeys.calendars.detail(updatedCalendar.id),
        updatedCalendar
      );
    },
  });
};

/**
 * Delete a calendar
 */
export const useDeleteCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => calendarsApi.deleteCalendar(id),
    onSuccess: (_, deletedId) => {
      // Invalidate calendars query
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
      // Remove the specific calendar from cache
      queryClient.removeQueries({ queryKey: queryKeys.calendars.detail(deletedId) });
      // Also invalidate events for this calendar
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
