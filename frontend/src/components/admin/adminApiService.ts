/**
 * Admin API service for centralized admin panel API operations
 *
 * This service provides a consistent interface for all admin panel API calls,
 * including authentication, error handling, and common operations.
 */

import type { AdminApiOptions, BulkOperationResult } from './types';

/**
 * Get admin authentication token with fallback logic
 * Tries admin_token first, then falls back to authToken for admin users
 */
export const getAdminToken = (): string | null => {
  let token = localStorage.getItem('admin_token');

  // Fallback to regular auth token if user has admin role
  if (!token) {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      token = localStorage.getItem('authToken');
    }
  }

  return token;
};

/**
 * Make authenticated API call to admin endpoints
 * Handles token authentication and error parsing
 */
export const adminApiCall = async ({
  endpoint,
  token,
  method = 'GET',
  data
}: AdminApiOptions) => {
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`http://localhost:8081/api${endpoint}`, options);

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

  const token = getAdminToken();
  if (!token) {
    throw new Error('No admin token found. Please login as admin.');
  }

  const resource = endpoint.split('/').pop() || 'data';
  updateProgress?.(30, `Loading ${resource}...`);

  const response = await adminApiCall({ endpoint, token });

  updateProgress?.(70, `Processing ${resource}...`);

  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 200));

  updateProgress?.(100, `${resource} loaded successfully`);

  return response;
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

  const token = getAdminToken();
  if (!token) {
    throw new Error('No admin token found. Please login as admin.');
  }

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
        token,
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

  const token = getAdminToken();
  if (!token) {
    throw new Error('No admin token found. Please login as admin.');
  }

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
      await adminApiCall({
        endpoint: `/admin/users/${userId}/usage-plans`,
        token,
        method: 'PATCH',
        data: { plans, operation }
      });
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Failed to update user ${userId}: ${errorMessage}`);
    }

    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Check if current user has admin privileges
 * Used for conditional rendering of admin features
 */
export const isAdminUser = (): boolean => {
  const userRole = localStorage.getItem('userRole');
  const adminToken = localStorage.getItem('admin_token');

  return userRole === 'admin' || !!adminToken;
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