-- =============================================
-- Cal3 Calendar Application - Azure SQL Database Schema
-- Version: 1.3.0
-- Generated: 2025-10-20
-- Target: Azure SQL Database
-- =============================================

-- Note: Azure SQL uses slightly different syntax than PostgreSQL
-- JSON types are stored as NVARCHAR(MAX) with JSON validation
-- SERIAL becomes IDENTITY(1,1)

BEGIN TRANSACTION;

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    firstName NVARCHAR(100) NULL,
    lastName NVARCHAR(100) NULL,
    isActive BIT NOT NULL DEFAULT 1,
    role NVARCHAR(20) NOT NULL DEFAULT 'user',
    themeColor NVARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    weekStartDay INT NOT NULL DEFAULT 1,
    defaultCalendarView NVARCHAR(20) NOT NULL DEFAULT 'month',
    timezone NVARCHAR(100) NOT NULL DEFAULT 'UTC',
    timeFormat NVARCHAR(10) NOT NULL DEFAULT '24h',
    usagePlans NVARCHAR(MAX) NOT NULL DEFAULT '["user"]',
    hideReservationsTab BIT NOT NULL DEFAULT 0,
    hiddenResourceIds NVARCHAR(MAX) NULL,
    visibleCalendarIds NVARCHAR(MAX) NULL,
    visibleResourceTypeIds NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_users_role CHECK (role IN ('observer', 'user', 'admin'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- 2. ORGANISATIONS TABLE
-- =============================================
CREATE TABLE organisations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(MAX) NULL,
    address NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    email NVARCHAR(255) NULL,
    isActive BIT NOT NULL DEFAULT 1,
    useGranularResourcePermissions BIT NOT NULL DEFAULT 0,
    useGranularCalendarPermissions BIT NOT NULL DEFAULT 0,
    color NVARCHAR(7) NOT NULL DEFAULT '#f97316',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_organisations_name ON organisations(name);
CREATE INDEX idx_organisations_isActive ON organisations(isActive);

-- =============================================
-- 3. CALENDAR_GROUPS TABLE
-- =============================================
CREATE TABLE calendar_groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    isVisible BIT NOT NULL DEFAULT 1,
    ownerId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_calendar_groups_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_groups_ownerId ON calendar_groups(ownerId);

-- =============================================
-- 4. CALENDARS TABLE
-- =============================================
CREATE TABLE calendars (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(500) NULL,
    color NVARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    visibility NVARCHAR(20) NOT NULL DEFAULT 'private',
    isActive BIT NOT NULL DEFAULT 1,
    isReservationCalendar BIT NOT NULL DEFAULT 0,
    isTasksCalendar BIT NOT NULL DEFAULT 0,
    rank INT NOT NULL DEFAULT 0,
    organisationId INT NULL,
    ownerId INT NOT NULL,
    groupId INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_calendars_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_calendars_group FOREIGN KEY (groupId) REFERENCES calendar_groups(id) ON DELETE SET NULL,
    CONSTRAINT CK_calendars_visibility CHECK (visibility IN ('private', 'shared', 'public'))
);

CREATE INDEX idx_calendars_ownerId ON calendars(ownerId);
CREATE INDEX idx_calendars_visibility ON calendars(visibility);
CREATE INDEX idx_calendars_isReservationCalendar ON calendars(isReservationCalendar);
CREATE INDEX idx_calendars_groupId ON calendars(groupId) WHERE groupId IS NOT NULL;

-- =============================================
-- 4. CALENDAR_SHARES TABLE
-- =============================================
CREATE TABLE calendar_shares (
    id INT IDENTITY(1,1) PRIMARY KEY,
    calendarId INT NOT NULL,
    userId INT NOT NULL,
    permission NVARCHAR(20) NOT NULL DEFAULT 'read',
    sharedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_calendar_shares_calendar FOREIGN KEY (calendarId) REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT FK_calendar_shares_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT UQ_calendar_shares_calendar_user UNIQUE (calendarId, userId),
    CONSTRAINT CK_calendar_shares_permission CHECK (permission IN ('read', 'write', 'admin'))
);

CREATE INDEX idx_calendar_shares_calendarId ON calendar_shares(calendarId);
CREATE INDEX idx_calendar_shares_userId ON calendar_shares(userId);

-- =============================================
-- 5. EVENTS TABLE
-- =============================================
CREATE TABLE events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(300) NOT NULL,
    description NVARCHAR(MAX) NULL,
    startDate DATE NOT NULL,
    startTime TIME NULL,
    endDate DATE NULL,
    endTime TIME NULL,
    isAllDay BIT NOT NULL DEFAULT 0,
    location NVARCHAR(200) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'confirmed',
    recurrenceType NVARCHAR(20) NOT NULL DEFAULT 'none',
    recurrenceRule NVARCHAR(MAX) NULL,
    parentEventId INT NULL,
    recurrenceId NVARCHAR(100) NULL,
    originalDate DATE NULL,
    isRecurrenceException BIT NOT NULL DEFAULT 0,
    color NVARCHAR(7) NULL,
    notes NVARCHAR(MAX) NULL,
    calendarId INT NOT NULL,
    createdById INT NOT NULL,
    taskId INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_events_calendar FOREIGN KEY (calendarId) REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT FK_events_creator FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT CK_events_status CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    CONSTRAINT CK_events_recurrenceType CHECK (recurrenceType IN ('none', 'daily', 'weekly', 'monthly', 'yearly'))
);

CREATE INDEX idx_events_calendarId ON events(calendarId);
CREATE INDEX idx_events_createdById ON events(createdById);
CREATE INDEX idx_events_startDate ON events(startDate);
CREATE INDEX idx_events_recurrenceId ON events(recurrenceId);
CREATE INDEX idx_events_parentEventId ON events(parentEventId);
CREATE INDEX idx_events_calendar_startDate ON events(calendarId, startDate);

-- =============================================
-- 6. CALENDAR_SYNC_CONNECTIONS TABLE
-- =============================================
CREATE TABLE calendar_sync_connections (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    provider NVARCHAR(20) NOT NULL,
    providerUserId NVARCHAR(255) NULL,
    accessToken NVARCHAR(MAX) NULL,
    refreshToken NVARCHAR(MAX) NULL,
    tokenExpiresAt DATETIME2 NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    lastSyncAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_sync_connections_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT CK_sync_connections_provider CHECK (provider IN ('google', 'microsoft')),
    CONSTRAINT CK_sync_connections_status CHECK (status IN ('active', 'inactive', 'error'))
);

CREATE INDEX idx_sync_connections_userId ON calendar_sync_connections(userId);
CREATE INDEX idx_sync_connections_provider ON calendar_sync_connections(provider);
CREATE INDEX idx_sync_connections_status ON calendar_sync_connections(status);

-- =============================================
-- 7. SYNCED_CALENDARS TABLE
-- =============================================
CREATE TABLE synced_calendars (
    id INT IDENTITY(1,1) PRIMARY KEY,
    syncConnectionId INT NOT NULL,
    localCalendarId INT NOT NULL,
    externalCalendarId NVARCHAR(255) NOT NULL,
    externalCalendarName NVARCHAR(255) NOT NULL,
    bidirectionalSync BIT NOT NULL DEFAULT 1,
    lastSyncAt DATETIME2 NULL,
    syncToken NVARCHAR(500) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_synced_calendars_connection FOREIGN KEY (syncConnectionId) REFERENCES calendar_sync_connections(id) ON DELETE CASCADE,
    CONSTRAINT FK_synced_calendars_calendar FOREIGN KEY (localCalendarId) REFERENCES calendars(id) ON DELETE NO ACTION
);

CREATE INDEX idx_synced_calendars_syncConnectionId ON synced_calendars(syncConnectionId);
CREATE INDEX idx_synced_calendars_localCalendarId ON synced_calendars(localCalendarId);
CREATE INDEX idx_synced_calendars_externalCalendarId ON synced_calendars(externalCalendarId);

-- =============================================
-- 8. SYNC_EVENT_MAPPINGS TABLE
-- =============================================
CREATE TABLE sync_event_mappings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    syncedCalendarId INT NOT NULL,
    localEventId INT NOT NULL,
    externalEventId NVARCHAR(255) NOT NULL,
    lastModifiedLocal DATETIME2 NULL,
    lastModifiedExternal DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_sync_mappings_synced_calendar FOREIGN KEY (syncedCalendarId) REFERENCES synced_calendars(id) ON DELETE CASCADE
);

