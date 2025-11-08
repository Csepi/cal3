/**
 * Admin API service for centralized admin panel API operations
 *
 * This service provides a consistent interface for all admin panel API calls,
 * including authentication, error handling, and common operations.
 */

import type {
  AdminApiOptions,
  BulkOperationResult,
  LogLevel,
  ConfigurationOverview,
  ConfigurationSettingSummary,
} from './types';
import { BASE_URL } from '../../config/apiConfig';
import { secureFetch } from '../../services/authErrorHandler';
import { sessionManager } from '../../services/sessionManager';

const ensureAdminSession = (): void => {
  if (!sessionManager.hasActiveSession()) {
    throw new Error('Authentication required. Please log in.');
  }

  const role =
    sessionManager.getCurrentUser()?.role || localStorage.getItem('userRole');
  if (role !== 'admin') {
    throw new Error('Admin privileges required.');
  }
};

/**
 * Make authenticated API call to admin endpoints
 * Handles token authentication and error parsing
 */
export const adminApiCall = async ({
  endpoint,
  method = 'GET',
  data,
}: AdminApiOptions) => {
  ensureAdminSession();
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const base = BASE_URL.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = base.endsWith('/api') ? `${base}${normalizedEndpoint}` : `${base}/api${normalizedEndpoint}`;

  const response = await secureFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to ${method} ${endpoint}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Generic data loader for admin resources
 * Provides consistent loading pattern with authentication checks
 */
export const loadAdminData = async <T>(
  endpoint: string,
  updateProgress?: (progress: number, message: string) => void
): Promise<T> => {
  updateProgress?.(10, 'Checking authentication...');

  const resource = endpoint.split('/').pop() || 'data';
  updateProgress?.(30, `Loading ${resource}...`);

  const response = await adminApiCall({ endpoint });

  updateProgress?.(70, `Processing ${resource}...`);

  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 200));

  updateProgress?.(100, `${resource} loaded successfully`);

  // Extract data from response object if it exists, otherwise return the response directly
  return response.data || response;
};

interface LogQueryParams {
  levels?: LogLevel[];
  contexts?: string[];
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

const buildQueryString = (params: Record<string, string | number | string[] | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter((entry) => entry !== undefined && entry !== null && entry !== '').forEach((entry) => {
        searchParams.append(key, String(entry));
      });
    } else if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const fetchAdminLogs = async (params: LogQueryParams = {}) => {
  const query = buildQueryString({
    levels: params.levels && params.levels.length > 0 ? params.levels : undefined,
    contexts: params.contexts && params.contexts.length > 0 ? params.contexts : undefined,
    search: params.search,
    from: params.from,
    to: params.to,
    limit: params.limit,
    offset: params.offset,
  });

  return adminApiCall({
    endpoint: `/admin/logs${query}`,
  });
};

export const updateLogRetentionSettings = async (data: { retentionDays?: number; autoCleanupEnabled?: boolean }) => {
  return adminApiCall({
    endpoint: '/admin/logs/settings',
    method: 'PATCH',
    data,
  });
};

export const clearAdminLogs = async (before?: string) => {
  const query = buildQueryString({ before });

  return adminApiCall({
    endpoint: `/admin/logs${query}`,
    method: 'DELETE',
  });
};

export const runAdminLogRetention = async () => {
  return adminApiCall({
    endpoint: '/admin/logs/purge',
    method: 'POST',
  });
};

/**
 * Delete multiple items with bulk operation support
 * Returns results summary including success/failure counts
 */
export const bulkDelete = async (
  endpoint: string,
  ids: number[],
  updateProgress?: (progress: number, message: string) => void
): Promise<BulkOperationResult> => {
  if (ids.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  ensureAdminSession();

  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const progress = Math.round(((i + 1) / ids.length) * 100);
    updateProgress?.(progress, `Deleting item ${i + 1} of ${ids.length}...`);

    try {
      await adminApiCall({
        endpoint: `${endpoint}/${id}`,
        method: 'DELETE'
      });
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Failed to delete item ${id}: ${errorMessage}`);
    }

    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Update usage plans for multiple users
 * Supports set, add, and remove operations
 */
export const bulkUpdateUsagePlans = async (
  userIds: number[],
  plans: string[],
  operation: 'set' | 'add' | 'remove',
  updateProgress?: (progress: number, message: string) => void
): Promise<BulkOperationResult> => {
  if (userIds.length === 0 || plans.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  ensureAdminSession();

  const normalisePlan = (value: string) => value?.toLowerCase?.().trim?.() ?? value;
  const normalisedPlans = plans.map(normalisePlan);

  const dedupePlans = (values: string[]) => Array.from(new Set(values.map(normalisePlan)));

  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const progress = Math.round(((i + 1) / userIds.length) * 100);
    updateProgress?.(progress, `Updating user ${i + 1} of ${userIds.length}...`);

    try {
      const user = await adminApiCall({
        endpoint: `/admin/users/${userId}`,
      });

      const currentPlans: string[] = Array.isArray(user?.usagePlans)
        ? user.usagePlans.map(normalisePlan)
        : [];

      let nextPlans: string[];
      if (operation === 'set') {
        nextPlans = dedupePlans(normalisedPlans);
      } else if (operation === 'add') {
        nextPlans = dedupePlans([...currentPlans, ...normalisedPlans]);
      } else {
        const planSet = new Set(normalisedPlans);
        nextPlans = currentPlans.filter((plan) => !planSet.has(plan));
      }

      await adminApiCall({
        endpoint: `/admin/users/${userId}/usage-plans`,
        method: 'PATCH',
        data: { usagePlans: nextPlans }
      });
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Failed to update user ${userId}: ${errorMessage}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Check if current user has admin privileges
 * Used for conditional rendering of admin features
 */
export const isAdminUser = (): boolean => {
  const userRole =
    sessionManager.getCurrentUser()?.role || localStorage.getItem('userRole');
  return userRole === 'admin';
};

/**
 * Format error messages for user display
 * Provides consistent error formatting across admin components
 */
export const formatAdminError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Fetch runtime configuration overview for admin console
 */
export const fetchConfigurationOverview = async (
  updateProgress?: (progress: number, message: string) => void
): Promise<ConfigurationOverview> => {
  return loadAdminData<ConfigurationOverview>('/admin/configuration', updateProgress);
};

/**
 * Update a single configuration setting
 */
export const updateConfigurationSetting = async (
  key: string,
  value: string | boolean | null
): Promise<ConfigurationSettingSummary> => {
  const normalizedKey = key.toUpperCase();

  const response = await adminApiCall({
    endpoint: `/admin/configuration/${encodeURIComponent(normalizedKey)}`,
    method: 'PATCH',
    data: { value },
  });

  return response as ConfigurationSettingSummary;
};

