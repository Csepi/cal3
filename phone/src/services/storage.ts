import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '@constants/config';

/**
 * Storage Service
 * Handles all local storage operations
 * - Sensitive data (tokens) → Keychain
 * - Regular data → AsyncStorage
 */

/**
 * Secure Storage (for tokens and sensitive data)
 */
export const secureStorage = {
  /**
   * Store JWT token securely
   */
  async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('auth_token', token, {
      service: 'com.cal3mobile',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
  },

  /**
   * Get JWT token
   */
  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.cal3mobile',
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  /**
   * Remove JWT token
   */
  async removeToken(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: 'com.cal3mobile',
    });
  },
};

/**
 * Regular Storage (for non-sensitive data)
 */
export const storage = {
  /**
   * Store user data
   */
  async setUser(user: object): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  /**
   * Get user data
   */
  async getUser<T>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  },

  /**
   * Remove user data
   */
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  /**
   * Store theme color
   */
  async setThemeColor(color: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
  },

  /**
   * Get theme color
   */
  async getThemeColor(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.THEME_COLOR);
  },

  /**
   * Store generic data
   */
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  /**
   * Get generic data
   */
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  /**
   * Remove generic data
   */
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  /**
   * Clear all storage (except secure storage)
   */
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