CREATE INDEX idx_sync_mappings_syncedCalendarId ON sync_event_mappings(syncedCalendarId);
CREATE INDEX idx_sync_mappings_localEventId ON sync_event_mappings(localEventId);
CREATE INDEX idx_sync_mappings_externalEventId ON sync_event_mappings(externalEventId);

-- =============================================
-- 9. ORGANISATION_ADMINS TABLE
-- =============================================
CREATE TABLE organisation_admins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organisationId INT NOT NULL,
    userId INT NOT NULL,
    assignedById INT NULL,
    assignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_org_admins_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT FK_org_admins_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_admins_assignedBy FOREIGN KEY (assignedById) REFERENCES users(id),
    CONSTRAINT UQ_org_admins_org_user UNIQUE (organisationId, userId)
);

CREATE INDEX idx_organisation_admins_organisationId ON organisation_admins(organisationId);
CREATE INDEX idx_organisation_admins_userId ON organisation_admins(userId);

-- =============================================
-- 10. ORGANISATION_USERS TABLE
-- =============================================
CREATE TABLE organisation_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organisationId INT NOT NULL,
    userId INT NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'user',
    assignedById INT NULL,
    isOrganisationAdmin BIT NOT NULL DEFAULT 0,
    assignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_org_users_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT FK_org_users_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_users_assignedBy FOREIGN KEY (assignedById) REFERENCES users(id),
    CONSTRAINT UQ_org_users_org_user UNIQUE (organisationId, userId),
    CONSTRAINT CK_org_users_role CHECK (role IN ('admin', 'editor', 'user'))
);

