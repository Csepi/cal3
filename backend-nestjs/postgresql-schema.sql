-- =============================================
-- Cal3 Calendar Application
-- PostgreSQL Database Schema
-- Version: 1.3.0
-- =============================================

-- Drop existing tables if they exist (in correct order to respect foreign keys)
DROP TABLE IF EXISTS automation_audit_logs CASCADE;
DROP TABLE IF EXISTS automation_actions CASCADE;
DROP TABLE IF EXISTS automation_conditions CASCADE;
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS organisation_resource_type_permissions CASCADE;
DROP TABLE IF EXISTS organisation_calendar_permissions CASCADE;
DROP TABLE IF EXISTS reservation_calendar_roles CASCADE;
DROP TABLE IF EXISTS reservation_calendars CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS operating_hours CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS resource_types CASCADE;
DROP TABLE IF EXISTS organisation_users CASCADE;
DROP TABLE IF EXISTS organisation_admins CASCADE;
DROP TABLE IF EXISTS sync_event_mappings CASCADE;
DROP TABLE IF EXISTS synced_calendars CASCADE;
DROP TABLE IF EXISTS calendar_sync_connections CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS calendar_shares CASCADE;
DROP TABLE IF EXISTS calendars CASCADE;
DROP TABLE IF EXISTS calendar_groups CASCADE;
DROP TABLE IF EXISTS organisations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('observer', 'user', 'admin')),
    "themeColor" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "weekStartDay" INTEGER NOT NULL DEFAULT 1,
    "defaultCalendarView" VARCHAR(20) NOT NULL DEFAULT 'month',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "timeFormat" VARCHAR(10) NOT NULL DEFAULT '24h',
    "usagePlans" JSON NOT NULL DEFAULT '["user"]',
    "hideReservationsTab" BOOLEAN NOT NULL DEFAULT false,
    "hiddenResourceIds" JSON,
    "visibleCalendarIds" JSON,
    "visibleResourceTypeIds" JSON,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- 2. ORGANISATIONS TABLE
-- =============================================
CREATE TABLE organisations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canViewAllCalendars" BOOLEAN NOT NULL DEFAULT false,
    "canEditAllCalendars" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteAllCalendars" BOOLEAN NOT NULL DEFAULT false,
    "canViewAllResources" BOOLEAN NOT NULL DEFAULT false,
    "canEditAllResources" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteAllResources" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organisations_name ON organisations(name);
CREATE INDEX idx_organisations_isActive ON organisations("isActive");

-- =============================================
-- CALENDAR_GROUPS TABLE
-- =============================================
CREATE TABLE calendar_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_calendar_groups_owner" FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_groups_owner ON calendar_groups("ownerId");

-- =============================================
-- 3. CALENDARS TABLE
-- =============================================
CREATE TABLE calendars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "organisationId" INTEGER,
    "groupId" INTEGER,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_calendars_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "FK_calendars_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL,
    CONSTRAINT "FK_calendars_group" FOREIGN KEY ("groupId") REFERENCES calendar_groups(id) ON DELETE SET NULL
);

CREATE INDEX idx_calendars_userId ON calendars("userId");
CREATE INDEX idx_calendars_organisationId ON calendars("organisationId");
CREATE INDEX idx_calendars_name ON calendars(name);
CREATE INDEX idx_calendars_groupId ON calendars("groupId");
-- =============================================
-- 4. CALENDAR_SHARES TABLE
-- =============================================
CREATE TABLE calendar_shares (
    id SERIAL PRIMARY KEY,
    "calendarId" INTEGER NOT NULL,
    "sharedWithUserId" INTEGER NOT NULL,
    permission VARCHAR(20) NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_calendar_shares_calendar" FOREIGN KEY ("calendarId") REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT "FK_calendar_shares_user" FOREIGN KEY ("sharedWithUserId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_shares_calendarId ON calendar_shares("calendarId");
CREATE INDEX idx_calendar_shares_sharedWithUserId ON calendar_shares("sharedWithUserId");

-- =============================================
-- 5. EVENTS TABLE
-- =============================================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    location VARCHAR(255),
    color VARCHAR(7),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "calendarId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "recurrenceRule" VARCHAR(500),
    "recurrenceId" VARCHAR(255),
    "recurrenceException" TEXT,
    timezone VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    "externalEventId" VARCHAR(500),
    "externalCalendarId" VARCHAR(500),
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'google', 'outlook', 'apple')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_events_calendar" FOREIGN KEY ("calendarId") REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT "FK_events_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_calendarId ON events("calendarId");
CREATE INDEX idx_events_userId ON events("userId");
CREATE INDEX idx_events_startTime ON events("startTime");
CREATE INDEX idx_events_endTime ON events("endTime");
CREATE INDEX idx_events_recurrenceId ON events("recurrenceId");
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_time_range ON events("startTime", "endTime");

