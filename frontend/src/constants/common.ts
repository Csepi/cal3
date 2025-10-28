/**
 * Common constants used throughout the Cal3 Calendar application
 *
 * This file contains shared constants for:
 * - Usage plan definitions
 * - Timezone options
 * - Time format options
 * - Application-wide settings
 */

// Usage plan options for user management
export const USAGE_PLAN_OPTIONS = [
  { value: 'child', label: 'Child', description: 'Basic features for children' },
  { value: 'user', label: 'User', description: 'Standard user features' },
  { value: 'store', label: 'Store', description: 'Advanced features for businesses' },
  { value: 'enterprise', label: 'Enterprise', description: 'Full enterprise features' }
] as const;

// Time format options for user preferences
export const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' }
] as const;

// Language options for user preferences
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { value: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { value: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { value: 'hu', label: 'Magyar (Hungarian)', flag: '🇭🇺' }
] as const;

// Comprehensive timezone options organized by region
export const TIMEZONE_OPTIONS = [
  // UTC
  { name: 'UTC (Coordinated Universal Time)', value: 'UTC' },

  // Americas
  { name: 'Alaska Time (Anchorage)', value: 'America/Anchorage' },
  { name: 'Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
  { name: 'Mountain Time (Denver)', value: 'America/Denver' },
  { name: 'Central Time (Chicago)', value: 'America/Chicago' },
  { name: 'Eastern Time (New York)', value: 'America/New_York' },
  { name: 'Atlantic Time (Halifax)', value: 'America/Halifax' },
  { name: 'Newfoundland Time (St. Johns)', value: 'America/St_Johns' },
  { name: 'Mexico City', value: 'America/Mexico_City' },
  { name: 'Guatemala City', value: 'America/Guatemala' },
  { name: 'Bogotá', value: 'America/Bogota' },
  { name: 'Lima', value: 'America/Lima' },
  { name: 'Santiago', value: 'America/Santiago' },
  { name: 'São Paulo', value: 'America/Sao_Paulo' },
  { name: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { name: 'Montevideo', value: 'America/Montevideo' },

  // Europe
  { name: 'London (GMT/BST)', value: 'Europe/London' },
  { name: 'Dublin', value: 'Europe/Dublin' },
  { name: 'Paris', value: 'Europe/Paris' },
  { name: 'Berlin', value: 'Europe/Berlin' },
  { name: 'Amsterdam', value: 'Europe/Amsterdam' },
  { name: 'Brussels', value: 'Europe/Brussels' },
  { name: 'Vienna', value: 'Europe/Vienna' },
  { name: 'Zurich', value: 'Europe/Zurich' },
  { name: 'Rome', value: 'Europe/Rome' },
  { name: 'Madrid', value: 'Europe/Madrid' },
  { name: 'Stockholm', value: 'Europe/Stockholm' },
  { name: 'Copenhagen', value: 'Europe/Copenhagen' },
  { name: 'Oslo', value: 'Europe/Oslo' },
  { name: 'Helsinki', value: 'Europe/Helsinki' },
  { name: 'Warsaw', value: 'Europe/Warsaw' },
  { name: 'Prague', value: 'Europe/Prague' },
  { name: 'Budapest', value: 'Europe/Budapest' },
  { name: 'Athens', value: 'Europe/Athens' },
  { name: 'Istanbul', value: 'Europe/Istanbul' },
  { name: 'Moscow', value: 'Europe/Moscow' },
  { name: 'Kiev', value: 'Europe/Kiev' },
  { name: 'Cape Town', value: 'Africa/Cape_Town' },

  // Asia
  { name: 'Dubai', value: 'Asia/Dubai' },
  { name: 'Karachi', value: 'Asia/Karachi' },
  { name: 'Mumbai', value: 'Asia/Kolkata' },
  { name: 'Dhaka', value: 'Asia/Dhaka' },
  { name: 'Bangkok', value: 'Asia/Bangkok' },
  { name: 'Singapore', value: 'Asia/Singapore' },
  { name: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { name: 'Manila', value: 'Asia/Manila' },
  { name: 'Taipei', value: 'Asia/Taipei' },
  { name: 'Seoul', value: 'Asia/Seoul' },
  { name: 'Tokyo', value: 'Asia/Tokyo' },
  { name: 'Shanghai', value: 'Asia/Shanghai' },
  { name: 'Jakarta', value: 'Asia/Jakarta' },
  { name: 'Kuala Lumpur', value: 'Asia/Kuala_Lumpur' },
  { name: 'Ho Chi Minh City', value: 'Asia/Ho_Chi_Minh' },
  { name: 'Yangon', value: 'Asia/Yangon' },
  { name: 'Tehran', value: 'Asia/Tehran' },

  // Australia/Pacific
  { name: 'Perth', value: 'Australia/Perth' },
  { name: 'Adelaide', value: 'Australia/Adelaide' },
  { name: 'Darwin', value: 'Australia/Darwin' },
  { name: 'Brisbane', value: 'Australia/Brisbane' },
  { name: 'Sydney', value: 'Australia/Sydney' },
  { name: 'Melbourne', value: 'Australia/Melbourne' },
  { name: 'Hobart', value: 'Australia/Hobart' },
  { name: 'Auckland', value: 'Pacific/Auckland' },
  { name: 'Fiji', value: 'Pacific/Fiji' },
  { name: 'Honolulu', value: 'Pacific/Honolulu' },
  { name: 'Guam', value: 'Pacific/Guam' },
  { name: 'Port Moresby', value: 'Pacific/Port_Moresby' }
] as const;

// Default values
export const DEFAULT_TIME_FORMAT = '12' as const;
export const DEFAULT_TIMEZONE = 'UTC' as const;

// Week start day options
export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' }
] as const;

// Calendar view options
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week'
} as const;

// Status options for reservations/events
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'blue' }
] as const;

// Common date formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  SHORT: 'MM/DD/YYYY'
} as const;

// Loading states
export const LOADING_MESSAGES = {
  CALENDARS: 'Loading calendars...',
  EVENTS: 'Loading events...',
  PROFILE: 'Loading user profile...',
  RESERVATIONS: 'Loading reservations...',
  SYNC: 'Syncing calendars...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  READY: 'Ready!'
} as const;