CREATE INDEX idx_organisation_users_organisationId ON organisation_users(organisationId);
CREATE INDEX idx_organisation_users_userId ON organisation_users(userId);

-- =============================================
-- 11. RESOURCE_TYPES TABLE
-- =============================================
CREATE TABLE resource_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    minBookingDuration INT NOT NULL DEFAULT 30,
    bufferTime INT NOT NULL DEFAULT 0,
    customerInfoFields NVARCHAR(MAX) NOT NULL DEFAULT '["name","phone","email"]',
    waitlistEnabled BIT NOT NULL DEFAULT 0,
    recurringEnabled BIT NOT NULL DEFAULT 0,
    isActive BIT NOT NULL DEFAULT 1,
    color NVARCHAR(7) NOT NULL DEFAULT '#f97316',
    organisationId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_resource_types_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id)
);

CREATE INDEX idx_resource_types_organisationId ON resource_types(organisationId);
CREATE INDEX idx_resource_types_isActive ON resource_types(isActive);

-- =============================================
-- 12. RESOURCES TABLE
-- =============================================
CREATE TABLE resources (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    capacity INT NOT NULL DEFAULT 1,
    isActive BIT NOT NULL DEFAULT 1,
    publicBookingToken NVARCHAR(100) NULL UNIQUE,
    resourceTypeId INT NOT NULL,
    organisationId INT NULL,
    managedById INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_resources_resource_type FOREIGN KEY (resourceTypeId) REFERENCES resource_types(id),
    CONSTRAINT FK_resources_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE SET NULL,
    CONSTRAINT FK_resources_manager FOREIGN KEY (managedById) REFERENCES users(id)
);

CREATE INDEX idx_resources_publicBookingToken ON resources(publicBookingToken);
CREATE INDEX idx_resources_isActive ON resources(isActive);
CREATE INDEX idx_resources_resourceTypeId ON resources(resourceTypeId);
CREATE INDEX idx_resources_organisationId ON resources(organisationId);

-- =============================================
-- 13. OPERATING_HOURS TABLE
-- =============================================
CREATE TABLE operating_hours (
    id INT IDENTITY(1,1) PRIMARY KEY,
    dayOfWeek INT NOT NULL,
    openTime TIME NOT NULL,
    closeTime TIME NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    resourceTypeId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_operating_hours_resource_type FOREIGN KEY (resourceTypeId) REFERENCES resource_types(id),
    CONSTRAINT CK_operating_hours_dayOfWeek CHECK (dayOfWeek >= 0 AND dayOfWeek <= 6)
);

CREATE INDEX idx_operating_hours_dayOfWeek ON operating_hours(dayOfWeek);
CREATE INDEX idx_operating_hours_resourceTypeId ON operating_hours(resourceTypeId);

-- =============================================
-- 14. RESERVATIONS TABLE
-- =============================================
CREATE TABLE reservations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    startTime DATETIME2 NOT NULL,
    endTime DATETIME2 NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    customerInfo NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    notes NVARCHAR(MAX) NULL,
    parentReservationId INT NULL,
    recurrencePattern NVARCHAR(MAX) NULL,
    resourceId INT NOT NULL,
    organisationId INT NULL,
    createdById INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_reservations_resource FOREIGN KEY (resourceId) REFERENCES resources(id),
    CONSTRAINT FK_reservations_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE SET NULL,
    CONSTRAINT FK_reservations_creator FOREIGN KEY (createdById) REFERENCES users(id),
    CONSTRAINT CK_reservations_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'waitlist'))
);

