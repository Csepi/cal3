import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Configures TanStack Query for server state management
 *
 * Features:
 * - Optimized caching strategy
 * - Automatic retry logic
 * - Network status awareness
 * - Error handling
 */

/**
 * Default options for all queries and mutations
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)

    // Retry failed requests up to 2 times
    retry: 2,

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Don't refetch on window focus by default (can be enabled per-query)
    refetchOnWindowFocus: false,

    // Don't refetch on reconnect by default
    refetchOnReconnect: false,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once
    retry: 1,

    // Network mode for mutations
    networkMode: 'online',
  },
};

/**
 * Create and export QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Query keys for consistent cache management
 * Use these keys throughout the app for type-safe query keys
 */
export const queryKeys = {
  // Auth queries
  auth: {
    profile: ['auth', 'profile'] as const,
  },

  // Calendar queries
  calendars: {
    all: ['calendars'] as const,
    detail: (id: number) => ['calendars', id] as const,
    events: (calendarId: number) => ['calendars', calendarId, 'events'] as const,
  },

  // Event queries
  events: {
    all: ['events'] as const,
    detail: (id: number) => ['events', id] as const,
    byDateRange: (start: string, end: string) => ['events', 'range', start, end] as const,
    upcoming: ['events', 'upcoming'] as const,
  },

  // Reservation queries
  reservations: {
    all: ['reservations'] as const,
    detail: (id: number) => ['reservations', id] as const,
    byResource: (resourceId: number) => ['reservations', 'resource', resourceId] as const,
    resources: ['reservations', 'resources'] as const,
  },

  // Automation queries
  automation: {
    rules: ['automation', 'rules'] as const,
    ruleDetail: (id: number) => ['automation', 'rules', id] as const,
    auditLogs: (ruleId: number) => ['automation', 'rules', ruleId, 'audit-logs'] as const,
  },

  // Admin queries
  admin: {
    users: ['admin', 'users'] as const,
    userDetail: (id: number) => ['admin', 'users', id] as const,
    systemInfo: ['admin', 'system-info'] as const,
  },
} as const;

/**
 * Helper function to invalidate related queries
 * Use after mutations to refresh data
 */
export const invalidateQueries = {
  // Invalidate all event-related queries
  events: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  },

  // Invalidate specific event
  event: (id: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
  },

  // Invalidate all calendar-related queries
  calendars: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.calendars.all });
  },

  // Invalidate specific calendar and its events
  calendar: (id: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.calendars.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.calendars.events(id) });
  },

  // Invalidate auth profile
  profile: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
  },

  // Invalidate all reservations
  reservations: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
  },

  // Invalidate automation rules
  automationRules: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.automation.rules });
  },
};

/**
 * Helper function to prefetch queries
 * Use to preload data before navigation
 */
export const prefetchQueries = {
  // Prefetch user profile
  profile: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.profile,
      staleTime: 5 * 60 * 1000,
    });
  },

  // Prefetch calendars
  calendars: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.calendars.all,
      staleTime: 5 * 60 * 1000,
    });
  },
};
