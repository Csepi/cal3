# Calendar Sharing API Documentation

## Overview

A comprehensive calendar sharing application with multi-user support built with NestJS + TypeScript and PostgreSQL. This API provides authentication, user management, calendar sharing, and event management capabilities.

## Base URL

```
http://localhost:3001/api
```

## Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Interactive API Documentation

When the server is running, visit: `http://localhost:3001/api/docs` for interactive Swagger documentation.

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## User Management Endpoints

### GET /api/users
Search for users (for calendar sharing). Requires authentication.

**Query Parameters:**
- `search` (optional): Search by username, email, firstName, or lastName

**Example:**
```
GET /api/users?search=john
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
]
```

### GET /api/users/me
Get current user profile. Requires authentication.

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Calendar Management Endpoints

### POST /api/calendars
Create a new calendar. Requires authentication.

**Request Body:**
```json
{
  "name": "Work Calendar",
  "description": "My work schedule and meetings",
  "color": "#3b82f6",
  "visibility": "PRIVATE"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Work Calendar",
  "description": "My work schedule and meetings",
  "color": "#3b82f6",
  "visibility": "PRIVATE",
  "ownerId": 1,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/calendars
Get all calendars (owned and shared with user). Requires authentication.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Work Calendar",
    "description": "My work schedule and meetings",
    "color": "#3b82f6",
    "visibility": "PRIVATE",
    "ownerId": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "owner": {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

### GET /api/calendars/:id
Get a specific calendar by ID. Requires authentication and access permissions.

**Response:**
```json
{
  "id": 1,
  "name": "Work Calendar",
  "description": "My work schedule and meetings",
  "color": "#3b82f6",
  "visibility": "PRIVATE",
  "ownerId": 1,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "owner": {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "sharedWith": [
    {
      "id": 2,
      "username": "jane_doe",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ]
}
```

### PATCH /api/calendars/:id
Update a calendar. Requires authentication and owner/admin permissions.

**Request Body:**
```json
{
  "name": "Updated Work Calendar",
  "description": "Updated description",
  "color": "#ef4444"
}
```

### DELETE /api/calendars/:id
Delete a calendar (soft delete). Requires authentication and owner permissions.

**Response:**
```json
{
  "message": "Calendar deleted successfully"
}
```

### POST /api/calendars/:id/share
Share a calendar with other users. Requires authentication and owner/admin permissions.

**Request Body:**
```json
{
  "userIds": [2, 3],
  "permission": "READ"
}
```

**Permission levels:**
- `READ`: Can view calendar and events
- `WRITE`: Can view, create, edit events
- `ADMIN`: Can view, create, edit events and manage sharing

**Response:**
```json
{
  "message": "Calendar shared successfully"
}
```

### DELETE /api/calendars/:id/share
Remove calendar sharing from users. Requires authentication and owner/admin permissions.

**Request Body:**
```json
{
  "userIds": [2, 3]
}
```

### GET /api/calendars/:id/shared-users
Get list of users that calendar is shared with. Requires authentication and access permissions.

**Response:**
```json
[
  {
    "user": {
      "id": 2,
      "username": "jane_doe",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "permission": "READ"
  }
]
```

---

## Event Management Endpoints

### POST /api/events
Create a new event. Requires authentication and write access to the calendar.

**Request Body:**
```json
{
  "calendarId": 1,
  "title": "Team Meeting",
  "description": "Weekly team sync meeting",
  "startDate": "2024-01-20T14:00:00Z",
  "endDate": "2024-01-20T15:00:00Z",
  "location": "Conference Room A",
  "allDay": false,
  "recurrenceRule": null
}
```

**Response:**
```json
{
  "id": 1,
  "calendarId": 1,
  "title": "Team Meeting",
  "description": "Weekly team sync meeting",
  "startDate": "2024-01-20T14:00:00Z",
  "endDate": "2024-01-20T15:00:00Z",
  "location": "Conference Room A",
  "allDay": false,
  "recurrenceRule": null,
  "createdById": 1,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/events
Get all events from accessible calendars. Requires authentication.

**Query Parameters:**
- `startDate` (optional): Filter events from this date (YYYY-MM-DD)
- `endDate` (optional): Filter events until this date (YYYY-MM-DD)

**Example:**
```
GET /api/events?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
[
  {
    "id": 1,
    "calendarId": 1,
    "title": "Team Meeting",
    "description": "Weekly team sync meeting",
    "startDate": "2024-01-20T14:00:00Z",
    "endDate": "2024-01-20T15:00:00Z",
    "location": "Conference Room A",
    "allDay": false,
    "calendar": {
      "id": 1,
      "name": "Work Calendar",
      "color": "#3b82f6"
    },
    "createdBy": {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

### GET /api/events/:id
Get a specific event by ID. Requires authentication and access to the calendar.

**Response:**
```json
{
  "id": 1,
  "calendarId": 1,
  "title": "Team Meeting",
  "description": "Weekly team sync meeting",
  "startDate": "2024-01-20T14:00:00Z",
  "endDate": "2024-01-20T15:00:00Z",
  "location": "Conference Room A",
  "allDay": false,
  "calendar": {
    "id": 1,
    "name": "Work Calendar",
    "color": "#3b82f6"
  },
  "createdBy": {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### PATCH /api/events/:id
Update an event. Requires authentication and write access to the calendar.

**Request Body:**
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated description",
  "startDate": "2024-01-20T15:00:00Z",
  "endDate": "2024-01-20T16:00:00Z"
}
```

### DELETE /api/events/:id
Delete an event. Requires authentication and write access to the calendar.

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

### GET /api/events/calendar/:calendarId
Get all events from a specific calendar. Requires authentication and access to the calendar.

**Response:**
```json
[
  {
    "id": 1,
    "calendarId": 1,
    "title": "Team Meeting",
    "description": "Weekly team sync meeting",
    "startDate": "2024-01-20T14:00:00Z",
    "endDate": "2024-01-20T15:00:00Z",
    "createdBy": {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

---

## Data Models

### User Entity
```typescript
{
  id: number;
  username: string;
  email: string;
  password: string; // bcrypt hashed
  firstName: string;
  lastName: string;
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
  color: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  ownerId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Event Entity
```typescript
{
  id: number;
  calendarId: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  allDay: boolean;
  recurrenceRule?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### CalendarShare Entity
```typescript
{
  id: number;
  calendarId: number;
  userId: number;
  permission: 'READ' | 'WRITE' | 'ADMIN';
  createdAt: Date;
}
```

---

## Environment Variables

```bash
# Database Configuration
DB_HOST=cal3-server.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=cal3admin
DB_PASSWORD=Enter.Enter
DB_NAME=cal3

# JWT Configuration
JWT_SECRET=your-secret-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   cd backend-nestjs
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export DB_PASSWORD="Enter.Enter"
   export JWT_SECRET="your-secret-key"
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm run start:dev
   ```

5. **Access the API:**
   - API Base URL: `http://localhost:3001/api`
   - Swagger Documentation: `http://localhost:3001/api/docs`

---

## Features

✅ **Authentication & Authorization**
- JWT-based authentication
- User registration and login
- Protected routes with guards

✅ **Multi-User Calendar System**
- Create multiple calendars per user
- Calendar ownership and permissions
- Soft delete for data integrity

✅ **Advanced Calendar Sharing**
- Share calendars with specific users
- Permission levels (READ, WRITE, ADMIN)
- Granular access control

✅ **Event Management**
- Create, read, update, delete events
- Date/time filtering
- Event ownership tracking
- Location and recurrence support

✅ **API Documentation**
- Comprehensive Swagger/OpenAPI docs
- Interactive API testing interface
- Request/response examples

✅ **Database Integration**
- PostgreSQL with TypeORM
- Entity relationships and migrations
- Connection to Azure Postgres

✅ **Production Ready**
- Input validation with DTOs
- Error handling and responses
- CORS configuration
- Environment-based configuration

This API provides a complete backend solution for a multi-user calendar sharing application with enterprise-grade features and security.