CREATE INDEX idx_reservations_startTime ON reservations(startTime);
CREATE INDEX idx_reservations_endTime ON reservations(endTime);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time_range ON reservations(startTime, endTime);
CREATE INDEX idx_reservations_resourceId ON reservations(resourceId);
CREATE INDEX idx_reservations_organisationId ON reservations(organisationId);

-- =============================================
-- 15. RESERVATION_CALENDARS TABLE
-- =============================================
CREATE TABLE reservation_calendars (
    id INT IDENTITY(1,1) PRIMARY KEY,
    calendarId INT NOT NULL,
    organisationId INT NOT NULL,
    createdById INT NULL,
    reservationRules NVARCHAR(MAX) NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_reservation_calendars_calendar FOREIGN KEY (calendarId) REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT FK_reservation_calendars_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE NO ACTION,
    CONSTRAINT FK_reservation_calendars_creator FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX idx_reservation_calendars_calendarId ON reservation_calendars(calendarId);
CREATE INDEX idx_reservation_calendars_organisationId ON reservation_calendars(organisationId);

-- =============================================
-- 16. RESERVATION_CALENDAR_ROLES TABLE
-- =============================================
CREATE TABLE reservation_calendar_roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reservationCalendarId INT NOT NULL,
    userId INT NOT NULL,
    role NVARCHAR(20) NOT NULL,
    assignedById INT NULL,
    isOrganisationAdmin BIT NOT NULL DEFAULT 0,
    assignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_res_cal_roles_reservation_calendar FOREIGN KEY (reservationCalendarId) REFERENCES reservation_calendars(id) ON DELETE CASCADE,
    CONSTRAINT FK_res_cal_roles_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_res_cal_roles_assignedBy FOREIGN KEY (assignedById) REFERENCES users(id),
    CONSTRAINT UQ_res_cal_roles_calendar_user UNIQUE (reservationCalendarId, userId),
    CONSTRAINT CK_res_cal_roles_role CHECK (role IN ('editor', 'reviewer'))
);

CREATE INDEX idx_reservation_calendar_roles_reservationCalendarId ON reservation_calendar_roles(reservationCalendarId);
CREATE INDEX idx_reservation_calendar_roles_userId ON reservation_calendar_roles(userId);

-- =============================================
-- 17. ORGANISATION_CALENDAR_PERMISSIONS TABLE
-- =============================================
CREATE TABLE organisation_calendar_permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organisationId INT NOT NULL,
    userId INT NOT NULL,
    reservationCalendarId INT NOT NULL,
    canView BIT NOT NULL DEFAULT 0,
    canEdit BIT NOT NULL DEFAULT 0,
    assignedById INT NULL,
    assignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_org_cal_perms_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT FK_org_cal_perms_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_cal_perms_reservation_calendar FOREIGN KEY (reservationCalendarId) REFERENCES reservation_calendars(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_cal_perms_assignedBy FOREIGN KEY (assignedById) REFERENCES users(id),
    CONSTRAINT UQ_org_cal_perms UNIQUE (organisationId, userId, reservationCalendarId)
);

CREATE INDEX idx_org_calendar_permissions_organisationId ON organisation_calendar_permissions(organisationId);
CREATE INDEX idx_org_calendar_permissions_userId ON organisation_calendar_permissions(userId);
CREATE INDEX idx_org_calendar_permissions_reservationCalendarId ON organisation_calendar_permissions(reservationCalendarId);

-- =============================================
-- 18. ORGANISATION_RESOURCE_TYPE_PERMISSIONS TABLE
-- =============================================
CREATE TABLE organisation_resource_type_permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organisationId INT NOT NULL,
    userId INT NOT NULL,
    resourceTypeId INT NOT NULL,
    canEdit BIT NOT NULL DEFAULT 0,
    assignedById INT NULL,
    assignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_org_res_perms_organisation FOREIGN KEY (organisationId) REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT FK_org_res_perms_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_res_perms_resource_type FOREIGN KEY (resourceTypeId) REFERENCES resource_types(id) ON DELETE NO ACTION,
    CONSTRAINT FK_org_res_perms_assignedBy FOREIGN KEY (assignedById) REFERENCES users(id),
    CONSTRAINT UQ_org_res_perms UNIQUE (organisationId, userId, resourceTypeId)
);

