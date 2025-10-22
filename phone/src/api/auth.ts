import { apiClient } from './client';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@types/User';

/**
 * Authentication API
 * Handles login, register, profile management
 */

export const authApi = {
  /**
   * Login with username/password
   */
  login: (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/api/auth/login', credentials);
  },

  /**
   * Register new user
   */
  register: (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/api/auth/register', data);
  },

  /**
   * Get current user profile
   */
  getProfile: (): Promise<User> => {
    return apiClient.get<User>('/api/user/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: (data: UpdateProfileRequest): Promise<User> => {
    return apiClient.patch<User>('/api/user/profile', data);
  },

  /**
   * Change password
   */
  changePassword: (data: ChangePasswordRequest): Promise<void> => {
    return apiClient.patch<void>('/api/user/password', data);
  },

  /**
   * Logout (client-side only, no backend endpoint)
   */
  logout: (): Promise<void> => {
    // Just a placeholder for consistency
    // Actual logout happens in auth store
    return Promise.resolve();
  },
};
