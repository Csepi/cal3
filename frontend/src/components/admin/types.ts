/**
 * Shared types and interfaces for admin panel components
 *
 * This file centralizes all type definitions used across the admin panel,
 * ensuring consistency and reducing duplication in admin-related components.
 */

import type {
  Calendar as CalendarBase,
  Event as EventBase,
  Organization as OrganizationBase,
  Resource as ResourceBase,
  User as UserBase,
} from '../../types';

export type User = UserBase & {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  usagePlans?: string[];
};
export type Calendar = CalendarBase;
export type Event = EventBase;

export interface CalendarShare {
  id: number;
  permission: string;
  createdAt: string;
  calendar: Calendar;
  sharedWith: User;
}

export type Resource = ResourceBase & { resourceType: ResourceType };

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
  recurrencePattern?: Record<string, unknown>;
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
  data?: unknown;
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
  | 'logs'
  | 'errors'
  | 'compliance';

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

export type Organisation = OrganizationBase & {
  isActive?: boolean;
  adminCount?: number;
  userCount?: number;
  calendarCount?: number;
};

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

export type LogLevel =
  | 'log'
  | 'info'
  | 'error'
  | 'warn'
  | 'debug'
  | 'verbose'
  | 'trace';

export type AuditSeverity = 'info' | 'warn' | 'critical';
export type AuditOutcome = 'success' | 'failure' | 'denied';
export type AuditCategory =
  | 'security'
  | 'permission'
  | 'mutation'
  | 'api_error'
  | 'frontend_error'
  | 'system';

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
  realtimeCriticalAlertsEnabled: boolean;
  errorRateAlertThresholdPerMinute: number;
  p95LatencyAlertThresholdMs: number;
  metricsRetentionHours: number;
  auditRetentionDays: number;
  updatedAt: string;
}

export interface LogResponse {
  items: LogEntry[];
  count: number;
  settings: LogSettings;
}

export interface AuditEvent {
  id: number;
  createdAt: string;
  category: AuditCategory;
  action: string;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  requestId?: string | null;
  userId?: number | null;
  organisationId?: number | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  method?: string | null;
  path?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditEventResponse {
  success: boolean;
  items: AuditEvent[];
  count: number;
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
  source: 'database' | 'environment' | 'default';
  isUsingDefault: boolean;
  defaultValue: string | boolean | null;
  isSensitive: boolean;
  isEditable: boolean;
  isReadOnly: boolean;
  options?: string[] | null;
  metadata?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface ConfigurationCategorySummary {
  key: 'environment' | 'oauth' | 'feature-flags' | 'notifications';
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

export interface ComplianceControl {
  id: string;
  framework: 'GDPR' | 'SOC2' | 'ISO27001' | 'ASVS';
  control: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  evidence: string;
}

export interface ComplianceDashboard {
  generatedAt: string;
  summary: {
    users: {
      total: number;
      active: number;
      admins: number;
    };
    dsr: Record<string, Record<string, number>>;
    consent: {
      acceptedPrivacyPolicy: number;
      totalUsers: number;
      ratio: number;
    };
    mfa: {
      enabledCount: number;
      totalUsers: number;
      ratio: number;
    };
    errorSummary: {
      criticalCount: number;
      failureCount: number;
      topErrorCodes: Array<{ code: string; count: number }>;
      trend: Array<{ hour: string; count: number }>;
    };
  };
  settings: {
    appLogRetentionDays: number;
    auditRetentionDays: number;
  };
  controls: ComplianceControl[];
}

export interface DataSubjectRequestItem {
  id: number;
  userId: number;
  requestType: 'access' | 'export' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  reason: string | null;
  adminNotes: string | null;
  handledByUserId: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface DataSubjectRequestResponse {
  count: number;
  items: DataSubjectRequestItem[];
}

export interface ComplianceAccessReview {
  generatedAt: string;
  privilegedAccounts: Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    mfaEnabled: boolean;
    updatedAt: string;
    lastLoginAt: string | null;
  }>;
  organisationAdmins: Array<{
    organisationId: number;
    userId: number;
    assignedAt: string;
    user: {
      username: string;
      email: string;
      mfaEnabled: boolean;
    } | null;
  }>;
  staleAccessCandidates: Array<{
    userId: number;
    username: string;
    email: string;
    role: string;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
  }>;
}

