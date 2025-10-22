/**
 * User Types
 * Shared with backend API
 */

export interface User {
  id: number;
  username: string;
  email: string;
  themeColor?: string;
  timezone?: string;
  timeFormat?: '12h' | '24h';
  usagePlans?: string[];
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  email?: string;
  themeColor?: string;
  timezone?: string;
  timeFormat?: '12h' | '24h';
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
