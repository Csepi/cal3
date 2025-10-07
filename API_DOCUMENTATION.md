# Cal3 Calendar Application - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Calendars](#calendars)
4. [Events](#events)
5. [Calendar Sync](#calendar-sync)
6. [Automation System](#automation-system)
   - [Automation Rules](#automation-rules)
   - [Audit Logs](#audit-logs)
   - [Rule Execution](#rule-execution)
7. [Reservation System](#reservation-system)
   - [Organisations](#organisations)
   - [Resource Types](#resource-types)
   - [Resources](#resources)
   - [Reservations](#reservations)
   - [Operating Hours](#operating-hours)
8. [Admin](#admin)
9. [Organisation Admin Management](#organisation-admin-management)
10. [Reservation Calendars](#reservation-calendars)
11. [User Permissions](#user-permissions)
12. [Data Models](#data-models)
13. [Error Handling](#error-handling)

---

## Base URL
```
Development: http://localhost:8081/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "themeColor": "#3b82f6"
  }
}
```

**Error Responses:**
- `409 Conflict` - Username or email already exists
- `400 Bad Request` - Invalid input data

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### GET /auth/profile
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "themeColor": "#3b82f6",
  "weekStartDay": 1,
  "defaultCalendarView": "month",
  "timezone": "America/New_York",
  "timeFormat": "24h",
  "usagePlans": ["user"]
}
```

---

### OAuth Routes

#### GET /auth/google
Initiate Google OAuth login flow.

**Response:** Redirects to Google OAuth consent screen

---

#### GET /auth/google/callback
Google OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - State parameter for CSRF protection

**Response:** Redirects to frontend with token

---

#### GET /auth/microsoft
Initiate Microsoft OAuth login flow.

**Response:** Redirects to Microsoft OAuth consent screen

---

#### GET /auth/microsoft/callback
Microsoft OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Microsoft
- `state` - State parameter for CSRF protection

**Response:** Redirects to frontend with token

---

## User Profile

### GET /user/profile
Get current user profile with detailed settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "themeColor": "#3b82f6",
  "weekStartDay": 1,
  "defaultCalendarView": "month",
  "timezone": "America/New_York",
  "timeFormat": "24h",
  "usagePlans": ["user", "store"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### PATCH /user/profile
Update user profile information.

**Request Body (all fields optional):**
```json
{
  "username": "johndoe_updated",
  "email": "newemail@example.com",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "weekStartDay": 0,
  "defaultCalendarView": "week",
  "timezone": "Europe/London",
  "timeFormat": "12h"
}
```

**Note:** The `timeFormat` setting is now fully integrated across the frontend, affecting the display format in WeekView calendar and CalendarEventModal components. Changes to this setting are immediately reflected in all calendar views.

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe_updated",
  "email": "newemail@example.com",
  ...
}
```

**Error Responses:**
- `409 Conflict` - Username or email already exists
- `401 Unauthorized` - Invalid or missing token

---

### PATCH /user/theme
Update user theme color.

**Request Body:**
```json
{
  "themeColor": "#ec4899"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "themeColor": "#ec4899",
  ...
}
```

**Available Theme Colors:**
- Red: `#ef4444`
- Orange: `#f59e0b`
- Yellow: `#eab308`
- Lime: `#84cc16`
- Green: `#10b981`
- Emerald: `#22c55e`
- Teal: `#14b8a6`
- Cyan: `#06b6d4`
- Sky: `#0ea5e9`
- Blue: `#3b82f6`
- Indigo: `#6366f1`
- Violet: `#7c3aed`
- Purple: `#8b5cf6`
- Pink: `#ec4899`
- Rose: `#f43f5e`
- Slate: `#64748b`

---

### PATCH /user/password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `409 Conflict` - Current password is incorrect
- `401 Unauthorized` - Invalid or missing token

---

## Calendars

### POST /calendars
Create a new calendar.

**Request Body:**
```json
{
  "name": "Work Calendar",
  "description": "My work schedule and meetings",
  "color": "#3b82f6",
  "visibility": "private"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Work Calendar",
  "description": "My work schedule and meetings",
  "color": "#3b82f6",
  "visibility": "private",
  "isActive": true,
  "owner": {
    "id": 1,
    "username": "johndoe"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /calendars
Get all calendars (owned and shared with user).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Work Calendar",
    "description": "My work schedule",
    "color": "#3b82f6",
    "visibility": "private",
    "isActive": true,
    "owner": {
      "id": 1,
      "username": "johndoe"
    }
  },
  {
    "id": 2,
    "name": "Team Calendar",
    "color": "#10b981",
    "visibility": "shared",
    "isActive": true,
    "owner": {
      "id": 5,
      "username": "manager"
    },
    "permission": "read"
  }
]
```

---

### GET /calendars/:id
Get specific calendar by ID.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Work Calendar",
  "description": "My work schedule",
  "color": "#3b82f6",
  "visibility": "private",
  "isActive": true,
  "owner": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "sharedWith": [
    {
      "userId": 3,
      "username": "teammate",
      "permission": "write"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Calendar does not exist
- `403 Forbidden` - No access to calendar

---

### PATCH /calendars/:id
Update calendar details.

**Request Body:**
```json
{
  "name": "Updated Work Calendar",
  "description": "New description",
  "color": "#ec4899",
  "visibility": "shared"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Work Calendar",
  "description": "New description",
  "color": "#ec4899",
  "visibility": "shared"
}
```

**Error Responses:**
- `403 Forbidden` - Insufficient permissions (only owner can update)
- `404 Not Found` - Calendar does not exist

---

### DELETE /calendars/:id
Soft delete a calendar (only owner).

**Response (200 OK):**
```json
{
  "message": "Calendar deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden` - Only owner can delete calendar
- `404 Not Found` - Calendar does not exist

---

### POST /calendars/:id/share
Share calendar with other users.

**Request Body:**
```json
{
  "userIds": [3, 5, 7],
  "permission": "write"
}
```

**Permissions:**
- `read` - Can view calendar and events
- `write` - Can view and create/edit events
- `admin` - Full control (view, edit, share, delete)

**Response (200 OK):**
```json
{
  "message": "Calendar shared successfully",
  "sharedWith": [
    {
      "userId": 3,
      "permission": "write"
    },
    {
      "userId": 5,
      "permission": "write"
    }
  ]
}
```

---

### DELETE /calendars/:id/share
Unshare calendar from users.

**Request Body:**
```json
{
  "userIds": [3, 5]
}
```

**Response (200 OK):**
```json
{
  "message": "Calendar unshared successfully"
}
```

---

### GET /calendars/:id/shared-users
Get list of users calendar is shared with.

**Response (200 OK):**
```json
{
  "sharedWith": [
    {
      "userId": 3,
      "username": "teammate1",
      "email": "teammate1@example.com",
      "permission": "write",
      "sharedAt": "2024-01-05T10:00:00.000Z"
    },
    {
      "userId": 5,
      "username": "teammate2",
      "email": "teammate2@example.com",
      "permission": "read",
      "sharedAt": "2024-01-10T14:30:00.000Z"
    }
  ]
}
```

---

## Events

### POST /events
Create a new event.

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "startDate": "2024-01-15",
  "startTime": "14:00",
  "endDate": "2024-01-15",
  "endTime": "15:00",
  "isAllDay": false,
  "location": "Conference Room A",
  "color": "#3b82f6",
  "calendarId": 1
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "startDate": "2024-01-15T14:00:00.000Z",
  "endDate": "2024-01-15T15:00:00.000Z",
  "isAllDay": false,
  "location": "Conference Room A",
  "color": "#3b82f6",
  "calendar": {
    "id": 1,
    "name": "Work Calendar"
  },
  "createdBy": {
    "id": 1,
    "username": "johndoe"
  }
}
```

---

### POST /events/recurring
Create a recurring event series.

**Request Body:**
```json
{
  "title": "Daily Standup",
  "description": "Morning standup meeting",
  "startDate": "2024-01-15",
  "startTime": "09:00",
  "endDate": "2024-01-15",
  "endTime": "09:15",
  "isAllDay": false,
  "calendarId": 1,
  "recurrence": {
    "frequency": "daily",
    "interval": 1,
    "daysOfWeek": [1, 2, 3, 4, 5],
    "endDate": "2024-12-31"
  }
}
```

**Recurrence Patterns:**
- `frequency`: "daily" | "weekly" | "monthly" | "yearly"
- `interval`: Number (e.g., 2 for every 2 weeks)
- `daysOfWeek`: Array of 0-6 (0=Sunday, 6=Saturday) - for weekly
- `dayOfMonth`: Number 1-31 - for monthly
- `monthOfYear`: Number 1-12 - for yearly
- `endDate`: Date string or null for no end
- `occurrences`: Number of occurrences (alternative to endDate)

**Response (201 Created):**
```json
{
  "parentEvent": {
    "id": 10,
    "title": "Daily Standup",
    "isRecurring": true,
    "recurrencePattern": {...}
  },
  "generatedEvents": [
    {
      "id": 11,
      "title": "Daily Standup",
      "startDate": "2024-01-15T09:00:00.000Z",
      "parentEventId": 10
    },
    {
      "id": 12,
      "title": "Daily Standup",
      "startDate": "2024-01-16T09:00:00.000Z",
      "parentEventId": 10
    }
  ]
}
```

---

### GET /events
Get all accessible events for the user.

**Query Parameters:**
- `startDate` (optional): Filter events from this date (YYYY-MM-DD)
- `endDate` (optional): Filter events until this date (YYYY-MM-DD)

**Example:**
```
GET /events?startDate=2024-01-01&endDate=2024-01-31
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2024-01-15T14:00:00.000Z",
    "endDate": "2024-01-15T15:00:00.000Z",
    "isAllDay": false,
    "color": "#3b82f6",
    "calendar": {
      "id": 1,
      "name": "Work Calendar"
    }
  },
  {
    "id": 2,
    "title": "Project Deadline",
    "startDate": "2024-01-20T00:00:00.000Z",
    "isAllDay": true,
    "color": "#ef4444",
    "calendar": {
      "id": 1,
      "name": "Work Calendar"
    }
  }
]
```

---

### GET /events/:id
Get specific event by ID.

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "startDate": "2024-01-15T14:00:00.000Z",
  "endDate": "2024-01-15T15:00:00.000Z",
  "isAllDay": false,
  "location": "Conference Room A",
  "color": "#3b82f6",
  "isRecurring": false,
  "calendar": {
    "id": 1,
    "name": "Work Calendar",
    "owner": {
      "id": 1,
      "username": "johndoe"
    }
  },
  "createdBy": {
    "id": 1,
    "username": "johndoe"
  }
}
```

---

### PATCH /events/:id
Update an event.

**Request Body:**
```json
{
  "title": "Updated Team Meeting",
  "startDate": "2024-01-15",
  "startTime": "15:00",
  "endDate": "2024-01-15",
  "endTime": "16:00"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated Team Meeting",
  "startDate": "2024-01-15T15:00:00.000Z",
  "endDate": "2024-01-15T16:00:00.000Z"
}
```

---

### PATCH /events/:id/recurring
Update recurring event series.

**Request Body:**
```json
{
  "updateType": "all",
  "title": "Updated Daily Standup",
  "recurrence": {
    "frequency": "daily",
    "interval": 1,
    "daysOfWeek": [1, 2, 3, 4],
    "endDate": "2024-06-30"
  }
}
```

**Update Types:**
- `all` - Update all occurrences
- `future` - Update this and future occurrences
- `single` - Update only this occurrence

**Response (200 OK):**
```json
{
  "updated": 150,
  "parentEvent": {
    "id": 10,
    "title": "Updated Daily Standup"
  }
}
```

---

### DELETE /events/:id
Delete an event.

**Response (200 OK):**
```json
{
  "message": "Event deleted successfully"
}
```

---

### GET /events/calendar/:calendarId
Get all events from a specific calendar.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2024-01-15T14:00:00.000Z",
    ...
  }
]
```

---

## Calendar Sync

### GET /calendar-sync/status
Get synchronization status for connected providers.

**Response (200 OK):**
```json
{
  "isConnected": true,
  "providers": [
    {
      "provider": "google",
      "isConnected": true,
      "email": "user@gmail.com",
      "lastSync": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET /calendar-sync/auth/:provider
Get OAuth URL to connect a calendar provider.

**Parameters:**
- `provider`: "google" | "microsoft"

**Response (200 OK):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

### GET /calendar-sync/callback/:provider
OAuth callback handler (called by OAuth provider).

**Query Parameters:**
- `code` - Authorization code
- `state` - State parameter
- `userId` - User ID

**Response:** Redirects to frontend

---

### POST /calendar-sync/sync
Manually trigger calendar synchronization.

**Request Body:**
```json
{
  "provider": "google",
  "calendarIds": ["primary", "work@group.calendar.google.com"]
}
```

**Response (200 OK):**
```json
{
  "message": "Calendars synced successfully"
}
```

---

### POST /calendar-sync/force
Force full calendar synchronization.

**Response (200 OK):**
```json
{
  "message": "Sync completed successfully"
}
```

---

### POST /calendar-sync/disconnect
Disconnect all calendar providers.

**Response (200 OK):**
```json
{
  "message": "All calendar providers disconnected successfully"
}
```

---

### POST /calendar-sync/disconnect/:provider
Disconnect specific calendar provider.

**Parameters:**
- `provider`: "google" | "microsoft"

**Response (200 OK):**
```json
{
  "message": "google calendar provider disconnected successfully"
}
```

---

## Automation System

The Cal3 automation system enables users to create intelligent rules that automatically respond to event lifecycle triggers with configurable conditions and actions. All automation endpoints require authentication.

### Authentication

All automation system endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Automation Rules

### GET /automation/rules
Get all automation rules for the authenticated user.

**Query Parameters:**
- `isEnabled` (optional): Filter by enabled status (true/false)
- `triggerType` (optional): Filter by trigger type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Color work meetings blue",
      "description": "Automatically color all work calendar events",
      "triggerType": "event.created",
      "triggerConfig": null,
      "isEnabled": true,
      "conditionLogic": "AND",
      "lastExecutedAt": "2025-10-06T10:00:00Z",
      "executionCount": 150,
      "createdAt": "2025-10-06T09:00:00Z",
      "updatedAt": "2025-10-06T10:00:00Z",
      "conditions": [
        {
          "id": 1,
          "field": "event.calendar.name",
          "operator": "equals",
          "value": "Work",
          "logicOperator": "AND",
          "order": 0
        }
      ],
      "actions": [
        {
          "id": 1,
          "actionType": "set_event_color",
          "actionConfig": {
            "color": "#3b82f6"
          },
          "order": 0
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### GET /automation/rules/:id
Get specific automation rule by ID.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Color work meetings blue",
  "description": "Automatically color all work calendar events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "isEnabled": true,
  "conditionLogic": "AND",
  "lastExecutedAt": "2025-10-06T10:00:00Z",
  "executionCount": 150,
  "conditions": [
    {
      "id": 1,
      "field": "event.calendar.name",
      "operator": "equals",
      "value": "Work",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "id": 1,
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#3b82f6"
      },
      "order": 0
    }
  ],
  "createdAt": "2025-10-06T09:00:00Z",
  "updatedAt": "2025-10-06T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Rule does not exist
- `403 Forbidden` - No access to rule

---

### POST /automation/rules
Create a new automation rule.

**Request Body:**
```json
{
  "name": "Color all-day events green",
  "description": "Automatically color all-day events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "conditionLogic": "AND",
  "isEnabled": true,
  "conditions": [
    {
      "field": "event.is_all_day",
      "operator": "is_true",
      "value": "true",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#10b981"
      },
      "order": 0
    }
  ]
}
```

**Trigger Types:**
- `event.created` - When a new event is created
- `event.updated` - When an event is modified
- `event.deleted` - When an event is removed
- `event.starts_in` - X minutes before event start (requires triggerConfig: {minutesBefore: number})
- `event.ends_in` - X minutes before event end (requires triggerConfig: {minutesBefore: number})
- `calendar.imported` - When events are imported from external calendars
- `scheduled.time` - At specific times (requires triggerConfig with cron expression)

**Condition Fields:**
- `event.title` - Event title (string)
- `event.description` - Event description (string)
- `event.location` - Event location (string)
- `event.notes` - Event notes (string)
- `event.duration` - Duration in minutes (number)
- `event.is_all_day` - Is all-day event (boolean)
- `event.color` - Event color (string)
- `event.status` - Event status (string)
- `event.calendar.id` - Calendar ID (number)
- `event.calendar.name` - Calendar name (string)

**Condition Operators:**
- String: `contains`, `not_contains`, `matches`, `not_matches`, `equals`, `not_equals`, `starts_with`, `ends_with`
- Numeric: `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- Boolean: `is_true`, `is_false`
- Array: `in`, `not_in`

**Action Types:**
- `set_event_color` - Change event color (V1 - Available)
- Future actions: `send_notification`, `modify_event_title`, `modify_event_description`, `create_task`, `webhook`

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Color all-day events green",
  "description": "Automatically color all-day events",
  "triggerType": "event.created",
  "isEnabled": true,
  "conditions": [...],
  "actions": [...]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Rule name already exists for this user

---

### PUT /automation/rules/:id
Update an automation rule.

**Request Body:**
```json
{
  "name": "Updated rule name",
  "description": "Updated description",
  "isEnabled": false,
  "conditionLogic": "OR",
  "conditions": [
    {
      "field": "event.title",
      "operator": "contains",
      "value": "meeting",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#ef4444"
      },
      "order": 0
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated rule name",
  "description": "Updated description",
  "isEnabled": false,
  "updatedAt": "2025-10-06T11:00:00Z"
}
```

---

### DELETE /automation/rules/:id
Delete an automation rule.

**Response (200 OK):**
```json
{
  "message": "Automation rule deleted successfully"
}
```

---

## Audit Logs

### GET /automation/rules/:id/audit-logs
Get audit logs for a specific automation rule.

**Query Parameters:**
- `status` (optional): Filter by status (success, partial_success, failure, skipped)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 100,
      "ruleId": 1,
      "eventId": 50,
      "triggerType": "event.created",
      "triggerContext": {
        "manual": false
      },
      "conditionsResult": {
        "passed": true,
        "conditions": [
          {
            "field": "event.calendar.name",
            "operator": "equals",
            "expectedValue": "Work",
            "actualValue": "Work",
            "passed": true
          }
        ]
      },
      "actionResults": [
        {
          "actionType": "set_event_color",
          "success": true,
          "data": {
            "previousColor": "#3b82f6",
            "newColor": "#3b82f6"
          }
        }
      ],
      "status": "success",
      "errorMessage": null,
      "duration_ms": 45,
      "executedAt": "2025-10-06T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

### GET /automation/audit-logs/:logId
Get detailed audit log by ID.

**Response (200 OK):**
```json
{
  "id": 100,
  "ruleId": 1,
  "rule": {
    "id": 1,
    "name": "Color work meetings blue"
  },
  "eventId": 50,
  "event": {
    "id": 50,
    "title": "Team Meeting",
    "calendar": {
      "name": "Work"
    }
  },
  "triggerType": "event.created",
  "triggerContext": {
    "manual": false
  },
  "conditionsResult": {
    "passed": true,
    "logic": "AND",
    "conditions": [...]
  },
  "actionResults": [...],
  "status": "success",
  "errorMessage": null,
  "duration_ms": 45,
  "executedAt": "2025-10-06T10:00:00Z"
}
```

---

### GET /automation/rules/:id/stats
Get execution statistics for a rule.

**Response (200 OK):**
```json
{
  "totalExecutions": 150,
  "successCount": 145,
  "failureCount": 2,
  "partialSuccessCount": 1,
  "skippedCount": 2,
  "averageDuration_ms": 42.5,
  "lastExecutedAt": "2025-10-06T10:00:00Z",
  "successRate": 96.67
}
```

---

## Rule Execution

### POST /automation/rules/:id/execute
Execute a rule retroactively on existing events.

**Note:** This endpoint has rate limiting - 1 execution per rule per minute.

**Request Body:**
```json
{
  "dryRun": false
}
```

**Parameters:**
- `dryRun` (optional): If true, simulates execution without making changes (default: false)

**Response (200 OK):**
```json
{
  "message": "Rule executed successfully",
  "eventsProcessed": 25,
  "successCount": 23,
  "failureCount": 2,
  "executionTime_ms": 1250
}
```

**Error Responses:**
- `429 Too Many Requests` - Rate limit exceeded (wait 60 seconds)
- `404 Not Found` - Rule does not exist
- `403 Forbidden` - No access to rule

---

## Reservation System

The Cal3 reservation system provides comprehensive booking management for resources like meeting rooms, styling seats, equipment, and more. All reservation endpoints require authentication.

### Authentication

All reservation system endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Organisations

### GET /organisations
Get all organisations accessible to the user.

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Salon Elegance",
    "description": "Premium hairdressing salon offering cutting-edge styling services",
    "address": "123 Beauty Street, Style City, SC 12345",
    "phone": "+1-555-SALON-01",
    "email": "info@salonelegance.com",
    "isActive": true,
    "users": [],
    "resourceTypes": [
      {
        "id": 3,
        "name": "Styling Seat",
        "description": "Professional hairdressing chair with full styling station",
        "minBookingDuration": 30,
        "bufferTime": 15,
        "customerInfoFields": ["name", "phone", "email"],
        "waitlistEnabled": true,
        "recurringEnabled": true,
        "isActive": true
      }
    ],
    "createdAt": "2025-09-24T17:50:54.225Z",
    "updatedAt": "2025-09-24T17:50:54.225Z"
  }
]
```

---

### GET /organisations/:id
Get specific organisation by ID.

**Response (200 OK):**
```json
{
  "id": 4,
  "name": "API Test Org",
  "description": "Testing organisation API",
  "address": "123 API Test Street",
  "phone": "+1-555-API-TEST",
  "email": "apitest@example.com",
  "isActive": true,
  "users": [],
  "resourceTypes": [],
  "createdAt": "2025-09-24T18:32:46.088Z",
  "updatedAt": "2025-09-24T18:33:07.880Z"
}
```

---

### POST /organisations
Create a new organisation (admin only).

**Request Body:**
```json
{
  "name": "New Business",
  "description": "Business description",
  "email": "contact@business.com",
  "address": "123 Business Street",
  "phone": "+1-555-BUSINESS"
}
```

**Response (201 Created):**
```json
{
  "id": 4,
  "name": "New Business",
  "description": "Business description",
  "address": "123 Business Street",
  "phone": "+1-555-BUSINESS",
  "email": "contact@business.com",
  "isActive": true,
  "createdAt": "2025-09-24T18:32:46.088Z",
  "updatedAt": "2025-09-24T18:32:46.088Z"
}
```

---

### PATCH /organisations/:id
Update organisation details.

**Request Body:**
```json
{
  "address": "Updated address",
  "phone": "+1-555-NEW-NUM",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "id": 4,
  "name": "New Business",
  "address": "Updated address",
  "phone": "+1-555-NEW-NUM",
  "isActive": false,
  "updatedAt": "2025-09-24T18:33:07.880Z"
}
```

---

### DELETE /organisations/:id
Delete an organisation.

**Response (200 OK):**
```json
{
  "message": "Organisation deleted successfully"
}
```

---

## Resource Types

### GET /resource-types
Get all resource types accessible to the user.

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Styling Seat",
    "description": "Professional hairdressing chair with full styling station",
    "minBookingDuration": 30,
    "bufferTime": 15,
    "customerInfoFields": ["name", "phone", "email"],
    "waitlistEnabled": true,
    "recurringEnabled": true,
    "isActive": true,
    "organisation": {
      "id": 2,
      "name": "Salon Elegance",
      "description": "Premium hairdressing salon",
      "address": "123 Beauty Street, Style City, SC 12345",
      "phone": "+1-555-SALON-01",
      "email": "info@salonelegance.com",
      "isActive": true
    },
    "createdAt": "2025-09-24T17:52:32.768Z",
    "updatedAt": "2025-09-24T17:52:32.768Z"
  }
]
```

---

### GET /resource-types/:id
Get specific resource type by ID.

---

### POST /resource-types
Create a new resource type.

**Request Body:**
```json
{
  "name": "Meeting Room",
  "description": "Conference room for meetings",
  "organisationId": 4,
  "minBookingDuration": 60,
  "bufferTime": 15,
  "customerInfoFields": ["name", "phone", "email"],
  "waitlistEnabled": false,
  "recurringEnabled": true
}
```

**Response (201 Created):**
```json
{
  "id": 4,
  "name": "Meeting Room",
  "description": "Conference room for meetings",
  "minBookingDuration": 60,
  "bufferTime": 15,
  "customerInfoFields": ["name", "phone", "email"],
  "waitlistEnabled": false,
  "recurringEnabled": true,
  "isActive": true,
  "organisation": {
    "id": 4,
    "name": "API Test Org",
    "description": "Testing organisation API",
    "address": "123 API Test Street",
    "phone": "+1-555-API-TEST",
    "email": "apitest@example.com",
    "isActive": true
  },
  "createdAt": "2025-09-24T18:33:41.067Z",
  "updatedAt": "2025-09-24T18:33:41.067Z"
}
```

---

### PATCH /resource-types/:id
Update resource type settings.

**Request Body:**
```json
{
  "minBookingDuration": 45,
  "bufferTime": 10,
  "waitlistEnabled": true,
  "isActive": false
}
```

---

### DELETE /resource-types/:id
Delete a resource type.

---

## Resources

### GET /resources
Get all resources accessible to the user.

**Response (200 OK):**
```json
[
  {
    "id": 14,
    "name": "Meeting Room Alpha",
    "description": "Large conference room",
    "capacity": 12,
    "isActive": true,
    "resourceType": {
      "id": 4,
      "name": "Meeting Room",
      "description": "Conference room for meetings",
      "minBookingDuration": 60,
      "bufferTime": 15,
      "customerInfoFields": ["name", "phone", "email"],
      "waitlistEnabled": false,
      "recurringEnabled": true,
      "isActive": true
    },
    "createdAt": "2025-09-24T18:34:16.540Z",
    "updatedAt": "2025-09-24T18:34:16.540Z"
  }
]
```

---

### GET /resources/:id
Get specific resource by ID.

---

### POST /resources
Create a new resource.

**Request Body:**
```json
{
  "name": "Meeting Room Alpha",
  "description": "Large conference room",
  "resourceTypeId": 4,
  "capacity": 12
}
```

**Response (201 Created):**
```json
{
  "id": 14,
  "name": "Meeting Room Alpha",
  "description": "Large conference room",
  "capacity": 12,
  "isActive": true,
  "resourceType": {
    "id": 4,
    "name": "Meeting Room",
    "description": "Conference room for meetings",
    "minBookingDuration": 60,
    "bufferTime": 15,
    "customerInfoFields": ["name", "phone", "email"],
    "waitlistEnabled": false,
    "recurringEnabled": true,
    "isActive": true
  },
  "createdAt": "2025-09-24T18:34:16.540Z",
  "updatedAt": "2025-09-24T18:34:16.540Z"
}
```

---

### PATCH /resources/:id
Update resource details.

**Request Body:**
```json
{
  "name": "Updated Room Name",
  "capacity": 15,
  "isActive": false
}
```

---

### DELETE /resources/:id
Delete a resource.

---

## Reservations

### GET /reservations
Get all reservations accessible to the user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, completed, cancelled, waitlist)
- `resourceId` (optional): Filter by specific resource
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response (200 OK):**
```json
[
  {
    "id": 22,
    "startTime": "2025-09-25T14:00:00.000Z",
    "endTime": "2025-09-25T15:30:00.000Z",
    "quantity": 1,
    "customerInfo": {
      "name": "API Test User",
      "email": "apitest@example.com",
      "phone": "+1-555-TEST"
    },
    "status": "confirmed",
    "notes": "API testing reservation",
    "parentReservationId": null,
    "recurrencePattern": null,
    "resource": {
      "id": 14,
      "name": "Meeting Room Alpha",
      "description": "Large conference room",
      "capacity": 12,
      "isActive": true
    },
    "createdBy": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    },
    "createdAt": "2025-09-24T18:34:44.446Z",
    "updatedAt": "2025-09-24T18:34:53.673Z"
  }
]
```

---

### GET /reservations/:id
Get specific reservation by ID.

---

### POST /reservations
Create a new reservation.

**Request Body:**
```json
{
  "resourceId": 14,
  "startTime": "2025-09-25T14:00:00.000Z",
  "endTime": "2025-09-25T15:30:00.000Z",
  "customerInfo": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+1-555-CUSTOMER",
    "service": "Hair Cut & Style",
    "totalCost": 75
  },
  "notes": "Special requirements or notes",
  "quantity": 1
}
```

**Response (201 Created):**
```json
{
  "id": 22,
  "startTime": "2025-09-25T14:00:00.000Z",
  "endTime": "2025-09-25T15:30:00.000Z",
  "quantity": 1,
  "customerInfo": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+1-555-CUSTOMER",
    "service": "Hair Cut & Style",
    "totalCost": 75
  },
  "status": "pending",
  "notes": "Special requirements or notes",
  "parentReservationId": null,
  "recurrencePattern": null,
  "resource": {
    "id": 14,
    "name": "Meeting Room Alpha",
    "description": "Large conference room",
    "capacity": 12,
    "isActive": true
  },
  "createdBy": {
    "id": 1
  },
  "createdAt": "2025-09-24T18:34:44.446Z",
  "updatedAt": "2025-09-24T18:34:44.446Z"
}
```

---

### POST /reservations/recurring
Create a recurring reservation series.

**Request Body:**
```json
{
  "resourceId": 14,
  "startTime": "2025-09-25T10:00:00.000Z",
  "endTime": "2025-09-25T11:00:00.000Z",
  "customerInfo": {
    "name": "Weekly Customer",
    "email": "weekly@example.com",
    "phone": "+1-555-WEEKLY"
  },
  "notes": "Weekly meeting room booking",
  "quantity": 1,
  "recurrencePattern": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [2],
    "count": 4
  }
}
```

**Recurrence Pattern Options:**
- `frequency`: "daily" | "weekly" | "monthly"
- `interval`: Number (e.g., 2 for every 2 weeks)
- `daysOfWeek`: Array of 0-6 (0=Sunday, 6=Saturday) - for weekly
- `count`: Number of occurrences
- `endDate`: End date (alternative to count)

---

### PATCH /reservations/:id
Update a reservation.

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Updated notes",
  "customerInfo": {
    "name": "Updated Customer Name",
    "phone": "+1-555-UPDATED"
  }
}
```

**Available Statuses:**
- `pending` - Initial reservation state
- `confirmed` - Confirmed by staff
- `completed` - Service/booking completed
- `cancelled` - Cancelled by customer or staff
- `waitlist` - On waiting list (when resource unavailable)

**Response (200 OK):**
```json
{
  "id": 22,
  "status": "confirmed",
  "notes": "Updated notes",
  "customerInfo": {
    "name": "Updated Customer Name",
    "phone": "+1-555-UPDATED",
    "email": "apitest@example.com"
  },
  "resource": {
    "id": 14,
    "name": "Meeting Room Alpha"
  },
  "updatedAt": "2025-09-24T18:34:53.673Z"
}
```

---

### DELETE /reservations/:id
Delete/cancel a reservation.

**Response (200 OK):**
```json
{
  "message": "Reservation cancelled successfully"
}
```

---

## Operating Hours

### GET /operating-hours
Get operating hours for resource types.

**Query Parameters:**
- `resourceTypeId` (optional): Filter by specific resource type

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "dayOfWeek": 1,
    "openTime": "09:00:00",
    "closeTime": "17:00:00",
    "isOpen": true,
    "resourceType": {
      "id": 4,
      "name": "Meeting Room"
    },
    "createdAt": "2025-09-24T10:00:00.000Z",
    "updatedAt": "2025-09-24T10:00:00.000Z"
  }
]
```

---

### POST /operating-hours
Create operating hours for a resource type.

**Request Body:**
```json
{
  "resourceTypeId": 4,
  "dayOfWeek": 1,
  "openTime": "09:00:00",
  "closeTime": "17:00:00",
  "isOpen": true
}
```

**Day of Week Values:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

---

### PATCH /operating-hours/:id
Update operating hours.

**Request Body:**
```json
{
  "openTime": "08:00:00",
  "closeTime": "18:00:00",
  "isOpen": true
}
```

---

### DELETE /operating-hours/:id
Delete operating hours entry.

---

## Admin

**Note:** All admin endpoints require admin role and are protected by AdminGuard.

### GET /admin/stats
Get database statistics.

**Response (200 OK):**
```json
{
  "users": {
    "total": 150,
    "active": 142,
    "admins": 3
  },
  "calendars": {
    "total": 342
  },
  "events": {
    "total": 5421
  },
  "shares": {
    "total": 89
  },
  "lastUpdated": "2024-01-15T12:00:00.000Z"
}
```

---

### GET /admin/users
Get all users.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "usagePlans": ["user", "store"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### GET /admin/users/:id
Get specific user details.

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "usagePlans": ["user", "store"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /admin/users
Create a new user (admin only).

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "New",
  "lastName": "User",
  "role": "user",
  "usagePlans": ["user"]
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "user"
}
```

---

### PATCH /admin/users/:id
Update user details.

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com"
}
```

---

### PATCH /admin/users/:id/role
Update user role.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Available Roles:**
- `observer` - Read-only access
- `user` - Standard user access
- `admin` - Full administrative access

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "role": "admin"
}
```

---

### PATCH /admin/users/:id/usage-plans
Update user usage plans (admin only).

**Request Body:**
```json
{
  "usagePlans": ["user", "store", "enterprise"]
}
```

**Available Usage Plans:**
- `child` - Child account features
- `user` - Standard user features
- `store` - Store/business features
- `enterprise` - Enterprise features

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "usagePlans": ["user", "store", "enterprise"]
}
```

---

### PATCH /admin/users/:id/password
Update user password (admin only).

**Request Body:**
```json
{
  "password": "newsecurepassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

---

### DELETE /admin/users/:id
Delete a user.

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

---

### GET /admin/calendars
Get all calendars in the system.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Work Calendar",
    "owner": {
      "id": 1,
      "username": "johndoe"
    },
    "visibility": "private",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /admin/calendars/:id
Get specific calendar details (admin).

---

### POST /admin/calendars
Create calendar (admin).

---

### PATCH /admin/calendars/:id
Update calendar (admin).

---

### DELETE /admin/calendars/:id
Delete calendar (admin).

---

### GET /admin/events
Get all events in the system.

---

### GET /admin/events/:id
Get specific event (admin).

---

### POST /admin/events
Create event (admin).

---

### PATCH /admin/events/:id
Update event (admin).

---

### DELETE /admin/events/:id
Delete event (admin).

---

### GET /admin/reservations
Get all reservations in the system (Admin only).

**Response (200 OK):**
```json
[
  {
    "id": 22,
    "startTime": "2025-09-25T14:00:00.000Z",
    "endTime": "2025-09-25T15:30:00.000Z",
    "status": "confirmed",
    "resource": {
      "id": 14,
      "name": "Meeting Room Alpha"
    },
    "createdBy": {
      "id": 1,
      "username": "admin"
    }
  }
]
```

---

### GET /admin/calendar-shares
Get all calendar sharing records.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "calendar": {
      "id": 1,
      "name": "Work Calendar"
    },
    "user": {
      "id": 3,
      "username": "teammate"
    },
    "permission": "write",
    "sharedAt": "2024-01-10T00:00:00.000Z"
  }
]
```

---

## Organisation Admin Management

**Note:** These endpoints manage organisation-level administrators and user assignments. Global admins have full access, while organisation admins can only manage their assigned organisations.

### POST /organisations/:id/admins
Assign a user as organisation admin (Global admin only).

**Request Body:**
```json
{
  "userId": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Organisation admin assigned successfully",
  "data": {
    "id": 1,
    "userId": 5,
    "organisationId": 2,
    "createdAt": "2025-09-29T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden` - Only global admins can assign organisation admins
- `404 Not Found` - User or organisation not found

---

### DELETE /organisations/:id/admins/:userId
Remove a user from organisation admin role (Global admin only).

**Response (200 OK):**
```json
{
  "message": "Organisation admin removed successfully"
}
```

---

### GET /organisations/:id/admins
Get all organisation admins for a specific organisation.

**Response (200 OK):**
```json
{
  "message": "Organisation admins retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": 5,
      "organisationId": 2,
      "user": {
        "id": 5,
        "username": "orgadmin1",
        "email": "orgadmin@example.com",
        "firstName": "John",
        "lastName": "Admin"
      },
      "createdAt": "2025-09-29T12:00:00.000Z"
    }
  ]
}
```

---

### POST /organisations/:id/users
Add a user to an organisation (Org admin or Global admin).

**Request Body:**
```json
{
  "userId": 7
}
```

**Response (200 OK):**
```json
{
  "message": "User added to organisation successfully"
}
```

---

### DELETE /organisations/:id/users/:userId
Remove a user from an organisation (Org admin or Global admin).

**Response (200 OK):**
```json
{
  "message": "User removed from organisation successfully"
}
```

---

### GET /organisations/:id/users
Get all users in an organisation.

**Response (200 OK):**
```json
{
  "message": "Organisation users retrieved successfully",
  "data": [
    {
      "id": 7,
      "username": "user1",
      "email": "user1@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ]
}
```

---

### GET /organisations/admin-roles
Get all organisations where the current user is an admin.

**Response (200 OK):**
```json
{
  "message": "User organisation admin roles retrieved successfully",
  "data": [
    {
      "id": 1,
      "organisationId": 2,
      "organisation": {
        "id": 2,
        "name": "Salon Elegance",
        "description": "Premium hairdressing salon"
      }
    }
  ]
}
```

---

### GET /organisations/:id/admin-status
Check if the current user is an admin for a specific organisation.

**Response (200 OK):**
```json
{
  "message": "Organisation admin status retrieved successfully",
  "data": {
    "isAdmin": true
  }
}
```

---

### GET /admin/organizations
Get all organizations in the system (Global admin only).

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Salon Elegance",
    "description": "Premium hairdressing salon",
    "isActive": true,
    "users": [],
    "resourceTypes": []
  }
]
```

---

### GET /admin/users/:id/organizations
Get organizations for a specific user (Global admin only).

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Salon Elegance",
    "description": "Premium hairdressing salon"
  }
]
```

---

### POST /admin/users/:id/organizations
Add user to organization (Global admin only).

**Request Body:**
```json
{
  "organizationId": 2
}
```

**Response (200 OK):**
```json
{
  "message": "User added to organization successfully"
}
```

---

### DELETE /admin/users/:id/organizations/:orgId
Remove user from organization (Global admin only).

**Response (200 OK):**
```json
{
  "message": "User removed from organization successfully"
}
```

---

### GET /admin/organizations/:id/users
Get organization users with roles (Global admin only).

**Response (200 OK):**
```json
[
  {
    "id": 5,
    "username": "user1",
    "email": "user1@example.com",
    "isOrgAdmin": true
  }
]
```

---

### POST /admin/organizations/:id/users
Add user to organization with role (Global admin only).

**Request Body:**
```json
{
  "userId": 7,
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "message": "User added to organization successfully"
}
```

---

## Reservation Calendars

**Note:** Reservation calendars provide fine-grained access control for reservation management within organisations. Users can have different roles (editor, reviewer) on different calendars.

### POST /organisations/:id/reservation-calendars
Create a new reservation calendar for an organisation (Org admin or Global admin).

**Request Body:**
```json
{
  "name": "Main Booking Calendar",
  "description": "Primary reservation calendar for all bookings"
}
```

**Response (200 OK):**
```json
{
  "message": "Reservation calendar created successfully",
  "data": {
    "id": 1,
    "name": "Main Booking Calendar",
    "description": "Primary reservation calendar for all bookings",
    "organisationId": 2,
    "createdAt": "2025-09-29T12:00:00.000Z"
  }
}
```

---

### GET /organisations/:id/reservation-calendars
Get all reservation calendars for an organisation (Org admin or Global admin).

**Response (200 OK):**
```json
{
  "message": "Organisation reservation calendars retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Main Booking Calendar",
      "description": "Primary reservation calendar",
      "organisationId": 2,
      "organisation": {
        "id": 2,
        "name": "Salon Elegance"
      }
    }
  ]
}
```

---

### POST /reservation-calendars/:id/roles
Assign a role to a user for a reservation calendar (Org admin or Global admin).

**Request Body:**
```json
{
  "userId": 7,
  "role": "editor"
}
```

**Available Roles:**
- `editor` - Can create, edit, and delete reservations
- `reviewer` - Can view and approve reservations, but cannot edit

**Response (200 OK):**
```json
{
  "message": "Calendar role assigned successfully",
  "data": {
    "id": 1,
    "userId": 7,
    "reservationCalendarId": 1,
    "role": "editor",
    "createdAt": "2025-09-29T12:00:00.000Z"
  }
}
```

---

### DELETE /reservation-calendars/:id/roles/:userId
Remove a role from a user for a reservation calendar (Org admin or Global admin).

**Response (200 OK):**
```json
{
  "message": "Calendar role removed successfully"
}
```

---

### GET /reservation-calendars/:id/roles
Get all roles for a specific reservation calendar.

**Response (200 OK):**
```json
{
  "message": "Calendar roles retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": 7,
      "role": "editor",
      "user": {
        "id": 7,
        "username": "editor1",
        "email": "editor@example.com"
      }
    },
    {
      "id": 2,
      "userId": 8,
      "role": "reviewer",
      "user": {
        "id": 8,
        "username": "reviewer1",
        "email": "reviewer@example.com"
      }
    }
  ]
}
```

---

### GET /users/reservation-calendars
Get all reservation calendars that the current user has access to.

**Response (200 OK):**
```json
{
  "message": "User reservation calendars retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Main Booking Calendar",
      "description": "Primary reservation calendar",
      "role": "editor",
      "organisation": {
        "id": 2,
        "name": "Salon Elegance"
      }
    }
  ]
}
```

---

### GET /reservation-calendars/:id/my-role
Get user's role for a specific reservation calendar.

**Response (200 OK):**
```json
{
  "message": "User calendar role retrieved successfully",
  "data": {
    "role": "editor",
    "canEdit": true,
    "canReview": true
  }
}
```

---

### GET /reservation-calendars/:id/has-role/:role
Check if user has a specific role for a reservation calendar.

**Parameters:**
- `role`: "editor" | "reviewer"

**Response (200 OK):**
```json
{
  "message": "Role check completed successfully",
  "data": {
    "hasRole": true
  }
}
```

---

## User Permissions

**Note:** These endpoints provide information about the current user's permissions and accessible resources.

### GET /user-permissions
Get current user permissions.

**Response (200 OK):**
```json
{
  "canAccessReservations": true,
  "accessibleOrganizationIds": [2, 5],
  "adminOrganizationIds": [2],
  "editableReservationCalendarIds": [1, 3],
  "viewableReservationCalendarIds": [1, 2, 3, 4],
  "isSuperAdmin": false
}
```

---

### GET /user-permissions/accessible-organizations
Get organizations accessible to current user.

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Salon Elegance",
    "description": "Premium hairdressing salon",
    "isActive": true
  }
]
```

---

### GET /user-permissions/accessible-reservation-calendars
Get reservation calendars accessible to current user.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Main Booking Calendar",
    "role": "editor",
    "organisation": {
      "id": 2,
      "name": "Salon Elegance"
    }
  }
]
```

---

## Data Models

### User Entity
```typescript
{
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'observer' | 'user' | 'admin';
  themeColor: string; // Hex color code
  weekStartDay: number; // 0-6 (0=Sunday)
  defaultCalendarView: 'month' | 'week';
  timezone: string; // IANA timezone
  timeFormat: '12h' | '24h';
  usagePlans: UsagePlan[]; // Array of usage plans
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Calendar Entity
```typescript
{
  id: number;
  name: string;
  description?: string;
  color: string; // Hex color code
  visibility: 'private' | 'public' | 'shared';
  isActive: boolean;
  owner: User;
  sharedWith: CalendarShare[];
  events: Event[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Event Entity
```typescript
{
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  startTime?: string;
  endDate: Date;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  color: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentEventId?: number;
  calendar: Calendar;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### RecurrencePattern
```typescript
{
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0-6
  dayOfMonth?: number; // 1-31
  monthOfYear?: number; // 1-12
  endDate?: Date;
  occurrences?: number;
}
```

### CalendarShare
```typescript
{
  id: number;
  calendar: Calendar;
  user: User;
  permission: 'read' | 'write' | 'admin';
  sharedAt: Date;
}
```

### CalendarSync
```typescript
{
  id: number;
  user: User;
  provider: 'google' | 'microsoft';
  providerCalendarId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  lastSync?: Date;
  isActive: boolean;
}
```

### Organisation Entity
```typescript
{
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  users: User[];
  resourceTypes: ResourceType[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ResourceType Entity
```typescript
{
  id: number;
  name: string;
  description?: string;
  minBookingDuration: number; // in minutes
  bufferTime: number; // in minutes
  customerInfoFields: string[]; // JSON array
  waitlistEnabled: boolean;
  recurringEnabled: boolean;
  isActive: boolean;
  organisation: Organisation;
  resources: Resource[];
  operatingHours: OperatingHours[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Resource Entity
```typescript
{
  id: number;
  name: string;
  description?: string;
  capacity: number;
  isActive: boolean;
  resourceType: ResourceType;
  managedBy?: User;
  reservations: Reservation[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Reservation Entity
```typescript
{
  id: number;
  startTime: Date;
  endTime: Date;
  quantity: number;
  customerInfo: Record<string, any>; // JSON object
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'waitlist';
  notes?: string;
  parentReservationId?: number;
  recurrencePattern?: Record<string, any>; // JSON object
  resource: Resource;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### OperatingHours Entity
```typescript
{
  id: number;
  dayOfWeek: number; // 0-6 (0=Sunday)
  openTime: string; // HH:MM:SS format
  closeTime: string; // HH:MM:SS format
  isOpen: boolean;
  resourceType: ResourceType;
  createdAt: Date;
  updatedAt: Date;
}
```

### RecurrencePattern (for Reservations)
```typescript
{
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0-6, for weekly recurring
  count?: number; // number of occurrences
  endDate?: Date; // alternative to count
}
```

### AutomationRule Entity
```typescript
{
  id: number;
  name: string; // Unique per user
  description?: string;
  triggerType: 'event.created' | 'event.updated' | 'event.deleted' | 'event.starts_in' | 'event.ends_in' | 'calendar.imported' | 'scheduled.time';
  triggerConfig?: Record<string, any>; // JSON object
  isEnabled: boolean;
  conditionLogic: 'AND' | 'OR';
  lastExecutedAt?: Date;
  executionCount: number;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### AutomationCondition Entity
```typescript
{
  id: number;
  field: string; // e.g., 'event.title', 'event.calendar.name'
  operator: 'contains' | 'not_contains' | 'matches' | 'not_matches' | 'equals' | 'not_equals' |
            'starts_with' | 'ends_with' | 'greater_than' | 'less_than' |
            'greater_than_or_equal' | 'less_than_or_equal' | 'is_true' | 'is_false' | 'in' | 'not_in';
  value: string; // Stored as string, parsed based on field type
  groupId?: string; // UUID for grouping (future use)
  logicOperator: 'AND' | 'OR' | 'NOT';
  order: number; // Evaluation order
  createdAt: Date;
  updatedAt: Date;
}
```

### AutomationAction Entity
```typescript
{
  id: number;
  actionType: 'set_event_color' | 'send_notification' | 'modify_event_title' |
              'modify_event_description' | 'create_task' | 'webhook' | 'create_reminder' | 'move_to_calendar';
  actionConfig: Record<string, any>; // JSON object with action-specific config
  order: number; // Execution order
  createdAt: Date;
  updatedAt: Date;
}
```

### AutomationAuditLog Entity
```typescript
{
  id: number;
  ruleId: number;
  rule?: AutomationRule;
  eventId?: number;
  event?: Event;
  triggerType: string;
  triggerContext?: Record<string, any>; // JSON object
  conditionsResult: Record<string, any>; // JSON object with evaluation results
  actionResults?: Record<string, any>[]; // JSON array
  status: 'success' | 'partial_success' | 'failure' | 'skipped';
  errorMessage?: string;
  duration_ms: number;
  executedAt: Date;
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

**2xx Success:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully

**4xx Client Errors:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource or constraint violation

**5xx Server Errors:**
- `500 Internal Server Error` - Server-side error

### Error Examples

**Authentication Error:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Validation Error:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 6 characters"
  ],
  "error": "Bad Request"
}
```

**Permission Error:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions to access this resource",
  "error": "Forbidden"
}
```

---

## Rate Limiting

**Note:** Rate limiting is recommended for production deployment.

Suggested limits:
- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute
- Admin endpoints: 50 requests per minute

---

## Pagination

For endpoints returning large datasets, pagination is recommended:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Example:**
```
GET /events?page=2&limit=20
```

**Paginated Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## WebSocket Events (Future Enhancement)

For real-time updates, WebSocket support can be added:

**Events:**
- `event.created` - New event created
- `event.updated` - Event updated
- `event.deleted` - Event deleted
- `calendar.shared` - Calendar shared with user
- `sync.completed` - Calendar sync completed

---

## Versioning

Current API Version: **v1**

Future versions will be accessed via:
```
/api/v2/...
```

---

## Support

For API support and questions:
- Documentation: https://docs.cal3app.com
- GitHub Issues: https://github.com/Csepi/cal3/issues
- Email: support@cal3app.com

---

**Last Updated:** September 2025
**API Version:** 1.2.0

## Reservation System Testing Results

All reservation system endpoints have been successfully tested:

### ✅ Tested Endpoints

**Organisations:**
- ✅ GET /api/organisations - Returns array of organisations with relations
- ✅ GET /api/organisations/:id - Returns single organisation details
- ✅ POST /api/organisations - Creates new organisation
- ✅ PATCH /api/organisations/:id - Updates organisation details

**Resource Types:**
- ✅ GET /api/resource-types - Returns array with organisation relations
- ✅ POST /api/resource-types - Creates new resource type with settings
- ✅ PATCH /api/resource-types/:id - Updates settings and configuration

**Resources:**
- ✅ GET /api/resources - Returns array with resource type relations
- ✅ POST /api/resources - Creates new resource with capacity
- ✅ PATCH /api/resources/:id - Updates resource details

**Reservations:**
- ✅ GET /api/reservations - Returns array with full relations (resource, createdBy)
- ✅ POST /api/reservations - Creates reservation with customerInfo object
- ✅ PATCH /api/reservations/:id - Updates reservation status and details
- ✅ POST /api/reservations/recurring - Creates recurring reservation series

**Admin:**
- ✅ GET /api/admin/users - Returns user list with usage plans
- ✅ GET /api/admin/stats - Returns comprehensive system statistics
- ✅ PATCH /api/admin/users/:id/usage-plans - Updates user permissions

### 🔍 Test Examples

All endpoints return properly formatted JSON with appropriate HTTP status codes. Authentication is properly enforced with JWT Bearer tokens. Error responses follow consistent format with descriptive messages.

### 📊 Coverage Summary
- **Total Endpoints Tested**: 15+ reservation system endpoints
- **Success Rate**: 100% - All endpoints functional
- **Authentication**: ✅ Properly enforced
- **Data Validation**: ✅ Working correctly
- **Error Handling**: ✅ Consistent format
- **Relations**: ✅ Properly loaded and returned