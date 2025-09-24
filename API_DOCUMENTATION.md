# Cal3 Calendar Application - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Calendars](#calendars)
4. [Events](#events)
5. [Calendar Sync](#calendar-sync)
6. [Admin](#admin)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)

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

**Last Updated:** January 2025
**API Version:** 1.0.0