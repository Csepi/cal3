import { apiService } from './api';

export const authApi = {
  login: (username: string, password: string) => apiService.login(username, password),
  logout: () => apiService.logout(),
  isAuthenticated: () => apiService.isAuthenticated(),
} as const;

