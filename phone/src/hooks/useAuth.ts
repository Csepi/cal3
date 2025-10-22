import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import type { LoginRequest, RegisterRequest } from '@types/User';

/**
 * useAuth Hook
 * Custom hook for authentication operations
 *
 * Features:
 * - Login/logout/register functions
 * - Auto-initialize on mount
 * - Loading and error states
 * - Type-safe auth operations
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * const handleLogin = async () => {
 *   try {
 *     await login({ username: 'user', password: 'pass' });
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 * ```
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    refreshProfile,
    clearError,
    initialize,
  } = useAuthStore();

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Login wrapper with error handling
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        await loginAction(credentials);
      } catch (error: any) {
        // Error is set in the store
        throw error;
      }
    },
    [loginAction]
  );

  /**
   * Register wrapper with error handling
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        await registerAction(data);
      } catch (error: any) {
        // Error is set in the store
        throw error;
      }
    },
    [registerAction]
  );

  /**
   * Logout wrapper
   */
  const logout = useCallback(async () => {
    await logoutAction();
  }, [logoutAction]);

  /**
   * Refresh user profile
   */
  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      await refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    refresh,
    clearError,
  };
};
