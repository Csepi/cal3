import { apiService } from './api';
import { http } from '../lib/http';

export const resourcesApi = {
  getOrganisations: <T = unknown>() => http.get<T>('/api/organisations'),
  getReservations: <T = unknown[]>(resourceId?: string | number) =>
    http.get<T>(`/api/reservations${resourceId !== undefined ? `?resourceId=${encodeURIComponent(String(resourceId))}` : ''}`),
  // Keep compatibility with existing service consumers
  getAccessibleOrganisations: () => apiService.getOrganisations(),
} as const;