CREATE INDEX idx_org_resource_type_permissions_organisationId ON organisation_resource_type_permissions(organisationId);
CREATE INDEX idx_org_resource_type_permissions_userId ON organisation_resource_type_permissions(userId);
CREATE INDEX idx_org_resource_type_permissions_resourceTypeId ON organisation_resource_type_permissions(resourceTypeId);

-- =============================================
-- 19. AUTOMATION_RULES TABLE
-- =============================================
CREATE TABLE automation_rules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    triggerType NVARCHAR(50) NOT NULL,
    triggerConfig NVARCHAR(MAX) NULL,
    isEnabled BIT NOT NULL DEFAULT 1,
    conditionLogic NVARCHAR(10) NOT NULL DEFAULT 'AND',
    lastExecutedAt DATETIME2 NULL,
    executionCount INT NOT NULL DEFAULT 0,
    createdById INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_automation_rules_creator FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT CK_automation_rules_triggerType CHECK (triggerType IN ('event.created', 'event.updated', 'event.deleted', 'event.starts_in', 'event.ends_in', 'calendar.imported', 'scheduled.time')),
    CONSTRAINT CK_automation_rules_conditionLogic CHECK (conditionLogic IN ('AND', 'OR'))
);

CREATE INDEX idx_automation_rules_createdById ON automation_rules(createdById);
CREATE INDEX idx_automation_rules_isEnabled ON automation_rules(isEnabled);
CREATE INDEX idx_automation_rules_triggerType ON automation_rules(triggerType);
CREATE INDEX idx_automation_rules_enabled_trigger ON automation_rules(isEnabled, triggerType);

-- =============================================
-- 20. AUTOMATION_CONDITIONS TABLE
-- =============================================
CREATE TABLE automation_conditions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ruleId INT NOT NULL,
    field NVARCHAR(100) NOT NULL,
    operator NVARCHAR(50) NOT NULL,
    value NVARCHAR(MAX) NOT NULL,
    groupId NVARCHAR(36) NULL,
    logicOperator NVARCHAR(10) NOT NULL DEFAULT 'AND',
    [order] INT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_automation_conditions_rule FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE,
    CONSTRAINT CK_automation_conditions_logicOperator CHECK (logicOperator IN ('AND', 'OR', 'NOT'))
);

CREATE INDEX idx_automation_conditions_ruleId ON automation_conditions(ruleId);

-- =============================================
-- 21. AUTOMATION_ACTIONS TABLE
-- =============================================
CREATE TABLE automation_actions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ruleId INT NOT NULL,
    actionType NVARCHAR(50) NOT NULL,
    actionConfig NVARCHAR(MAX) NOT NULL,
    [order] INT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_automation_actions_rule FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE,
    CONSTRAINT CK_automation_actions_actionType CHECK (actionType IN ('set_event_color', 'send_notification', 'modify_event_title', 'modify_event_description', 'create_task', 'webhook', 'create_reminder', 'move_to_calendar'))
);

CREATE INDEX idx_automation_actions_ruleId ON automation_actions(ruleId);

-- =============================================
-- 22. AUTOMATION_AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE automation_audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ruleId INT NOT NULL,
    eventId INT NULL,
    triggerType NVARCHAR(50) NOT NULL,
    triggerContext NVARCHAR(MAX) NULL,
    conditionsResult NVARCHAR(MAX) NOT NULL,
    actionResults NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL,
    errorMessage NVARCHAR(MAX) NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    executedByUserId INT NULL,
    executedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_automation_audit_logs_rule FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE,
    CONSTRAINT FK_automation_audit_logs_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE NO ACTION,
    CONSTRAINT FK_automation_audit_logs_executedBy FOREIGN KEY (executedByUserId) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT CK_automation_audit_logs_status CHECK (status IN ('success', 'partial_success', 'failure', 'skipped'))
);

CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs(ruleId);
CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs(eventId);
CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs(executedAt);
CREATE INDEX idx_audit_logs_rule_executed ON automation_audit_logs(ruleId, executedAt);

COMMIT TRANSACTION;

-- =============================================
-- Schema Creation Complete
-- =============================================
PRINT 'Cal3 database schema created successfully!';
PRINT 'Total tables created: 22';
PRINT 'Total indexes created: 60+';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update backend .env file with new connection string';
PRINT '2. Run seed script to populate sample data (optional)';
PRINT '3. Test application connectivity';
