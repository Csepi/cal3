import { Platform } from 'react-native';

/**
 * Application Configuration
 * Centralized configuration for the Cal3 Mobile app
 */

// Determine if we're in development mode
const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * API Configuration
 * Android emulator: use 10.0.2.2 to access host machine's localhost
 * Physical device: use your computer's IP address (e.g., 192.168.1.100)
 */
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8081'  // Android emulator
      : 'http://localhost:8081'  // Fallback
    : 'https://your-production-api.com',  // Production URL (to be configured)
  TIMEOUT: 30000,  // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,  // 1 second
};

/**
 * App Configuration
 */
export const APP_CONFIG = {
  APP_NAME: 'Cal3',
  VERSION: '0.1.0',
  BUILD_NUMBER: 1,
};

/**
 * Feature Flags (local - will be fetched from backend)
 */
export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_PUSH_NOTIFICATIONS: false,  // Phase 5
  ENABLE_NATIVE_CALENDAR_SYNC: false,  // Phase 5
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@cal3:auth_token',
  USER_DATA: '@cal3:user_data',
  THEME_COLOR: '@cal3:theme_color',
  SYNC_QUEUE: '@cal3:sync_queue',
  CACHE_TIMESTAMP: '@cal3:cache_timestamp',
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  EVENTS_STALE_TIME: 5 * 60 * 1000,  // 5 minutes
  CALENDARS_STALE_TIME: 10 * 60 * 1000,  // 10 minutes
  USER_PROFILE_STALE_TIME: 30 * 60 * 1000,  // 30 minutes
  CACHE_TIME: 60 * 60 * 1000,  // 1 hour
};

export default {
  API_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  STORAGE_KEYS,
  CACHE_CONFIG,
};
