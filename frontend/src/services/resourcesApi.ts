import { apiService } from './api';
import { http } from '../lib/http';

export const resourcesApi = {
  /** Load organizations visible to current user scope. */
  getOrganisations: <T = unknown>() => http.get<T>('/api/organisations'),
  /** Load reservations, optionally filtered by resource id. */
  getReservations: <T = unknown[]>(resourceId?: string | number) =>
    http.get<T>(`/api/reservations${resourceId !== undefined ? `?resourceId=${encodeURIComponent(String(resourceId))}` : ''}`),
  // Keep compatibility with existing service consumers
  /** Compatibility alias used by previous permission-aware callers. */
  getAccessibleOrganisations: () => apiService.getOrganisations(),
} as const;
