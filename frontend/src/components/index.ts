// @ts-nocheck
/**
 * Components barrel export
 *
 * This file provides centralized access to all components in the application
 * organized by functional areas for clean and consistent imports.
 */

// Authentication components
export * from './auth';

// UI primitive components
export * from './ui';

// Admin-specific components
export * from './admin';

// Calendar-specific components
export * from './calendar';

// Profile-related components
export * from './profile';

// Reservation-specific components
export * from './reservation';

// Dialog components
export * from './dialogs';

// View components
export * from './views';

// Common/shared components
export * from './common';

// Synchronization components
export * from './sync';

// Main application components (not moved to subdirectories yet)
export { default as Dashboard } from './Dashboard';
export { default as AdminPanel } from './AdminPanel';
export { default as Calendar } from './Calendar';
export { default as CalendarSidebar } from './CalendarSidebar';
export { default as UserProfile } from './UserProfile';
export { default as ReservationManagement } from './ReservationManagement';
