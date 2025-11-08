/**
 * Shared types and interfaces for admin panel components
 *
 * This file centralizes all type definitions used across the admin panel,
 * ensuring consistency and reducing duplication in admin-related components.
 */

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  usagePlans?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: number;
  name: string;
  description?: string;
  color: string;
  visibility: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: User;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  color: string;
  calendar: Calendar;
  createdBy: User;
}

export interface CalendarShare {
  id: number;
  permission: string;
  createdAt: string;
  calendar: Calendar;
  sharedWith: User;
}

export interface Resource {
  id: number;
  name: string;
  resourceType: ResourceType;
}

export interface ResourceType {
  id: number;
  name: string;
}

export interface Reservation {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  isRecurring: boolean;
  recurrencePattern?: Record<string, any>;
  resource: Resource;
  createdBy: User;
  createdAt: string;
}

export interface DatabaseStats {
  users: { total: number; active: number; admins: number };
  calendars: { total: number };
  events: { total: number };
  shares: { total: number };
  lastUpdated: string;
}

export interface AdminApiOptions {
  endpoint: string;
  method?: string;
  data?: any;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

export type ModalType = 'create' | 'edit' | 'password' | 'usagePlans' | 'bulkUsagePlans';
export type EntityType = 'user' | 'calendar' | 'event';
export type AdminTab =
  | 'users'
  | 'calendars'
  | 'events'
  | 'shares'
  | 'reservations'
  | 'organizations'
  | 'stats'
  | 'configuration'
  | 'notifications'
  | 'system-info'
  | 'logs';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
}

export interface SelectionState {
  selectedUsers: number[];
  selectedCalendars: number[];
  selectedEvents: number[];
  lastSelectedIndex: { [key: string]: number };
}

export interface FilterState {
  status: string;
  resource: string;
  startDate: string;
  endDate: string;
}

export interface Organisation {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adminCount?: number;
  userCount?: number;
  calendarCount?: number;
}

export interface OrganisationAdmin {
  id: number;
  organisationId: number;
  userId: number;
  assignedById?: number;
  createdAt: string;
  user: User;
  organisation: Organisation;
  assignedBy?: User;
}

export interface ReservationCalendar {
  id: number;
  calendarId: number;
  organisationId: number;
  createdById: number;
  reservationRules?: string;
  createdAt: string;
  calendar: Calendar;
  organisation: Organisation;
  createdBy: User;
  roleCount?: number;
}

export interface ReservationCalendarRole {
  id: number;
  reservationCalendarId: number;
  userId: number;
  role: 'editor' | 'reviewer';
  isOrganisationAdmin: boolean;
  assignedById?: number;
  createdAt: string;
  user: User;
  reservationCalendar: ReservationCalendar;
  assignedBy?: User;
}

export interface MemberWithRole extends User {
  /** Organization role (admin, editor, or user) */
  organizationRole: 'admin' | 'editor' | 'user';
  /** When the user was assigned to this role */
  assignedAt?: string;
  /** Whether this is an organization admin */
  isOrgAdmin?: boolean;
}

export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface LogEntry {
  id: number;
  createdAt: string;
  level: LogLevel;
  context?: string | null;
  message: string;
  stack?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LogSettings {
  id: number;
  retentionDays: number;
  autoCleanupEnabled: boolean;
  updatedAt: string;
}

export interface LogResponse {
  items: LogEntry[];
  count: number;
  settings: LogSettings;
}

export type ConfigurationValueType =
  | 'string'
  | 'boolean'
  | 'enum'
  | 'secret'
  | 'json';

export interface ConfigurationSettingSummary {
  key: string;
  label: string;
  description?: string;
  valueType: ConfigurationValueType;
  value: string | boolean | null;
  hasValue: boolean;
  isSensitive: boolean;
  isEditable: boolean;
  isReadOnly: boolean;
  options?: string[] | null;
  metadata?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface ConfigurationCategorySummary {
  key: 'environment' | 'oauth' | 'feature-flags';
  label: string;
  description?: string;
  settings: ConfigurationSettingSummary[];
}

export interface OAuthCallbackSummary {
  provider: 'google' | 'microsoft';
  authCallback: string;
  calendarSyncCallback: string;
}

export interface ConfigurationOverview {
  categories: ConfigurationCategorySummary[];
  derived: {
    oauthCallbacks: OAuthCallbackSummary[];
    backendBaseUrl: string;
    frontendBaseUrl: string;
  };
}
