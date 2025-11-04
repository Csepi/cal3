/**
 * Admin components barrel export
 *
 * This file provides centralized access to all admin-related components
 * for clean and consistent imports throughout the application.
 */

// Type definitions
export * from './types';

// API service
export * from './adminApiService';

// Components
export * from './AdminStatsPanel';
export * from './AdminUserPanel';
export * from './AdminOrganisationPanel';
export * from './AdminCalendarPanel';
export * from './AdminEventPanel';
export * from './AdminSharePanel';
export * from './AdminReservationPanel';
export * from './AdminLogsPanel';
export * from './AdminNavigation';
export { default as AdminConfigurationPanel } from './AdminConfigurationPanel';
export { default as AdminNotificationsPanel } from './AdminNotificationsPanel';
