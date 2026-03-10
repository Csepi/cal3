import { apiService } from './api';

export const authApi = {
  login: (
    username: string,
    password: string,
    options?: { mfaCode?: string; mfaRecoveryCode?: string },
  ) => apiService.login(username, password, options),
  logout: () => apiService.logout(),
  isAuthenticated: () => apiService.isAuthenticated(),
} as const;
