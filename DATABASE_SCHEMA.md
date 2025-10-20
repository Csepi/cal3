# Cal3 Calendar Application - Complete Database Schema Documentation

**Version:** 1.3.0
**Last Updated:** 2025-10-20
**Database Type:** PostgreSQL (Primary) / SQLite (Development)
**ORM:** TypeORM 0.3.26

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Configuration](#database-configuration)
4. [Complete Schema Definition](#complete-schema-definition)
5. [Entity Relationships](#entity-relationships)
6. [Indexes and Performance](#indexes-and-performance)
7. [Enums and Type Definitions](#enums-and-type-definitions)
8. [Database Replication Guide](#database-replication-guide)
9. [Seed Data](#seed-data)
10. [SQL Schema Reference](#sql-schema-reference)
11. [Backup and Maintenance](#backup-and-maintenance)

---

## Overview

The Cal3 calendar application uses a comprehensive relational database schema with **20 entities** organized into 8 functional domains:

1. **Core User & Authentication** (1 entity) - User management and profiles
2. **Calendar Management** (2 entities) - Calendar ownership and sharing
3. **Event Management** (1 entity) - Event storage with recurrence
4. **Calendar Synchronization** (3 entities) - External calendar integration
5. **Organization Management** (3 entities) - Multi-tenant organization structure
6. **Granular Permissions** (2 entities) - Fine-grained access control
7. **Reservation System** (6 entities) - Resource booking and management
8. **Automation System** (4 entities) - Rule-based automation engine

### Key Features

- **Multi-tenancy**: Organization-based user grouping
- **Calendar Sharing**: Flexible permission-based calendar sharing
- **External Sync**: Bidirectional sync with Google and Microsoft calendars
- **Reservation System**: Resource booking with operating hours and waitlists
- **Automation Engine**: Rule-based event automation with audit trail
- **Recurrence Management**: Complex recurring event patterns
- **Granular Permissions**: Fine-grained resource and calendar access control
- **Usage Plans**: Subscription-tier based feature access

---

## Technology Stack

### Database Engines

- **Primary**: PostgreSQL 12+ (Production, Cloud-ready)
- **Secondary**: SQLite 3 (Development, Testing)

### ORM and Tools

- **ORM**: TypeORM 0.3.26
- **Language**: TypeScript 5.7.3
- **Runtime**: Node.js 18+
- **Framework**: NestJS 11.0.1

### Database Features Used

- **JSON Columns**: Complex data structures (PostgreSQL native, SQLite text)
- **Timestamps**: Automatic created/updated tracking
- **Foreign Keys**: Referential integrity with cascade behaviors
- **Unique Constraints**: Data uniqueness enforcement
- **Indexes**: Performance optimization
- **Enums**: Type-safe categorical data

---

## Database Configuration

### Environment Variables

```bash
# Database Type Selection
DB_TYPE=postgres              # or 'sqlite'

# PostgreSQL Configuration
DB_HOST=localhost             # Database host
DB_PORT=5432                  # Database port
DB_USERNAME=postgres          # Database username
DB_PASSWORD=your-password     # Database password
DB_NAME=cal3                  # Database name

# SSL Configuration (for cloud databases)
DB_SSL=true                   # Enable SSL/TLS
DB_SSL_REJECT_UNAUTHORIZED=true  # Verify SSL certificates

# Connection Pool Settings
DB_POOL_MAX=10                # Maximum connections
DB_POOL_MIN=2                 # Minimum connections
DB_IDLE_TIMEOUT=30000         # Idle timeout (ms)
DB_CONNECTION_TIMEOUT=10000   # Connection timeout (ms)

# Development Settings
DB_SYNCHRONIZE=true           # Auto-sync schema (dev only)
DB_LOGGING=true               # Enable SQL logging

# SQLite Configuration (alternative)
DB_DATABASE=cal3.db           # SQLite file path
```

### Connection Configuration

The application auto-configures based on `DB_TYPE`:

**PostgreSQL Mode:**
- Full-featured production setup
- SSL support for Azure/AWS
- Connection pooling
- Advanced diagnostics

**SQLite Mode:**
- File-based storage
- Single-user development
- Automatic schema sync
- No SSL required

### TypeORM Configuration Location

See [app.module.ts:53-134](backend-nestjs/src/app.module.ts#L53-L134) for complete TypeORM configuration.

---

## Complete Schema Definition

### Domain 1: Core User & Authentication

#### Entity: **User**

**Table Name:** `users`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique user identifier |
| `username` | VARCHAR(255) | UNIQUE, NOT NULL | - | Login username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | - | User email address |
| `password` | VARCHAR(255) | NOT NULL | - | Hashed password (excluded from API) |
| `firstName` | VARCHAR(100) | NULLABLE | NULL | User's first name |
| `lastName` | VARCHAR(100) | NULLABLE | NULL | User's last name |
| `isActive` | BOOLEAN | NOT NULL | `true` | Account active status |
| `role` | VARCHAR | NOT NULL | `'user'` | User role: observer, user, admin |
| `themeColor` | VARCHAR(7) | NOT NULL | `'#3b82f6'` | UI theme color (hex) |
| `weekStartDay` | INTEGER | NOT NULL | `1` | Week start (0=Sunday, 1=Monday) |
| `defaultCalendarView` | VARCHAR | NOT NULL | `'month'` | Default view: month or week |
| `timezone` | VARCHAR | NOT NULL | `'UTC'` | IANA timezone (70+ supported) |
| `timeFormat` | VARCHAR | NOT NULL | `'24h'` | Time format: 12h or 24h |
| `usagePlans` | JSON | NOT NULL | `["user"]` | Array of subscription tiers |
| `hideReservationsTab` | BOOLEAN | NOT NULL | `false` | Hide reservations UI |
| `hiddenResourceIds` | JSON | NULLABLE | NULL | Array of hidden resource IDs |
| `visibleCalendarIds` | JSON | NULLABLE | NULL | Array of visible calendar IDs (null = all) |
| `visibleResourceTypeIds` | JSON | NULLABLE | NULL | Array of visible resource type IDs (null = all) |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Account creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `ownedCalendars`: OneToMany → Calendar (cascade delete)
- `sharedCalendars`: ManyToMany → Calendar (through calendar_shares)
- `createdEvents`: OneToMany → Event (cascade delete)
- `organisations`: ManyToMany → Organisation (through organisation_users)
- `organisationAdminRoles`: OneToMany → OrganisationAdmin
- `assignedOrganisationAdminRoles`: OneToMany → OrganisationAdmin (as assignedBy)
- `reservationCalendarRoles`: OneToMany → ReservationCalendarRole
- `assignedReservationCalendarRoles`: OneToMany → ReservationCalendarRole (as assignedBy)

**Business Logic:**
- Password must be hashed using bcryptjs before storage
- Username and email must be unique across all users
- themeColor supports 16 predefined colors in rainbow order
- timezone supports 70+ IANA timezones across all continents
- usagePlans can contain: child, user, store, enterprise
- visibleCalendarIds = null means all calendars visible

**Entity File:** [user.entity.ts](backend-nestjs/src/entities/user.entity.ts)

---

### Domain 2: Calendar Management

#### Entity: **Calendar**

**Table Name:** `calendars`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique calendar identifier |
| `name` | VARCHAR(200) | NOT NULL | - | Calendar display name |
| `description` | VARCHAR(500) | NULLABLE | NULL | Calendar description |
| `color` | VARCHAR(7) | NOT NULL | `'#3b82f6'` | Calendar color (hex) |
| `visibility` | VARCHAR | NOT NULL | `'private'` | Visibility: private, shared, public |
| `isActive` | BOOLEAN | NOT NULL | `true` | Calendar active status |
| `isReservationCalendar` | BOOLEAN | NOT NULL | `false` | Is this a reservation calendar? |
| `organisationId` | INTEGER | NULLABLE | NULL | Linked organisation for reservation calendars |
| `ownerId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | Calendar owner |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `owner`: ManyToOne → User (cascade delete on user delete)
- `sharedWith`: ManyToMany → User (through calendar_shares join table)
- `events`: OneToMany → Event (cascade delete)
- `reservationCalendarConfig`: OneToMany → ReservationCalendar

**Business Logic:**
- Visibility controls who can see the calendar:
  - `private`: Only owner and explicitly shared users
  - `shared`: Shared with specific users
  - `public`: Visible to all authenticated users
- Reservation calendars have `isReservationCalendar = true`
- Deletion of owner cascades to delete calendar and all events

**Entity File:** [calendar.entity.ts](backend-nestjs/src/entities/calendar.entity.ts)

---

#### Entity: **CalendarShare**

**Table Name:** `calendar_shares`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique share identifier |
| `calendarId` | INTEGER | FOREIGN KEY → calendars.id | NOT NULL | Shared calendar |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | User receiving access |
| `permission` | VARCHAR | NOT NULL | `'read'` | Permission: read, write, admin |
| `sharedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | When access was granted |

**Relationships:**
- `calendar`: ManyToOne → Calendar (cascade delete)
- `user`: ManyToOne → User (cascade delete)

**Business Logic:**
- Permission levels:
  - `read`: View calendar and events only
  - `write`: Create, edit, delete events
  - `admin`: Full control including sharing
- Deletion of calendar or user cascades to delete share

**Entity File:** [calendar.entity.ts](backend-nestjs/src/entities/calendar.entity.ts)

---

### Domain 3: Event Management

#### Entity: **Event**

**Table Name:** `events`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique event identifier |
| `title` | VARCHAR(300) | NOT NULL | - | Event title/name |
| `description` | TEXT | NULLABLE | NULL | Event description |
| `startDate` | DATE | NOT NULL | - | Event start date |
| `startTime` | TIME | NULLABLE | NULL | Event start time (null for all-day) |
| `endDate` | DATE | NULLABLE | NULL | Event end date |
| `endTime` | TIME | NULLABLE | NULL | Event end time |
| `isAllDay` | BOOLEAN | NOT NULL | `false` | All-day event flag |
| `location` | VARCHAR(200) | NULLABLE | NULL | Event location |
| `status` | VARCHAR | NOT NULL | `'confirmed'` | Status: confirmed, tentative, cancelled |
| `recurrenceType` | VARCHAR | NOT NULL | `'none'` | Recurrence: none, daily, weekly, monthly, yearly |
| `recurrenceRule` | JSON | NULLABLE | NULL | Complex recurrence rules (iCal format) |
| `parentEventId` | INTEGER | NULLABLE | NULL | Parent event for recurring series |
| `recurrenceId` | VARCHAR | NULLABLE | NULL | Unique recurring series identifier |
| `originalDate` | DATE | NULLABLE | NULL | Original date for modified instances |
| `isRecurrenceException` | BOOLEAN | NOT NULL | `false` | True if modified recurring instance |
| `color` | VARCHAR(7) | NULLABLE | NULL | Event-specific color override |
| `notes` | TEXT | NULLABLE | NULL | Additional event notes |
| `calendarId` | INTEGER | FOREIGN KEY → calendars.id | NOT NULL | Parent calendar |
| `createdById` | INTEGER | FOREIGN KEY → users.id | NOT NULL | Event creator |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `calendar`: ManyToOne → Calendar (cascade delete)
- `createdBy`: ManyToOne → User (cascade delete)

**Business Logic:**
- All-day events have `isAllDay = true` and null start/end times
- Recurring events store parent event ID and recurrence ID
- Modified instances have `isRecurrenceException = true`
- Event color overrides calendar color when specified
- Recurrence rules stored as JSON following iCal RFC 5545 format
- Date/time handling respects user timezone settings

**Entity File:** [event.entity.ts](backend-nestjs/src/entities/event.entity.ts)

---

### Domain 4: Calendar Synchronization

#### Entity: **CalendarSyncConnection**

**Table Name:** `calendar_sync_connections`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique connection identifier |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | User who owns this connection |
| `provider` | VARCHAR | NOT NULL | - | Provider: google, microsoft |
| `providerUserId` | VARCHAR | NULLABLE | NULL | External provider user ID |
| `accessToken` | VARCHAR | NULLABLE | NULL | OAuth access token |
| `refreshToken` | VARCHAR | NULLABLE | NULL | OAuth refresh token |
| `tokenExpiresAt` | TIMESTAMP | NULLABLE | NULL | Access token expiration |
| `status` | VARCHAR | NOT NULL | `'active'` | Status: active, inactive, error |
| `lastSyncAt` | TIMESTAMP | NULLABLE | NULL | Last successful sync timestamp |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Connection creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `user`: ManyToOne → User (cascade delete)

**Business Logic:**
- OAuth tokens stored securely (consider encryption at rest)
- Access tokens refreshed automatically before expiration
- Status changes to 'error' on sync failures
- Deletion of user cascades to delete connection

**Entity File:** [calendar-sync.entity.ts](backend-nestjs/src/entities/calendar-sync.entity.ts)

---

#### Entity: **SyncedCalendar**

**Table Name:** `synced_calendars`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique synced calendar identifier |
| `syncConnectionId` | INTEGER | FOREIGN KEY → calendar_sync_connections.id | NOT NULL | Parent sync connection |
| `localCalendarId` | INTEGER | FOREIGN KEY → calendars.id | NOT NULL | Local Cal3 calendar |
| `externalCalendarId` | VARCHAR | NOT NULL | - | External provider calendar ID |
| `externalCalendarName` | VARCHAR | NOT NULL | - | External calendar display name |
| `bidirectionalSync` | BOOLEAN | NOT NULL | `true` | Sync both directions? |
| `lastSyncAt` | TIMESTAMP | NULLABLE | NULL | Last successful sync |
| `syncToken` | VARCHAR | NULLABLE | NULL | Provider sync token for delta sync |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Sync setup timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `syncConnection`: ManyToOne → CalendarSyncConnection (cascade delete)
- `localCalendar`: ManyToOne → Calendar (cascade delete)

**Business Logic:**
- Bidirectional sync when `bidirectionalSync = true`
- One-way sync (external → local) when `bidirectionalSync = false`
- Sync tokens enable efficient delta synchronization
- Deletion of connection or calendar cascades deletion

**Entity File:** [calendar-sync.entity.ts](backend-nestjs/src/entities/calendar-sync.entity.ts)

---

#### Entity: **SyncEventMapping**

**Table Name:** `sync_event_mappings`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique mapping identifier |
| `syncedCalendarId` | INTEGER | FOREIGN KEY → synced_calendars.id | NOT NULL | Parent synced calendar |
| `localEventId` | INTEGER | NOT NULL | - | Local Cal3 event ID |
| `externalEventId` | VARCHAR | NOT NULL | - | External provider event ID |
| `lastModifiedLocal` | TIMESTAMP | NULLABLE | NULL | Last local modification |
| `lastModifiedExternal` | TIMESTAMP | NULLABLE | NULL | Last external modification |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Mapping creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `syncedCalendar`: ManyToOne → SyncedCalendar (cascade delete)

**Business Logic:**
- Tracks bidirectional mapping between local and external events
- Modification timestamps enable conflict resolution
- Latest timestamp wins in conflict scenarios
- Deletion of synced calendar cascades mapping deletion

**Entity File:** [calendar-sync.entity.ts](backend-nestjs/src/entities/calendar-sync.entity.ts)

---

### Domain 5: Organization Management

#### Entity: **Organisation**

**Table Name:** `organisations`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique organisation identifier |
| `name` | VARCHAR(255) | UNIQUE, NOT NULL | - | Organisation name |
| `description` | TEXT | NULLABLE | NULL | Organisation description |
| `address` | VARCHAR(255) | NULLABLE | NULL | Physical address |
| `phone` | VARCHAR(50) | NULLABLE | NULL | Contact phone |
| `email` | VARCHAR(255) | NULLABLE | NULL | Contact email |
| `isActive` | BOOLEAN | NOT NULL | `true` | Organisation active status |
| `useGranularResourcePermissions` | BOOLEAN | NOT NULL | `false` | Enable fine-grained resource access |
| `useGranularCalendarPermissions` | BOOLEAN | NOT NULL | `false` | Enable fine-grained calendar access |
| `color` | VARCHAR(7) | NOT NULL | `'#f97316'` | Organisation theme color |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `users`: ManyToMany → User (through organisation_users)
- `resourceTypes`: OneToMany → ResourceType
- `organisationAdmins`: OneToMany → OrganisationAdmin
- `reservationCalendars`: OneToMany → ReservationCalendar

**Business Logic:**
- Name must be unique across all organisations
- Granular permission flags enable fine-grained access control
- When granular flags disabled, all org members have full access
- Organisation color used for theming related resources

**Entity File:** [organisation.entity.ts](backend-nestjs/src/entities/organisation.entity.ts)

---

#### Entity: **OrganisationAdmin**

**Table Name:** `organisation_admins`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique admin assignment ID |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Organisation |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | Admin user |
| `assignedById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | Global admin who assigned |
| `assignedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Assignment timestamp |

**Unique Constraint:** `(organisationId, userId)`

**Relationships:**
- `organisation`: ManyToOne → Organisation (cascade delete)
- `user`: ManyToOne → User (cascade delete)
- `assignedBy`: ManyToOne → User (nullable)

**Business Logic:**
- Organisation admins have full management rights within their org
- Can manage users, resources, and calendars in their organisation
- Assignment requires global admin role
- One user can be admin in multiple organisations

**Entity File:** [organisation-admin.entity.ts](backend-nestjs/src/entities/organisation-admin.entity.ts)

---

#### Entity: **OrganisationUser**

**Table Name:** `organisation_users`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique membership ID |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Organisation |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | Member user |
| `role` | VARCHAR | NOT NULL | `'user'` | Role: admin, editor, user |
| `assignedById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | User who added member |
| `isOrganisationAdmin` | BOOLEAN | NOT NULL | `false` | Legacy admin flag |
| `assignedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Membership start timestamp |

**Unique Constraint:** `(organisationId, userId)`

**Relationships:**
- `organisation`: ManyToOne → Organisation (cascade delete)
- `user`: ManyToOne → User (cascade delete)
- `assignedBy`: ManyToOne → User (nullable)

**Business Logic:**
- Join table for User ↔ Organisation many-to-many relationship
- Role determines access level within organisation:
  - `admin`: Full management access
  - `editor`: Can edit resources and calendars
  - `user`: Read-only access (unless granular permissions enabled)
- One user can be member of multiple organisations

**Entity File:** [organisation-user.entity.ts](backend-nestjs/src/entities/organisation-user.entity.ts)

---

### Domain 6: Granular Permissions

#### Entity: **OrganisationCalendarPermission**

**Table Name:** `organisation_calendar_permissions`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique permission ID |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Organisation |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | User receiving permission |
| `reservationCalendarId` | INTEGER | FOREIGN KEY → reservation_calendars.id | NOT NULL | Target calendar |
| `canView` | BOOLEAN | NOT NULL | `false` | View permission |
| `canEdit` | BOOLEAN | NOT NULL | `false` | Edit permission |
| `assignedById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | Admin who assigned |
| `assignedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Assignment timestamp |

**Unique Constraint:** `(organisationId, userId, reservationCalendarId)`

**Relationships:**
- `organisation`: ManyToOne → Organisation (cascade delete)
- `user`: ManyToOne → User (cascade delete)
- `reservationCalendar`: ManyToOne → ReservationCalendar (cascade delete)
- `assignedBy`: ManyToOne → User (nullable)

**Business Logic:**
- Only active when `Organisation.useGranularCalendarPermissions = true`
- Overrides default organisation-wide calendar access
- User must explicitly have permission to access calendar
- `canEdit = true` implies `canView = true`

**Entity File:** [organisation-calendar-permission.entity.ts](backend-nestjs/src/entities/organisation-calendar-permission.entity.ts)

---

#### Entity: **OrganisationResourceTypePermission**

**Table Name:** `organisation_resource_type_permissions`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique permission ID |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Organisation |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | User receiving permission |
| `resourceTypeId` | INTEGER | FOREIGN KEY → resource_types.id | NOT NULL | Target resource type |
| `canEdit` | BOOLEAN | NOT NULL | `false` | Edit permission |
| `assignedById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | Admin who assigned |
| `assignedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Assignment timestamp |

**Unique Constraint:** `(organisationId, userId, resourceTypeId)`

**Relationships:**
- `organisation`: ManyToOne → Organisation (cascade delete)
- `user`: ManyToOne → User (cascade delete)
- `resourceType`: ManyToOne → ResourceType (cascade delete)
- `assignedBy`: ManyToOne → User (nullable)

**Business Logic:**
- Only active when `Organisation.useGranularResourcePermissions = true`
- Overrides default organisation-wide resource type access
- User must explicitly have permission to manage resource type
- View access implied for all org members, edit requires explicit grant

**Entity File:** [organisation-resource-type-permission.entity.ts](backend-nestjs/src/entities/organisation-resource-type-permission.entity.ts)

---

### Domain 7: Reservation System

#### Entity: **ReservationCalendar**

**Table Name:** `reservation_calendars`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique reservation calendar ID |
| `calendarId` | INTEGER | FOREIGN KEY → calendars.id | NOT NULL | Underlying calendar |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Owner organisation |
| `createdById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | Creator user |
| `reservationRules` | TEXT | NULLABLE | NULL | JSON reservation rules |
| `isActive` | BOOLEAN | NOT NULL | `true` | Active status |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `calendar`: OneToOne → Calendar (cascade delete)
- `organisation`: ManyToOne → Organisation (cascade delete)
- `createdBy`: ManyToOne → User (nullable)
- `roles`: OneToMany → ReservationCalendarRole (cascade delete)

**Business Logic:**
- Extends regular Calendar with reservation functionality
- Reservation rules stored as JSON (booking windows, restrictions)
- Linked to organisation for access control
- Deletion of calendar or organisation cascades deletion

**Entity File:** [reservation-calendar.entity.ts](backend-nestjs/src/entities/reservation-calendar.entity.ts)

---

#### Entity: **ReservationCalendarRole**

**Table Name:** `reservation_calendar_roles`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique role assignment ID |
| `reservationCalendarId` | INTEGER | FOREIGN KEY → reservation_calendars.id | NOT NULL | Target calendar |
| `userId` | INTEGER | FOREIGN KEY → users.id | NOT NULL | User receiving role |
| `role` | VARCHAR | NOT NULL | - | Role: editor, reviewer |
| `assignedById` | INTEGER | FOREIGN KEY → users.id | NULLABLE | Admin who assigned |
| `isOrganisationAdmin` | BOOLEAN | NOT NULL | `false` | Is this user an org admin? |
| `assignedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Assignment timestamp |

**Unique Constraint:** `(reservationCalendarId, userId)`

**Relationships:**
- `reservationCalendar`: ManyToOne → ReservationCalendar (cascade delete)
- `user`: ManyToOne → User (cascade delete)
- `assignedBy`: ManyToOne → User (nullable)

**Business Logic:**
- Role permissions:
  - `editor`: Create, edit, delete, approve reservations
  - `reviewer`: View and approve/reject reservations only
- One user can have at most one role per reservation calendar
- Organisation admins automatically have full access

**Entity File:** [reservation-calendar-role.entity.ts](backend-nestjs/src/entities/reservation-calendar-role.entity.ts)

---

#### Entity: **ResourceType**

**Table Name:** `resource_types`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique resource type ID |
| `name` | VARCHAR(255) | NOT NULL | - | Resource type name |
| `description` | TEXT | NULLABLE | NULL | Description |
| `minBookingDuration` | INTEGER | NOT NULL | `30` | Minimum booking duration (minutes) |
| `bufferTime` | INTEGER | NOT NULL | `0` | Buffer time between bookings (minutes) |
| `customerInfoFields` | JSON | NOT NULL | `["name","phone","email"]` | Required customer fields |
| `waitlistEnabled` | BOOLEAN | NOT NULL | `false` | Enable waitlist functionality |
| `recurringEnabled` | BOOLEAN | NOT NULL | `false` | Enable recurring reservations |
| `isActive` | BOOLEAN | NOT NULL | `true` | Active status |
| `color` | VARCHAR(7) | NOT NULL | `'#f97316'` | Display color |
| `organisationId` | INTEGER | FOREIGN KEY → organisations.id | NOT NULL | Owner organisation |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `organisation`: ManyToOne → Organisation
- `resources`: OneToMany → Resource
- `operatingHours`: OneToMany → OperatingHours

**Business Logic:**
- Defines type/category of bookable resources
- minBookingDuration enforces minimum reservation length
- bufferTime adds gap between back-to-back bookings
- customerInfoFields array customizes required booking information

**Entity File:** [resource-type.entity.ts](backend-nestjs/src/entities/resource-type.entity.ts)

---

#### Entity: **Resource**

**Table Name:** `resources`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique resource ID |
| `name` | VARCHAR(255) | NOT NULL | - | Resource name |
| `description` | TEXT | NULLABLE | NULL | Resource description |
| `capacity` | INTEGER | NOT NULL | `1` | Booking capacity/quantity |
| `isActive` | BOOLEAN | NOT NULL | `true` | Active status |
| `publicBookingToken` | VARCHAR | UNIQUE, NULLABLE | NULL | UUID for public booking link |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `resourceType`: ManyToOne → ResourceType
- `managedBy`: ManyToOne → User
- `reservations`: OneToMany → Reservation

**Business Logic:**
- Individual bookable resource (room, equipment, service slot)
- Capacity allows multiple simultaneous bookings
- publicBookingToken auto-generated UUID for anonymous booking
- Public booking URL: `/public/book/{publicBookingToken}`

**Entity File:** [resource.entity.ts](backend-nestjs/src/entities/resource.entity.ts)

---

#### Entity: **OperatingHours**

**Table Name:** `operating_hours`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique operating hours ID |
| `dayOfWeek` | INTEGER | NOT NULL | - | Day of week (0=Sunday, 6=Saturday) |
| `openTime` | TIME | NOT NULL | - | Opening time |
| `closeTime` | TIME | NOT NULL | - | Closing time |
| `isActive` | BOOLEAN | NOT NULL | `true` | Active status |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `resourceType`: ManyToOne → ResourceType

**Business Logic:**
- Defines when a resource type is available for booking
- Multiple entries per resource type for different days
- dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
- Bookings outside operating hours are rejected

**Entity File:** [operating-hours.entity.ts](backend-nestjs/src/entities/operating-hours.entity.ts)

---

#### Entity: **Reservation**

**Table Name:** `reservations`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique reservation ID |
| `startTime` | TIMESTAMP | NOT NULL | - | Reservation start time |
| `endTime` | TIMESTAMP | NOT NULL | - | Reservation end time |
| `quantity` | INTEGER | NOT NULL | `1` | Number of resource units |
| `customerInfo` | JSON | NULLABLE | NULL | Customer contact information |
| `status` | VARCHAR | NOT NULL | `'pending'` | Status: pending, confirmed, completed, cancelled, waitlist |
| `notes` | TEXT | NULLABLE | NULL | Additional notes |
| `parentReservationId` | INTEGER | NULLABLE | NULL | Parent for recurring series |
| `recurrencePattern` | JSON | NULLABLE | NULL | Recurrence pattern definition |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `resource`: ManyToOne → Resource
- `createdBy`: ManyToOne → User (nullable)

**Business Logic:**
- customerInfo JSON contains fields defined by ResourceType.customerInfoFields
- quantity cannot exceed Resource.capacity
- Recurring reservations have parentReservationId linking to first instance
- Status workflow: pending → confirmed → completed (or cancelled)
- Waitlist status when capacity exceeded

**Entity File:** [reservation.entity.ts](backend-nestjs/src/entities/reservation.entity.ts)

---

### Domain 8: Automation System

#### Entity: **AutomationRule**

**Table Name:** `automation_rules`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique rule ID |
| `name` | VARCHAR(200) | NOT NULL | - | Rule name |
| `description` | TEXT | NULLABLE | NULL | Rule description |
| `triggerType` | VARCHAR(50) | NOT NULL | - | Trigger type (7 types available) |
| `triggerConfig` | JSON | NULLABLE | NULL | Trigger-specific configuration |
| `isEnabled` | BOOLEAN | NOT NULL | `true` | Active status |
| `conditionLogic` | VARCHAR(10) | NOT NULL | `'AND'` | Condition logic: AND, OR |
| `lastExecutedAt` | TIMESTAMP | NULLABLE | NULL | Last execution timestamp |
| `executionCount` | INTEGER | NOT NULL | `0` | Total execution count |
| `createdById` | INTEGER | FOREIGN KEY → users.id | NOT NULL | Rule creator |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `createdBy`: ManyToOne → User (cascade delete)
- `conditions`: OneToMany → AutomationCondition (cascade delete)
- `actions`: OneToMany → AutomationAction (cascade delete)
- `auditLogs`: OneToMany → AutomationAuditLog

**Trigger Types:**
1. `event.created` - When event is created
2. `event.updated` - When event is updated
3. `event.deleted` - When event is deleted
4. `event.starts_in` - Before event starts (config: minutes)
5. `event.ends_in` - Before event ends (config: minutes)
6. `calendar.imported` - After calendar sync import
7. `scheduled.time` - Scheduled execution (config: cron expression)

**Business Logic:**
- Rules scoped to user (each user has own rules)
- conditionLogic applies between all conditions
- Disabled rules (isEnabled=false) never execute
- executionCount increments on each trigger

**Entity File:** [automation-rule.entity.ts](backend-nestjs/src/entities/automation-rule.entity.ts)

---

#### Entity: **AutomationCondition**

**Table Name:** `automation_conditions`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique condition ID |
| `ruleId` | INTEGER | FOREIGN KEY → automation_rules.id | NOT NULL | Parent rule |
| `field` | VARCHAR(100) | NOT NULL | - | Event field to check (11 fields) |
| `operator` | VARCHAR(50) | NOT NULL | - | Comparison operator (19 operators) |
| `value` | TEXT | NOT NULL | - | Comparison value |
| `groupId` | VARCHAR(36) | NULLABLE | NULL | UUID for condition grouping |
| `logicOperator` | VARCHAR(10) | NOT NULL | `'AND'` | Logic: AND, OR, NOT |
| `order` | INTEGER | NOT NULL | `0` | Evaluation order |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `rule`: ManyToOne → AutomationRule (cascade delete)

**Supported Fields (11):**
1. `event.title` - Event title string
2. `event.description` - Event description text
3. `event.location` - Event location string
4. `event.notes` - Event notes text
5. `event.duration` - Duration in minutes (computed)
6. `event.is_all_day` - Boolean all-day flag
7. `event.color` - Event color hex value
8. `event.status` - Event status enum
9. `event.calendar.id` - Parent calendar ID
10. `event.calendar.name` - Parent calendar name
11. Computed fields available during evaluation

**Supported Operators (19):**

*String Operators:*
- `contains`, `not_contains`
- `equals`, `not_equals`
- `starts_with`, `ends_with`
- `matches` (regex), `not_matches` (regex)
- `is_empty`, `is_not_empty`

*Numeric Operators:*
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`

*Boolean Operators:*
- `is_true`, `is_false`

*Array Operators:*
- `in` (value in array), `not_in`
- `in_list` (field in value list), `not_in_list`

**Business Logic:**
- groupId allows complex nested condition groups
- order determines evaluation sequence
- NOT operator inverts condition result

**Entity File:** [automation-condition.entity.ts](backend-nestjs/src/entities/automation-condition.entity.ts)

---

#### Entity: **AutomationAction**

**Table Name:** `automation_actions`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique action ID |
| `ruleId` | INTEGER | FOREIGN KEY → automation_rules.id | NOT NULL | Parent rule |
| `actionType` | VARCHAR(50) | NOT NULL | - | Action type (8 types defined) |
| `actionConfig` | JSON | NOT NULL | - | Action-specific configuration |
| `order` | INTEGER | NOT NULL | `0` | Execution order |
| `createdAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp |

**Relationships:**
- `rule`: ManyToOne → AutomationRule (cascade delete)

**Action Types (8 defined, 1 implemented):**

*V1 Implemented:*
1. `set_event_color` - Change event color
   - Config: `{ color: "#ef4444" }`

*Planned Actions:*
2. `send_notification` - Send user notification
3. `modify_event_title` - Change event title
4. `modify_event_description` - Change description
5. `create_task` - Create task from event
6. `webhook` - Call external webhook
7. `create_reminder` - Set reminder
8. `move_to_calendar` - Move event to different calendar

**Business Logic:**
- Actions execute in order specified
- Plugin architecture for action executors
- Actions auto-registered via ActionExecutorRegistry
- Failed actions logged but don't stop subsequent actions

**Entity File:** [automation-action.entity.ts](backend-nestjs/src/entities/automation-action.entity.ts)

---

#### Entity: **AutomationAuditLog**

**Table Name:** `automation_audit_logs`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | Unique log entry ID |
| `ruleId` | INTEGER | FOREIGN KEY → automation_rules.id | NOT NULL | Executed rule |
| `eventId` | INTEGER | FOREIGN KEY → events.id | NULLABLE, SET NULL | Target event (if applicable) |
| `triggerType` | VARCHAR(50) | NOT NULL | - | Trigger that fired |
| `triggerContext` | JSON | NULLABLE | NULL | Trigger metadata |
| `conditionsResult` | JSON | NOT NULL | - | Condition evaluation results |
| `actionResults` | JSON | NULLABLE | NULL | Action execution results |
| `status` | VARCHAR(20) | NOT NULL | - | Status: success, partial_success, failure, skipped |
| `errorMessage` | TEXT | NULLABLE | NULL | Error details if failed |
| `duration_ms` | INTEGER | NOT NULL | `0` | Execution duration milliseconds |
| `executedByUserId` | INTEGER | FOREIGN KEY → users.id | NULLABLE, SET NULL | User who triggered |
| `executedAt` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Execution timestamp |

**Relationships:**
- `rule`: ManyToOne → AutomationRule (cascade delete)
- `event`: ManyToOne → Event (SET NULL on delete, nullable)
- `executedBy`: ManyToOne → User (SET NULL on delete, nullable)

**Audit Log Structure:**

*conditionsResult JSON:*
```json
{
  "passed": true/false,
  "evaluations": [
    {
      "conditionId": 1,
      "field": "event.title",
      "operator": "contains",
      "expectedValue": "Meeting",
      "actualValue": "Team Meeting",
      "passed": true
    }
  ]
}
```

*actionResults JSON:*
```json
[
  {
    "actionId": 1,
    "actionType": "set_event_color",
    "success": true,
    "result": { "previousColor": "#3b82f6", "newColor": "#ef4444" },
    "errorMessage": null
  }
]
```

**Business Logic:**
- Circular buffer: Maximum 1000 entries per rule
- When limit exceeded, oldest entries deleted automatically
- Event deletion doesn't delete audit logs (SET NULL)
- User deletion doesn't delete audit logs (SET NULL)
- Full execution trace for debugging and compliance

**Entity File:** [automation-audit-log.entity.ts](backend-nestjs/src/entities/automation-audit-log.entity.ts)

---

## Entity Relationships

### Relationship Diagram (Text Format)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER (Central Entity)                       │
└──────────────────────────────────────────────────────────────────────┘
                │
                │ OneToMany (CASCADE)
                ├─────────────────────► Calendar (ownedCalendars)
                │                               │
                │                               │ OneToMany (CASCADE)
                │                               └───► Event
                │
                │ ManyToMany (calendar_shares)
                ├─────────────────────► Calendar (sharedCalendars)
                │
                │ OneToMany (CASCADE)
                ├─────────────────────► Event (createdEvents)
                │
                │ ManyToMany (organisation_users)
                ├─────────────────────► Organisation
                │                               │
                │                               │ OneToMany
                │                               ├───► ResourceType
                │                               │         │
                │                               │         │ OneToMany
                │                               │         ├───► Resource
                │                               │         │         │
                │                               │         │         │ OneToMany
                │                               │         │         └───► Reservation
                │                               │         │
                │                               │         └───► OperatingHours
                │                               │
                │                               └───► ReservationCalendar
                │
                │ OneToMany
                ├─────────────────────► CalendarSyncConnection
                │                               │
                │                               │ OneToMany (CASCADE)
                │                               └───► SyncedCalendar
                │                                         │
                │                                         │ OneToMany (CASCADE)
                │                                         └───► SyncEventMapping
                │
                │ OneToMany (CASCADE)
                ├─────────────────────► AutomationRule
                │                               │
                │                               │ OneToMany (CASCADE)
                │                               ├───► AutomationCondition
                │                               │
                │                               │ OneToMany (CASCADE)
                │                               ├───► AutomationAction
                │                               │
                │                               └───► AutomationAuditLog
                │
                │ OneToMany
                ├─────────────────────► OrganisationAdmin
                │
                └─────────────────────► ReservationCalendarRole
```

### Cascade Behavior Summary

**User Deletion Cascades:**
- ✅ All owned calendars → deleted
- ✅ All created events → deleted
- ✅ All automation rules → deleted
- ✅ All sync connections → deleted
- ✅ Organisation memberships → deleted
- ✅ Calendar shares → deleted
- ✅ Reservation calendar roles → deleted
- ⚠️ Audit logs → user ID set to NULL (preserved)

**Calendar Deletion Cascades:**
- ✅ All events → deleted
- ✅ Calendar shares → deleted
- ✅ Synced calendar mappings → deleted
- ✅ Reservation calendar config → deleted

**Organisation Deletion Cascades:**
- ✅ All resource types → deleted
- ✅ All resources → deleted (through resource types)
- ✅ All organisation admins → deleted
- ✅ All organisation users → deleted
- ✅ All reservation calendars → deleted
- ✅ All granular permissions → deleted

**AutomationRule Deletion Cascades:**
- ✅ All conditions → deleted
- ✅ All actions → deleted
- ⚠️ Audit logs → orphaned but preserved for compliance

**Event Deletion Behavior:**
- ⚠️ Audit logs → event ID set to NULL (preserved)
- ℹ️ Recurring events: Deleting parent suggests deleting all instances

---

## Indexes and Performance

### Defined Indexes

**Table: users**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `username`
- UNIQUE INDEX on `email`

**Table: calendars**
- PRIMARY KEY on `id`
- INDEX on `ownerId`
- INDEX on `visibility`
- INDEX on `isReservationCalendar`

**Table: calendar_shares**
- PRIMARY KEY on `id`
- INDEX on `calendarId`
- INDEX on `userId`
- COMPOSITE INDEX on `(calendarId, userId)` for uniqueness

**Table: events**
- PRIMARY KEY on `id`
- INDEX on `calendarId`
- INDEX on `createdById`
- INDEX on `startDate`
- INDEX on `recurrenceId`
- INDEX on `parentEventId`
- COMPOSITE INDEX on `(calendarId, startDate)` for calendar queries

**Table: calendar_sync_connections**
- PRIMARY KEY on `id`
- INDEX on `userId`
- INDEX on `provider`
- INDEX on `status`

**Table: synced_calendars**
- PRIMARY KEY on `id`
- INDEX on `syncConnectionId`
- INDEX on `localCalendarId`
- INDEX on `externalCalendarId`

**Table: sync_event_mappings**
- PRIMARY KEY on `id`
- INDEX on `syncedCalendarId`
- INDEX on `localEventId`
- INDEX on `externalEventId`

**Table: organisations**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `name`

**Table: organisation_admins**
- PRIMARY KEY on `id`
- UNIQUE COMPOSITE INDEX on `(organisationId, userId)`
- INDEX on `organisationId`
- INDEX on `userId`

**Table: organisation_users**
- PRIMARY KEY on `id`
- UNIQUE COMPOSITE INDEX on `(organisationId, userId)`
- INDEX on `organisationId`
- INDEX on `userId`

**Table: organisation_calendar_permissions**
- PRIMARY KEY on `id`
- UNIQUE COMPOSITE INDEX on `(organisationId, userId, reservationCalendarId)`
- INDEX on `organisationId`
- INDEX on `userId`
- INDEX on `reservationCalendarId`

**Table: organisation_resource_type_permissions**
- PRIMARY KEY on `id`
- UNIQUE COMPOSITE INDEX on `(organisationId, userId, resourceTypeId)`
- INDEX on `organisationId`
- INDEX on `userId`
- INDEX on `resourceTypeId`

**Table: reservation_calendars**
- PRIMARY KEY on `id`
- INDEX on `calendarId`
- INDEX on `organisationId`

**Table: reservation_calendar_roles**
- PRIMARY KEY on `id`
- UNIQUE COMPOSITE INDEX on `(reservationCalendarId, userId)`
- INDEX on `reservationCalendarId`
- INDEX on `userId`

**Table: resource_types**
- PRIMARY KEY on `id`
- INDEX on `organisationId`
- INDEX on `isActive`

**Table: resources**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `publicBookingToken`
- INDEX on `isActive`

**Table: operating_hours**
- PRIMARY KEY on `id`
- INDEX on `dayOfWeek`

**Table: reservations**
- PRIMARY KEY on `id`
- INDEX on `startTime`
- INDEX on `endTime`
- INDEX on `status`
- COMPOSITE INDEX on `(startTime, endTime)` for time range queries

**Table: automation_rules**
- PRIMARY KEY on `id`
- INDEX on `createdById`
- INDEX on `isEnabled`
- INDEX on `triggerType`
- COMPOSITE INDEX on `(isEnabled, triggerType)` for active rules lookup

**Table: automation_conditions**
- PRIMARY KEY on `id`
- INDEX on `ruleId`

**Table: automation_actions**
- PRIMARY KEY on `id`
- INDEX on `ruleId`

**Table: automation_audit_logs**
- PRIMARY KEY on `id`
- INDEX on `ruleId`
- INDEX on `eventId`
- INDEX on `executedAt`
- COMPOSITE INDEX on `(ruleId, executedAt)` for log queries and circular buffer management

### Performance Recommendations

**Query Optimization:**
1. Always include `calendarId` in event queries
2. Use date ranges with indexed `startDate` field
3. Filter by `isEnabled` when querying automation rules
4. Use composite indexes for multi-column WHERE clauses

**Connection Pooling:**
- Production: Set `DB_POOL_MAX=20` for high traffic
- Development: Keep `DB_POOL_MAX=10` default

**Circular Buffer Optimization:**
- Audit log cleanup runs automatically on insertion
- Consider archiving old audit logs to separate table if needed

**JSON Column Performance:**
- PostgreSQL: Native JSON operators perform well
- SQLite: JSON stored as text, parsing overhead exists
- Consider denormalizing frequently-queried JSON fields

---

## Enums and Type Definitions

### User-related Enums

**UserRole**
```typescript
enum UserRole {
  OBSERVER = 'observer',  // Read-only access to shared calendars
  USER = 'user',          // Standard user with calendar management
  ADMIN = 'admin',        // Global administrator with full access
}
```

**UsagePlan**
```typescript
enum UsagePlan {
  CHILD = 'child',        // Limited features for child accounts
  USER = 'user',          // Standard personal plan
  STORE = 'store',        // Business store plan
  ENTERPRISE = 'enterprise', // Full enterprise features
}
```

### Calendar-related Enums

**CalendarVisibility**
```typescript
enum CalendarVisibility {
  PRIVATE = 'private',    // Only owner can see
  SHARED = 'shared',      // Shared with specific users
  PUBLIC = 'public',      // Visible to all authenticated users
}
```

**SharePermission**
```typescript
enum SharePermission {
  READ = 'read',          // View calendar and events
  WRITE = 'write',        // Create, edit, delete events
  ADMIN = 'admin',        // Full control including sharing
}
```

### Event-related Enums

**EventStatus**
```typescript
enum EventStatus {
  CONFIRMED = 'confirmed',  // Event confirmed and locked
  TENTATIVE = 'tentative',  // Tentative/proposed event
  CANCELLED = 'cancelled',  // Event cancelled
}
```

**RecurrenceType**
```typescript
enum RecurrenceType {
  NONE = 'none',         // Single occurrence
  DAILY = 'daily',       // Repeats daily
  WEEKLY = 'weekly',     // Repeats weekly
  MONTHLY = 'monthly',   // Repeats monthly
  YEARLY = 'yearly',     // Repeats yearly
}
```

### Sync-related Enums

**SyncProvider**
```typescript
enum SyncProvider {
  GOOGLE = 'google',      // Google Calendar
  MICROSOFT = 'microsoft', // Microsoft Outlook/365
}
```

**SyncStatus**
```typescript
enum SyncStatus {
  ACTIVE = 'active',      // Syncing normally
  INACTIVE = 'inactive',  // Sync disabled by user
  ERROR = 'error',        // Sync error occurred
}
```

### Reservation-related Enums

**ReservationStatus**
```typescript
enum ReservationStatus {
  PENDING = 'pending',       // Awaiting approval
  CONFIRMED = 'confirmed',   // Approved and confirmed
  COMPLETED = 'completed',   // Reservation completed
  CANCELLED = 'cancelled',   // Cancelled by user or admin
  WAITLIST = 'waitlist',     // On waitlist (capacity exceeded)
}
```

### Automation-related Enums

**TriggerType**
```typescript
enum TriggerType {
  EVENT_CREATED = 'event.created',       // When event is created
  EVENT_UPDATED = 'event.updated',       // When event is updated
  EVENT_DELETED = 'event.deleted',       // When event is deleted
  EVENT_STARTS_IN = 'event.starts_in',   // Before event starts (configurable)
  EVENT_ENDS_IN = 'event.ends_in',       // Before event ends (configurable)
  CALENDAR_IMPORTED = 'calendar.imported', // After calendar sync import
  SCHEDULED_TIME = 'scheduled.time',     // Scheduled execution (cron)
}
```

**ConditionLogic**
```typescript
enum ConditionLogic {
  AND = 'AND',  // All conditions must pass
  OR = 'OR',    // At least one condition must pass
}
```

**ConditionOperator** (19 operators)
```typescript
enum ConditionOperator {
  // String operators
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  MATCHES = 'matches',           // Regex match
  NOT_MATCHES = 'not_matches',   // Regex not match
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  // Numeric operators
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',

  // Boolean operators
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',

  // Array operators
  IN = 'in',                     // Value in array
  NOT_IN = 'not_in',             // Value not in array
  IN_LIST = 'in_list',           // Field in value list
  NOT_IN_LIST = 'not_in_list',   // Field not in value list
}
```

**ActionType** (8 defined, 1 implemented)
```typescript
enum ActionType {
  SET_EVENT_COLOR = 'set_event_color',               // V1 Implemented
  SEND_NOTIFICATION = 'send_notification',           // Planned
  MODIFY_EVENT_TITLE = 'modify_event_title',         // Planned
  MODIFY_EVENT_DESCRIPTION = 'modify_event_description', // Planned
  CREATE_TASK = 'create_task',                       // Planned
  WEBHOOK = 'webhook',                               // Planned
  CREATE_REMINDER = 'create_reminder',               // Planned
  MOVE_TO_CALENDAR = 'move_to_calendar',             // Planned
}
```

**AuditLogStatus**
```typescript
enum AuditLogStatus {
  SUCCESS = 'success',             // All actions succeeded
  PARTIAL_SUCCESS = 'partial_success', // Some actions failed
  FAILURE = 'failure',             // All actions failed
  SKIPPED = 'skipped',             // Conditions not met, skipped
}
```

---

## Database Replication Guide

This section provides complete instructions to replicate the Cal3 database on another system.

### Method 1: Using TypeORM Auto-Sync (Development)

**Prerequisites:**
- Node.js 18+ installed
- PostgreSQL 12+ or SQLite 3 installed
- Cal3 backend codebase

**Steps:**

1. **Clone the repository:**
```bash
git clone <repository-url>
cd cal3/backend-nestjs
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```bash
DB_TYPE=postgres
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=cal3_new
DB_SYNCHRONIZE=true  # Auto-creates schema
JWT_SECRET=your-secret-key
PORT=8081
```

3. **Start the application:**
```bash
npm run start:dev
```

TypeORM will automatically create all tables on first connection.

4. **Seed sample data (optional):**
```bash
npm run seed
```

**Verification:**
```bash
# PostgreSQL
psql -U your-username -d cal3_new -c "\dt"

# Or check via application logs
# Look for "✅ Database connection established"
```

---

### Method 2: Manual SQL Schema Creation (Production)

**Prerequisites:**
- PostgreSQL 12+ installed and running
- Database administration access

**Steps:**

1. **Create database:**
```sql
CREATE DATABASE cal3_production;
\c cal3_production
```

2. **Run complete schema script:**
See [SQL Schema Reference](#sql-schema-reference) section below for complete DDL.

3. **Configure application:**
```bash
DB_TYPE=postgres
DB_HOST=your-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=cal3_production
DB_SYNCHRONIZE=false  # Do not auto-modify schema in production
```

4. **Start application:**
```bash
npm run build
npm run start:prod
```

---

### Method 3: Database Dump/Restore (Migration)

**Export from source database:**
```bash
# PostgreSQL
pg_dump -U source_user -h source_host -d cal3_source -F c -b -v -f cal3_dump.backup

# Or SQL format
pg_dump -U source_user -h source_host -d cal3_source > cal3_dump.sql
```

**Import to target database:**
```bash
# Create target database
createdb -U target_user -h target_host cal3_target

# Restore from custom format
pg_restore -U target_user -h target_host -d cal3_target -v cal3_dump.backup

# Or from SQL format
psql -U target_user -h target_host -d cal3_target < cal3_dump.sql
```

---

### Method 4: Docker Container Setup

**Using Docker Compose:**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cal3
      POSTGRES_USER: cal3user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend-nestjs
    environment:
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: cal3user
      DB_PASSWORD: secure_password
      DB_NAME: cal3
      DB_SYNCHRONIZE: "true"
      JWT_SECRET: your-secret-key
      PORT: 8081
    ports:
      - "8081:8081"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Start containers:**
```bash
docker-compose up -d
```

---

### Cloud Database Setup

#### Azure PostgreSQL

1. **Create Azure PostgreSQL server:**
```bash
az postgres server create \
  --resource-group cal3-rg \
  --name cal3-db-server \
  --location eastus \
  --admin-user cal3admin \
  --admin-password <secure-password> \
  --sku-name B_Gen5_1 \
  --version 12
```

2. **Configure firewall:**
```bash
az postgres server firewall-rule create \
  --resource-group cal3-rg \
  --server cal3-db-server \
  --name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

3. **Create database:**
```bash
az postgres db create \
  --resource-group cal3-rg \
  --server-name cal3-db-server \
  --name cal3
```

4. **Configure application:**
```bash
DB_TYPE=postgres
DB_HOST=cal3-db-server.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=cal3admin@cal3-db-server
DB_PASSWORD=<secure-password>
DB_NAME=cal3
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_CONNECTION_TIMEOUT=60000
```

#### AWS RDS PostgreSQL

1. **Create RDS instance:**
```bash
aws rds create-db-instance \
  --db-instance-identifier cal3-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username cal3admin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-name cal3
```

2. **Configure application:**
```bash
DB_TYPE=postgres
DB_HOST=cal3-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=cal3admin
DB_PASSWORD=<secure-password>
DB_NAME=cal3
DB_SSL=true
DB_CONNECTION_TIMEOUT=60000
```

---

### Migration Checklist

- [ ] Database server installed and running
- [ ] Database created with proper encoding (UTF8)
- [ ] User account created with appropriate permissions
- [ ] Network/firewall rules configured
- [ ] SSL certificates installed (if using SSL)
- [ ] Environment variables configured
- [ ] Schema created (auto-sync or manual SQL)
- [ ] Indexes created and optimized
- [ ] Sample data seeded (optional)
- [ ] Application can connect successfully
- [ ] All API endpoints working
- [ ] Backup strategy implemented

---

## Seed Data

### Seed Script Overview

The seed script ([src/database/seed.ts](backend-nestjs/src/database/seed.ts)) creates comprehensive sample data:

**Users Created (4):**
1. **admin** - Global administrator
   - Email: admin@example.com
   - Password: enterenter
   - Role: admin
   - Usage Plans: [user]

2. **alice** - Standard user with multi-plan access
   - Email: alice@example.com
   - Password: password123
   - Role: user
   - Usage Plans: [user, store]

3. **bob** - Enterprise user
   - Email: bob@example.com
   - Password: password123
   - Role: user
   - Usage Plans: [user, enterprise]

4. **charlie** - Basic user
   - Email: charlie@example.com
   - Password: password123
   - Role: user
   - Usage Plans: [user]

**Organisations Created (3):**
1. **TechCorp Solutions** - Technology company
   - Members: Alice (admin), Bob (user)
2. **Startup Hub** - Innovation incubator
   - Members: Alice
3. **Consulting Group** - Consulting services
   - Members: Charlie

**Calendars Created (5):**
1. **Alice Personal** (Private, Blue #3b82f6)
2. **Alice Work** (Shared, Red #ef4444) - Shared with Bob (write)
3. **Bob Personal** (Private, Green #10b981)
4. **Team Calendar** (Shared, Orange #f59e0b) - Shared with Alice (write), Charlie (read)
5. **Company Events** (Public, Purple #8b5cf6)

**Events Created (11):**
- Morning Workout (recurring daily)
- Doctor Appointment (single)
- Team Standup (recurring daily)
- Project Review (tentative)
- Client Meeting (single)
- Team Building Event (single)
- Company Holiday (all-day)
- Weekend Trip (multi-day all-day)
- Weekly Team Meeting (recurring weekly)
- Monthly Review (recurring monthly, tentative)
- Conference 2025 (multi-day future event)

**Running the Seed:**
```bash
cd backend-nestjs
npm run seed
```

**Expected Output:**
```
🌱 Starting database seeding...
👥 Creating sample users...
✅ Created admin user: admin (ID: 1)
✅ Created user: alice (ID: 2)
✅ Created user: bob (ID: 3)
✅ Created user: charlie (ID: 4)

🏢 Creating sample organizations...
✅ Created organization: TechCorp Solutions (ID: 1)
✅ Created organization: Startup Hub (ID: 2)
✅ Created organization: Consulting Group (ID: 3)

👥 Adding users to organizations...
✅ Added alice to TechCorp Solutions
✅ Added bob to TechCorp Solutions
✅ Added alice to Startup Hub
✅ Added charlie to Consulting Group

📅 Creating sample calendars...
✅ Created calendar: Alice Personal (ID: 1)
✅ Created calendar: Alice Work (ID: 2)
✅ Created calendar: Bob Personal (ID: 3)
✅ Created calendar: Team Calendar (ID: 4)
✅ Created calendar: Company Events (ID: 5)

🤝 Setting up calendar sharing...
✅ Shared "Alice Work" with bob (WRITE)
✅ Shared "Team Calendar" with alice (WRITE)
✅ Shared "Team Calendar" with charlie (READ)

📝 Creating sample events...

✅ Sample data creation completed!

📊 Summary:
👥 Users: 4 (admin, alice, bob, charlie)
🏢 Organizations: 3 (TechCorp Solutions, Startup Hub, Consulting Group)
👔 Organization Members: 5 relationships across users
📅 Calendars: 5 (2 personal, 2 shared, 1 public)
📝 Events: 11 (various types and recurrence patterns)
🤝 Shares: 3 calendar sharing relationships

🔑 Admin login: username=admin, password=enterenter

🔗 Test URLs:
• Frontend: http://localhost:8080
• API Events: http://localhost:8081/api/events
• API Docs: http://localhost:8081/api/docs
```

---

## SQL Schema Reference

### Complete DDL Statements

Below are the complete SQL statements to manually create the entire database schema.

#### 1. Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100),
  "lastName" VARCHAR(100),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  role VARCHAR NOT NULL DEFAULT 'user',
  "themeColor" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  "weekStartDay" INTEGER NOT NULL DEFAULT 1,
  "defaultCalendarView" VARCHAR NOT NULL DEFAULT 'month',
  timezone VARCHAR NOT NULL DEFAULT 'UTC',
  "timeFormat" VARCHAR NOT NULL DEFAULT '24h',
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
```

#### 2. Calendars Table

```sql
CREATE TABLE calendars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  visibility VARCHAR NOT NULL DEFAULT 'private',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isReservationCalendar" BOOLEAN NOT NULL DEFAULT false,
  "organisationId" INTEGER,
  "ownerId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calendar_owner FOREIGN KEY ("ownerId")
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendars_ownerId ON calendars("ownerId");
CREATE INDEX idx_calendars_visibility ON calendars(visibility);
CREATE INDEX idx_calendars_isReservationCalendar ON calendars("isReservationCalendar");
```

#### 3. Calendar Shares Table

```sql
CREATE TABLE calendar_shares (
  id SERIAL PRIMARY KEY,
  "calendarId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  permission VARCHAR NOT NULL DEFAULT 'read',
  "sharedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_share_calendar FOREIGN KEY ("calendarId")
    REFERENCES calendars(id) ON DELETE CASCADE,
  CONSTRAINT fk_share_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_calendar_user UNIQUE ("calendarId", "userId")
);

CREATE INDEX idx_calendar_shares_calendarId ON calendar_shares("calendarId");
CREATE INDEX idx_calendar_shares_userId ON calendar_shares("userId");
```

#### 4. Events Table

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  "startDate" DATE NOT NULL,
  "startTime" TIME,
  "endDate" DATE,
  "endTime" TIME,
  "isAllDay" BOOLEAN NOT NULL DEFAULT false,
  location VARCHAR(200),
  status VARCHAR NOT NULL DEFAULT 'confirmed',
  "recurrenceType" VARCHAR NOT NULL DEFAULT 'none',
  "recurrenceRule" JSON,
  "parentEventId" INTEGER,
  "recurrenceId" VARCHAR,
  "originalDate" DATE,
  "isRecurrenceException" BOOLEAN NOT NULL DEFAULT false,
  color VARCHAR(7),
  notes TEXT,
  "calendarId" INTEGER NOT NULL,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_calendar FOREIGN KEY ("calendarId")
    REFERENCES calendars(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_creator FOREIGN KEY ("createdById")
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_calendarId ON events("calendarId");
CREATE INDEX idx_events_createdById ON events("createdById");
CREATE INDEX idx_events_startDate ON events("startDate");
CREATE INDEX idx_events_recurrenceId ON events("recurrenceId");
CREATE INDEX idx_events_parentEventId ON events("parentEventId");
CREATE INDEX idx_events_calendar_startDate ON events("calendarId", "startDate");
```

#### 5. Calendar Sync Connections Table

```sql
CREATE TABLE calendar_sync_connections (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  provider VARCHAR NOT NULL,
  "providerUserId" VARCHAR,
  "accessToken" VARCHAR,
  "refreshToken" VARCHAR,
  "tokenExpiresAt" TIMESTAMP,
  status VARCHAR NOT NULL DEFAULT 'active',
  "lastSyncAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sync_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sync_connections_userId ON calendar_sync_connections("userId");
CREATE INDEX idx_sync_connections_provider ON calendar_sync_connections(provider);
CREATE INDEX idx_sync_connections_status ON calendar_sync_connections(status);
```

#### 6. Synced Calendars Table

```sql
CREATE TABLE synced_calendars (
  id SERIAL PRIMARY KEY,
  "syncConnectionId" INTEGER NOT NULL,
  "localCalendarId" INTEGER NOT NULL,
  "externalCalendarId" VARCHAR NOT NULL,
  "externalCalendarName" VARCHAR NOT NULL,
  "bidirectionalSync" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP,
  "syncToken" VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_synced_connection FOREIGN KEY ("syncConnectionId")
    REFERENCES calendar_sync_connections(id) ON DELETE CASCADE,
  CONSTRAINT fk_synced_local_calendar FOREIGN KEY ("localCalendarId")
    REFERENCES calendars(id) ON DELETE CASCADE
);

CREATE INDEX idx_synced_calendars_syncConnectionId ON synced_calendars("syncConnectionId");
CREATE INDEX idx_synced_calendars_localCalendarId ON synced_calendars("localCalendarId");
CREATE INDEX idx_synced_calendars_externalCalendarId ON synced_calendars("externalCalendarId");
```

#### 7. Sync Event Mappings Table

```sql
CREATE TABLE sync_event_mappings (
  id SERIAL PRIMARY KEY,
  "syncedCalendarId" INTEGER NOT NULL,
  "localEventId" INTEGER NOT NULL,
  "externalEventId" VARCHAR NOT NULL,
  "lastModifiedLocal" TIMESTAMP,
  "lastModifiedExternal" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mapping_synced_calendar FOREIGN KEY ("syncedCalendarId")
    REFERENCES synced_calendars(id) ON DELETE CASCADE
);

CREATE INDEX idx_sync_mappings_syncedCalendarId ON sync_event_mappings("syncedCalendarId");
CREATE INDEX idx_sync_mappings_localEventId ON sync_event_mappings("localEventId");
CREATE INDEX idx_sync_mappings_externalEventId ON sync_event_mappings("externalEventId");
```

#### 8. Organisations Table

```sql
CREATE TABLE organisations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  address VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "useGranularResourcePermissions" BOOLEAN NOT NULL DEFAULT false,
  "useGranularCalendarPermissions" BOOLEAN NOT NULL DEFAULT false,
  color VARCHAR(7) NOT NULL DEFAULT '#f97316',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organisations_name ON organisations(name);
CREATE INDEX idx_organisations_isActive ON organisations("isActive");
```

#### 9. Organisation Admins Table

```sql
CREATE TABLE organisation_admins (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "assignedById" INTEGER,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_admin_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_admin_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_admin_assignedBy FOREIGN KEY ("assignedById")
    REFERENCES users(id),
  CONSTRAINT uq_org_admin_org_user UNIQUE ("organisationId", "userId")
);

CREATE INDEX idx_organisation_admins_organisationId ON organisation_admins("organisationId");
CREATE INDEX idx_organisation_admins_userId ON organisation_admins("userId");
```

#### 10. Organisation Users Table

```sql
CREATE TABLE organisation_users (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'user',
  "assignedById" INTEGER,
  "isOrganisationAdmin" BOOLEAN NOT NULL DEFAULT false,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_user_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_user_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_user_assignedBy FOREIGN KEY ("assignedById")
    REFERENCES users(id),
  CONSTRAINT uq_org_user_org_user UNIQUE ("organisationId", "userId")
);

CREATE INDEX idx_organisation_users_organisationId ON organisation_users("organisationId");
CREATE INDEX idx_organisation_users_userId ON organisation_users("userId");
```

#### 11. Organisation Calendar Permissions Table

```sql
CREATE TABLE organisation_calendar_permissions (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "reservationCalendarId" INTEGER NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "assignedById" INTEGER,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_cal_perm_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_cal_perm_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_cal_perm_reservation_calendar FOREIGN KEY ("reservationCalendarId")
    REFERENCES reservation_calendars(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_cal_perm_assignedBy FOREIGN KEY ("assignedById")
    REFERENCES users(id),
  CONSTRAINT uq_org_cal_perm UNIQUE ("organisationId", "userId", "reservationCalendarId")
);

CREATE INDEX idx_org_calendar_permissions_organisationId ON organisation_calendar_permissions("organisationId");
CREATE INDEX idx_org_calendar_permissions_userId ON organisation_calendar_permissions("userId");
CREATE INDEX idx_org_calendar_permissions_reservationCalendarId ON organisation_calendar_permissions("reservationCalendarId");
```

#### 12. Organisation Resource Type Permissions Table

```sql
CREATE TABLE organisation_resource_type_permissions (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "resourceTypeId" INTEGER NOT NULL,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "assignedById" INTEGER,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_res_perm_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_res_perm_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_res_perm_resource_type FOREIGN KEY ("resourceTypeId")
    REFERENCES resource_types(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_res_perm_assignedBy FOREIGN KEY ("assignedById")
    REFERENCES users(id),
  CONSTRAINT uq_org_res_perm UNIQUE ("organisationId", "userId", "resourceTypeId")
);

CREATE INDEX idx_org_resource_type_permissions_organisationId ON organisation_resource_type_permissions("organisationId");
CREATE INDEX idx_org_resource_type_permissions_userId ON organisation_resource_type_permissions("userId");
CREATE INDEX idx_org_resource_type_permissions_resourceTypeId ON organisation_resource_type_permissions("resourceTypeId");
```

#### 13. Reservation Calendars Table

```sql
CREATE TABLE reservation_calendars (
  id SERIAL PRIMARY KEY,
  "calendarId" INTEGER NOT NULL,
  "organisationId" INTEGER NOT NULL,
  "createdById" INTEGER,
  "reservationRules" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_cal_calendar FOREIGN KEY ("calendarId")
    REFERENCES calendars(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_cal_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_cal_createdBy FOREIGN KEY ("createdById")
    REFERENCES users(id)
);

CREATE INDEX idx_reservation_calendars_calendarId ON reservation_calendars("calendarId");
CREATE INDEX idx_reservation_calendars_organisationId ON reservation_calendars("organisationId");
```

#### 14. Reservation Calendar Roles Table

```sql
CREATE TABLE reservation_calendar_roles (
  id SERIAL PRIMARY KEY,
  "reservationCalendarId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  role VARCHAR NOT NULL,
  "assignedById" INTEGER,
  "isOrganisationAdmin" BOOLEAN NOT NULL DEFAULT false,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_cal_role_reservation_calendar FOREIGN KEY ("reservationCalendarId")
    REFERENCES reservation_calendars(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_cal_role_user FOREIGN KEY ("userId")
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_cal_role_assignedBy FOREIGN KEY ("assignedById")
    REFERENCES users(id),
  CONSTRAINT uq_res_cal_role UNIQUE ("reservationCalendarId", "userId")
);

CREATE INDEX idx_reservation_calendar_roles_reservationCalendarId ON reservation_calendar_roles("reservationCalendarId");
CREATE INDEX idx_reservation_calendar_roles_userId ON reservation_calendar_roles("userId");
```

#### 15. Resource Types Table

```sql
CREATE TABLE resource_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "minBookingDuration" INTEGER NOT NULL DEFAULT 30,
  "bufferTime" INTEGER NOT NULL DEFAULT 0,
  "customerInfoFields" JSON NOT NULL DEFAULT '["name","phone","email"]',
  "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
  "recurringEnabled" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  color VARCHAR(7) NOT NULL DEFAULT '#f97316',
  "organisationId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resource_type_organisation FOREIGN KEY ("organisationId")
    REFERENCES organisations(id)
);

CREATE INDEX idx_resource_types_organisationId ON resource_types("organisationId");
CREATE INDEX idx_resource_types_isActive ON resource_types("isActive");
```

#### 16. Resources Table

```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "publicBookingToken" VARCHAR UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_publicBookingToken ON resources("publicBookingToken");
CREATE INDEX idx_resources_isActive ON resources("isActive");
```

#### 17. Operating Hours Table

```sql
CREATE TABLE operating_hours (
  id SERIAL PRIMARY KEY,
  "dayOfWeek" INTEGER NOT NULL,
  "openTime" TIME NOT NULL,
  "closeTime" TIME NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operating_hours_dayOfWeek ON operating_hours("dayOfWeek");
```

#### 18. Reservations Table

```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "customerInfo" JSON,
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  "parentReservationId" INTEGER,
  "recurrencePattern" JSON,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_startTime ON reservations("startTime");
CREATE INDEX idx_reservations_endTime ON reservations("endTime");
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time_range ON reservations("startTime", "endTime");
```

#### 19. Automation Rules Table

```sql
CREATE TABLE automation_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  "triggerType" VARCHAR(50) NOT NULL,
  "triggerConfig" JSON,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "conditionLogic" VARCHAR(10) NOT NULL DEFAULT 'AND',
  "lastExecutedAt" TIMESTAMP,
  "executionCount" INTEGER NOT NULL DEFAULT 0,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_rule_createdBy FOREIGN KEY ("createdById")
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_rules_createdById ON automation_rules("createdById");
CREATE INDEX idx_automation_rules_isEnabled ON automation_rules("isEnabled");
CREATE INDEX idx_automation_rules_triggerType ON automation_rules("triggerType");
CREATE INDEX idx_automation_rules_enabled_trigger ON automation_rules("isEnabled", "triggerType");
```

#### 20. Automation Conditions Table

```sql
CREATE TABLE automation_conditions (
  id SERIAL PRIMARY KEY,
  "ruleId" INTEGER NOT NULL,
  field VARCHAR(100) NOT NULL,
  operator VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  "groupId" VARCHAR(36),
  "logicOperator" VARCHAR(10) NOT NULL DEFAULT 'AND',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_condition_rule FOREIGN KEY ("ruleId")
    REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_conditions_ruleId ON automation_conditions("ruleId");
```

#### 21. Automation Actions Table

```sql
CREATE TABLE automation_actions (
  id SERIAL PRIMARY KEY,
  "ruleId" INTEGER NOT NULL,
  "actionType" VARCHAR(50) NOT NULL,
  "actionConfig" JSON NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_action_rule FOREIGN KEY ("ruleId")
    REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_actions_ruleId ON automation_actions("ruleId");
```

#### 22. Automation Audit Logs Table

```sql
CREATE TABLE automation_audit_logs (
  id SERIAL PRIMARY KEY,
  "ruleId" INTEGER NOT NULL,
  "eventId" INTEGER,
  "triggerType" VARCHAR(50) NOT NULL,
  "triggerContext" JSON,
  "conditionsResult" JSON NOT NULL,
  "actionResults" JSON,
  status VARCHAR(20) NOT NULL,
  "errorMessage" TEXT,
  "duration_ms" INTEGER NOT NULL DEFAULT 0,
  "executedByUserId" INTEGER,
  "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_audit_rule FOREIGN KEY ("ruleId")
    REFERENCES automation_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_automation_audit_event FOREIGN KEY ("eventId")
    REFERENCES events(id) ON DELETE SET NULL,
  CONSTRAINT fk_automation_audit_executedBy FOREIGN KEY ("executedByUserId")
    REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs("ruleId");
CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs("eventId");
CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs("executedAt");
CREATE INDEX idx_audit_logs_rule_executed ON automation_audit_logs("ruleId", "executedAt");
```

---

## Backup and Maintenance

### Backup Strategies

#### 1. Automated Daily Backups (PostgreSQL)

**Backup Script (`backup.sh`):**
```bash
#!/bin/bash

BACKUP_DIR="/backups/cal3"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="cal3"
DB_USER="cal3user"
DB_HOST="localhost"

mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U $DB_USER -h $DB_HOST -F c -b -v -f "$BACKUP_DIR/cal3_full_$DATE.backup" $DB_NAME

# Schema-only backup
pg_dump -U $DB_USER -h $DB_HOST -s -f "$BACKUP_DIR/cal3_schema_$DATE.sql" $DB_NAME

# Data-only backup
pg_dump -U $DB_USER -h $DB_HOST -a -f "$BACKUP_DIR/cal3_data_$DATE.sql" $DB_NAME

# Compress backups
gzip "$BACKUP_DIR/cal3_full_$DATE.backup"
gzip "$BACKUP_DIR/cal3_schema_$DATE.sql"
gzip "$BACKUP_DIR/cal3_data_$DATE.sql"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Schedule with cron:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/cal3_backup.log 2>&1
```

#### 2. Point-in-Time Recovery (PostgreSQL)

**Enable WAL archiving in `postgresql.conf`:**
```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/cal3/wal/%f'
```

**Create base backup:**
```bash
pg_basebackup -U cal3user -h localhost -D /backups/cal3/base -Fp -Xs -P
```

**Restore to specific point in time:**
```sql
-- Stop database
sudo systemctl stop postgresql

-- Restore base backup
cp -R /backups/cal3/base/* /var/lib/postgresql/data/

-- Create recovery.conf
echo "restore_command = 'cp /backups/cal3/wal/%f %p'" > /var/lib/postgresql/data/recovery.conf
echo "recovery_target_time = '2025-10-20 14:30:00'" >> /var/lib/postgresql/data/recovery.conf

-- Start database
sudo systemctl start postgresql
```

#### 3. Continuous Replication

**Setup replication (Primary server):**
```sql
-- Create replication user
CREATE USER replicator REPLICATION LOGIN PASSWORD 'repl_password';

-- Configure pg_hba.conf
host replication replicator replica-server/32 md5
```

**Setup replica (Replica server):**
```bash
# Create base backup from primary
pg_basebackup -h primary-server -D /var/lib/postgresql/data -U replicator -P -v

# Configure recovery.conf
echo "standby_mode = 'on'" > /var/lib/postgresql/data/recovery.conf
echo "primary_conninfo = 'host=primary-server port=5432 user=replicator password=repl_password'" >> /var/lib/postgresql/data/recovery.conf
echo "trigger_file = '/tmp/trigger_failover'" >> /var/lib/postgresql/data/recovery.conf

# Start replica
sudo systemctl start postgresql
```

### Maintenance Tasks

#### Vacuum and Analyze (PostgreSQL)

**Manual vacuum:**
```sql
-- Vacuum all tables
VACUUM VERBOSE;

-- Vacuum specific table
VACUUM VERBOSE events;

-- Full vacuum (locks table)
VACUUM FULL VERBOSE events;

-- Analyze for query planner
ANALYZE events;
```

**Autovacuum configuration in `postgresql.conf`:**
```
autovacuum = on
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
```

#### Index Maintenance

**Check index usage:**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND idx_tup_read = 0
ORDER BY tablename;
```

**Rebuild index:**
```sql
REINDEX INDEX idx_events_startDate;
REINDEX TABLE events;
REINDEX DATABASE cal3;
```

#### Database Size Monitoring

**Check database size:**
```sql
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'cal3';
```

**Check table sizes:**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Audit Log Cleanup (Application Level)

Circular buffer automatically maintains 1000 entries per rule. Manual cleanup:

```sql
-- Delete audit logs older than 90 days
DELETE FROM automation_audit_logs
WHERE "executedAt" < NOW() - INTERVAL '90 days';

-- Keep only last 500 entries per rule
WITH ranked_logs AS (
  SELECT id, "ruleId",
         ROW_NUMBER() OVER (PARTITION BY "ruleId" ORDER BY "executedAt" DESC) AS rn
  FROM automation_audit_logs
)
DELETE FROM automation_audit_logs
WHERE id IN (SELECT id FROM ranked_logs WHERE rn > 500);
```

### Performance Tuning

**Connection pooling (`postgresql.conf`):**
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200  # For SSD
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

**Application pooling (TypeORM):**
```bash
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=60000
```

### Security Best Practices

1. **Use SSL/TLS for remote connections**
2. **Rotate database passwords regularly**
3. **Limit network access via firewall**
4. **Use separate read-only users for reporting**
5. **Enable PostgreSQL audit logging**
6. **Encrypt backups at rest**
7. **Implement row-level security for multi-tenancy**
8. **Regular security updates for database engine**

---

## Appendix

### A. Database Diagnostic Queries

**Check active connections:**
```sql
SELECT datname, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'cal3';
```

**Check slow queries:**
```sql
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- milliseconds
ORDER BY mean_time DESC
LIMIT 20;
```

**Check table bloat:**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### B. Migration from SQLite to PostgreSQL

**Export SQLite data:**
```bash
# Export as SQL
sqlite3 cal3.db .dump > cal3_sqlite.sql

# Or use pgloader
pgloader cal3.db postgresql://user:pass@localhost/cal3
```

**Manual migration:**
1. Export each table as CSV from SQLite
2. Create PostgreSQL schema using DDL above
3. Import CSV data using `COPY` command
4. Reset sequences to max ID values
5. Verify foreign key constraints

### C. TypeORM Migration Commands

```bash
# Generate migration from entity changes
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

Add to `package.json`:
```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d src/data-source.ts",
    "migration:run": "typeorm migration:run -d src/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/data-source.ts",
    "migration:show": "typeorm migration:show -d src/data-source.ts"
  }
}
```

### D. Entity Relationship Diagram (ERD)

For visual ERD, use tools like:
- **pgAdmin**: Built-in ERD tool for PostgreSQL
- **DBeaver**: Universal database tool with ERD
- **DbSchema**: Professional database design tool
- **TypeORM Entity Diagram**: Generate from TypeORM entities

Online generators:
- [dbdiagram.io](https://dbdiagram.io/)
- [DrawSQL](https://drawsql.app/)
- [QuickDBD](https://www.quickdatabasediagrams.com/)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-20 | Initial comprehensive documentation |

---

## Support and Resources

**Documentation:**
- [Cal3 README](README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Automation Documentation](docs/automation.md)
- [Feature Flags Documentation](docs/feature-flags.md)
- [Deployment Guide](DEPLOYMENT.md)

**Database Resources:**
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS Database Guide](https://docs.nestjs.com/techniques/database)

**Community:**
- GitHub Issues: Report database-related issues
- Contributing Guide: Submit improvements to schema

---

**End of Database Schema Documentation**