-- =============================================
-- 6. CALENDAR_SYNC_CONNECTIONS TABLE
-- =============================================
CREATE TABLE calendar_sync_connections (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP,
    email VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_calendar_sync_connections_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_sync_connections_userId ON calendar_sync_connections("userId");
CREATE INDEX idx_calendar_sync_connections_provider ON calendar_sync_connections(provider);

-- =============================================
-- 7. SYNCED_CALENDARS TABLE
-- =============================================
CREATE TABLE synced_calendars (
    id SERIAL PRIMARY KEY,
    "connectionId" INTEGER NOT NULL,
    "externalCalendarId" VARCHAR(500) NOT NULL,
    "externalCalendarName" VARCHAR(255) NOT NULL,
    "localCalendarId" INTEGER,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP,
    "syncDirection" VARCHAR(20) NOT NULL DEFAULT 'import' CHECK ("syncDirection" IN ('import', 'export', 'bidirectional')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_synced_calendars_connection" FOREIGN KEY ("connectionId") REFERENCES calendar_sync_connections(id) ON DELETE CASCADE,
    CONSTRAINT "FK_synced_calendars_local_calendar" FOREIGN KEY ("localCalendarId") REFERENCES calendars(id) ON DELETE SET NULL
);

CREATE INDEX idx_synced_calendars_connectionId ON synced_calendars("connectionId");
CREATE INDEX idx_synced_calendars_externalCalendarId ON synced_calendars("externalCalendarId");
CREATE INDEX idx_synced_calendars_localCalendarId ON synced_calendars("localCalendarId");

-- =============================================
-- 8. SYNC_EVENT_MAPPINGS TABLE
-- =============================================
CREATE TABLE sync_event_mappings (
    id SERIAL PRIMARY KEY,
    "syncedCalendarId" INTEGER NOT NULL,
    "localEventId" INTEGER,
    "externalEventId" VARCHAR(500) NOT NULL,
    "lastSyncedAt" TIMESTAMP NOT NULL,
    "iCalUID" VARCHAR(500),
    "syncStatus" VARCHAR(20) NOT NULL DEFAULT 'synced' CHECK ("syncStatus" IN ('synced', 'pending', 'error')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_sync_event_mappings_synced_calendar" FOREIGN KEY ("syncedCalendarId") REFERENCES synced_calendars(id) ON DELETE CASCADE,
    CONSTRAINT "FK_sync_event_mappings_local_event" FOREIGN KEY ("localEventId") REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX idx_sync_event_mappings_syncedCalendarId ON sync_event_mappings("syncedCalendarId");
CREATE INDEX idx_sync_event_mappings_localEventId ON sync_event_mappings("localEventId");
CREATE INDEX idx_sync_event_mappings_externalEventId ON sync_event_mappings("externalEventId");

-- =============================================
-- 9. ORGANISATION_ADMINS TABLE
-- =============================================
CREATE TABLE organisation_admins (
    id SERIAL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_organisation_admins_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT "FK_organisation_admins_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_organisation_admins_organisationId ON organisation_admins("organisationId");
CREATE INDEX idx_organisation_admins_userId ON organisation_admins("userId");

-- =============================================
-- 10. ORGANISATION_USERS TABLE
-- =============================================
CREATE TABLE organisation_users (
    id SERIAL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_organisation_users_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT "FK_organisation_users_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_organisation_users_organisationId ON organisation_users("organisationId");
CREATE INDEX idx_organisation_users_userId ON organisation_users("userId");

-- =============================================
-- 11. RESOURCE_TYPES TABLE
-- =============================================
CREATE TABLE resource_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    icon VARCHAR(50),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "maxBookingDuration" INTEGER,
    "minBookingDuration" INTEGER,
    "bookingIncrement" INTEGER NOT NULL DEFAULT 30,
    "organisationId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_resource_types_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX idx_resource_types_organisationId ON resource_types("organisationId");
CREATE INDEX idx_resource_types_name ON resource_types(name);

-- =============================================
-- 12. RESOURCES TABLE
-- =============================================
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "resourceTypeId" INTEGER NOT NULL,
    "organisationId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    location VARCHAR(255),
    capacity INTEGER,
    "publicBookingToken" VARCHAR(500),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_resources_resource_type" FOREIGN KEY ("resourceTypeId") REFERENCES resource_types(id) ON DELETE CASCADE,
    CONSTRAINT "FK_resources_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX idx_resources_resourceTypeId ON resources("resourceTypeId");
CREATE INDEX idx_resources_publicBookingToken ON resources("publicBookingToken");
CREATE INDEX idx_resources_name ON resources(name);
CREATE INDEX idx_resources_organisationId ON resources("organisationId");

-- =============================================
-- 13. OPERATING_HOURS TABLE
-- =============================================
CREATE TABLE operating_hours (
    id SERIAL PRIMARY KEY,
    "resourceId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_operating_hours_resource" FOREIGN KEY ("resourceId") REFERENCES resources(id) ON DELETE CASCADE
);

CREATE INDEX idx_operating_hours_resourceId ON operating_hours("resourceId");
CREATE INDEX idx_operating_hours_dayOfWeek ON operating_hours("dayOfWeek");

-- =============================================
-- 14. RESERVATIONS TABLE
-- =============================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    "resourceId" INTEGER NOT NULL,
    "userId" INTEGER,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    "guestName" VARCHAR(255),
    "guestEmail" VARCHAR(255),
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP,
    "organisationId" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_reservations_resource" FOREIGN KEY ("resourceId") REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT "FK_reservations_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT "FK_reservations_approver" FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT "FK_reservations_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX idx_reservations_resourceId ON reservations("resourceId");
CREATE INDEX idx_reservations_userId ON reservations("userId");
CREATE INDEX idx_reservations_startTime ON reservations("startTime");
CREATE INDEX idx_reservations_endTime ON reservations("endTime");
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time_range ON reservations("startTime", "endTime");
CREATE INDEX idx_reservations_organisationId ON reservations("organisationId");

-- =============================================
-- 15. RESERVATION_CALENDARS TABLE
-- =============================================
CREATE TABLE reservation_calendars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "resourceTypeId" INTEGER NOT NULL,
    "organisationId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_reservation_calendars_resource_type" FOREIGN KEY ("resourceTypeId") REFERENCES resource_types(id) ON DELETE CASCADE,
    CONSTRAINT "FK_reservation_calendars_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX idx_reservation_calendars_resourceTypeId ON reservation_calendars("resourceTypeId");
CREATE INDEX idx_reservation_calendars_organisationId ON reservation_calendars("organisationId");

-- =============================================
-- 16. RESERVATION_CALENDAR_ROLES TABLE
-- =============================================
CREATE TABLE reservation_calendar_roles (
    id SERIAL PRIMARY KEY,
    "reservationCalendarId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'REVIEWER' CHECK (role IN ('EDITOR', 'REVIEWER')),
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_reservation_calendar_roles_calendar" FOREIGN KEY ("reservationCalendarId") REFERENCES reservation_calendars(id) ON DELETE CASCADE,
    CONSTRAINT "FK_reservation_calendar_roles_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reservation_calendar_roles_reservationCalendarId ON reservation_calendar_roles("reservationCalendarId");
CREATE INDEX idx_reservation_calendar_roles_userId ON reservation_calendar_roles("userId");

-- =============================================
-- 17. ORGANISATION_CALENDAR_PERMISSIONS TABLE
-- =============================================
CREATE TABLE organisation_calendar_permissions (
    id SERIAL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "calendarId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_org_cal_permissions_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT "FK_org_cal_permissions_calendar" FOREIGN KEY ("calendarId") REFERENCES calendars(id) ON DELETE CASCADE
);

CREATE INDEX idx_org_cal_permissions_organisationId ON organisation_calendar_permissions("organisationId");
CREATE INDEX idx_org_cal_permissions_calendarId ON organisation_calendar_permissions("calendarId");

-- =============================================
-- 18. ORGANISATION_RESOURCE_TYPE_PERMISSIONS TABLE
-- =============================================
CREATE TABLE organisation_resource_type_permissions (
    id SERIAL PRIMARY KEY,
    "organisationId" INTEGER NOT NULL,
    "resourceTypeId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_org_res_permissions_organisation" FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT "FK_org_res_permissions_resource_type" FOREIGN KEY ("resourceTypeId") REFERENCES resource_types(id) ON DELETE CASCADE
);

CREATE INDEX idx_org_res_permissions_organisationId ON organisation_resource_type_permissions("organisationId");
CREATE INDEX idx_org_res_permissions_resourceTypeId ON organisation_resource_type_permissions("resourceTypeId");

-- =============================================
-- 19. AUTOMATION_RULES TABLE
-- =============================================
CREATE TABLE automation_rules (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "triggerType" VARCHAR(50) NOT NULL CHECK ("triggerType" IN ('event.created', 'event.updated', 'event.deleted', 'event.starts_in', 'event.ends_in', 'calendar.imported', 'scheduled.time')),
    "triggerConfig" JSON,
    "conditionLogic" VARCHAR(3) NOT NULL DEFAULT 'AND' CHECK ("conditionLogic" IN ('AND', 'OR')),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_automation_rules_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_rules_userId ON automation_rules("userId");
CREATE INDEX idx_automation_rules_triggerType ON automation_rules("triggerType");
CREATE INDEX idx_automation_rules_isActive ON automation_rules("isActive");

-- =============================================
-- 20. AUTOMATION_CONDITIONS TABLE
-- =============================================
CREATE TABLE automation_conditions (
    id SERIAL PRIMARY KEY,
    "ruleId" INTEGER NOT NULL,
    field VARCHAR(100) NOT NULL,
    operator VARCHAR(50) NOT NULL CHECK (operator IN ('equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'matches_regex', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_true', 'is_false', 'is_null', 'is_not_null', 'in', 'not_in', 'between')),
    value TEXT,
    "valueType" VARCHAR(20) NOT NULL DEFAULT 'string' CHECK ("valueType" IN ('string', 'number', 'boolean', 'date', 'array')),
    negate BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_automation_conditions_rule" FOREIGN KEY ("ruleId") REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_conditions_ruleId ON automation_conditions("ruleId");

-- =============================================
-- 21. AUTOMATION_ACTIONS TABLE
-- =============================================
CREATE TABLE automation_actions (
    id SERIAL PRIMARY KEY,
    "ruleId" INTEGER NOT NULL,
    "actionType" VARCHAR(50) NOT NULL CHECK ("actionType" IN ('set_event_color', 'send_notification', 'modify_event_title', 'modify_event_description', 'create_task', 'webhook', 'create_reminder', 'move_to_calendar')),
    "actionConfig" JSON NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_automation_actions_rule" FOREIGN KEY ("ruleId") REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_actions_ruleId ON automation_actions("ruleId");

-- =============================================
-- 22. AUTOMATION_AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE automation_audit_logs (
    id SERIAL PRIMARY KEY,
    "ruleId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "triggerType" VARCHAR(50) NOT NULL,
    "triggerContext" JSON,
    "conditionsResult" JSON NOT NULL,
    "actionResults" JSON,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial_success', 'failure', 'skipped')),
    "errorMessage" TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    "executedByUserId" INTEGER,
    "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_automation_audit_logs_rule" FOREIGN KEY ("ruleId") REFERENCES automation_rules(id) ON DELETE CASCADE,
    CONSTRAINT "FK_automation_audit_logs_event" FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT "FK_automation_audit_logs_executedBy" FOREIGN KEY ("executedByUserId") REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs("ruleId");
CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs("eventId");
CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs("executedAt");
CREATE INDEX idx_audit_logs_rule_executed ON automation_audit_logs("ruleId", "executedAt");

-- =============================================
-- Schema Creation Complete
-- =============================================
-- Total tables created: 22
-- Total indexes created: 70+
