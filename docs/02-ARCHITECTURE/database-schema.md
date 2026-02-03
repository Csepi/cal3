# Database Schema

Last updated: 2026-02-03

[‹ Architecture](./README.md)

## ER Overview
`	ext
users 1---* calendars 1---* events
organisations 1---* resource_types 1---* resources 1---* reservations
users 1---* tasks (*-* labels)
automation_rules 1---* conditions/actions/audit_logs
`

## Core Tables
- Users, RefreshTokens, UserNotificationPreferences
- Calendars, CalendarShares, Events, EventComments
- Organisations, OrganisationUsers, OrganisationAdmins
- ResourceTypes, Resources, Reservations, OperatingHours
- AutomationRules, AutomationConditions, AutomationActions, AutomationAuditLogs
- NotificationMessages, NotificationDeliveries, NotificationThreads, PushDeviceTokens
- Tasks, TaskLabels, TaskLabelAssignments

## Key Constraints
- FK integrity across all tenant-scoped models
- Unique constraints for identity and share mappings
- Indexes on frequent filters: user/org/calendar/time/status