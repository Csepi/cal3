import { apiService } from './api';

export const resourcesApi = {
  getOrganisations: () => apiService.getOrganisations(),
  getReservations: (resourceId?: string | number) => apiService.getReservations(resourceId),
} as const;
