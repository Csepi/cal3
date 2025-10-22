import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, storage } from '@services/storage';
import { authApi } from '@api/auth';
import { apiClient } from '@api/client';
import type { User, LoginRequest, RegisterRequest } from '@types/User';

/**
 * Authentication Store
 * Manages global authentication state with Zustand
 *
 * Features:
 * - JWT token management
 * - User state persistence
 * - Login/logout/register actions
 * - Automatic token injection into API client
 */

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Initialize auth state on app startup
       * Loads token and user from storage
       */
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Load token from secure storage
          const token = await secureStorage.getToken();

          if (token) {
            // Load user from regular storage
            const user = await storage.getUser<User>();

            if (user) {
              // Set up API client with token
              apiClient.setTokenProvider(async () => token);
              apiClient.setOnUnauthorized(() => {
                get().logout();
              });

              set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
              });

              // Optionally refresh profile from server
              try {
                await get().refreshProfile();
              } catch (error) {
                // If profile refresh fails, continue with cached user
                console.warn('Profile refresh failed, using cached user');
              }
            } else {
              // Token exists but no user - clear token
              await secureStorage.removeToken();
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Initialize error:', error);
          set({
            isLoading: false,
            error: 'Failed to initialize authentication',
          });
        }
      },

      /**
       * Login with username/password
       */
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          // Call login API
          const response = await authApi.login(credentials);

          // Store token securely
          await secureStorage.setToken(response.token);

          // Store user data
          await storage.setUser(response.user);

          // Set up API client with token
          apiClient.setTokenProvider(async () => response.token);
          apiClient.setOnUnauthorized(() => {
            get().logout();
          });

          // Update state
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          // Call register API
          const response = await authApi.register(data);

          // Store token securely
          await secureStorage.setToken(response.token);

          // Store user data
          await storage.setUser(response.user);

          // Set up API client with token
          apiClient.setTokenProvider(async () => response.token);
          apiClient.setOnUnauthorized(() => {
            get().logout();
          });

          // Update state
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * Logout user
       * Clears all auth data from storage and state
       */
      logout: async () => {
        try {
          set({ isLoading: true });

          // Clear secure storage
          await secureStorage.removeToken();

          // Clear regular storage
          await storage.removeUser();

          // Clear API client token provider
          apiClient.setTokenProvider(async () => null);

          // Clear state
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Force clear state even if storage clear fails
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      /**
       * Refresh user profile from server
       */
      refreshProfile: async () => {
        try {
          const user = await authApi.getProfile();
          await storage.setUser(user);
          set({ user });
        } catch (error) {
          console.error('Refresh profile error:', error);
          throw error;
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not token (token in secure storage)
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
