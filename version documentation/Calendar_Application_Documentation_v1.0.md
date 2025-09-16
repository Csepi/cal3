# Calendar Application - Technical Documentation v1.0

**Project Name:** Calendar MVP
**Version:** 1.0
**Date:** September 16, 2025
**Author:** Development Team
**Repository:** https://github.com/Csepi/cal3

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Backend Modules](#backend-modules)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Installation & Setup](#installation--setup)
10. [Deployment](#deployment)
11. [Version History](#version-history)

---

## Project Overview

The Calendar MVP is a full-stack web application designed to provide comprehensive calendar management with modern UI/UX. The application features a React frontend with a NestJS backend, supporting multiple users, calendars, events, and an advanced admin system.

### Key Features

- **Multi-user calendar system** with role-based access control
- **Modern glassmorphism UI** with blue-based color scheme
- **Comprehensive admin panel** with system statistics
- **Event management** with recurring event support
- **Calendar sharing** with granular permissions
- **JWT-based authentication** system
- **Real-time data updates** via REST API

---

## Architecture

### System Architecture

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│                 │                 │                 │
│  React Frontend │◄───────────────►│  NestJS Backend │
│   (Port 8080)   │                 │   (Port 8081)   │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
                                             │
                                             │ TypeORM
                                             ▼
                                    ┌─────────────────┐
                                    │                 │
                                    │  SQLite Database│
                                    │                 │
                                    └─────────────────┘
```

### Project Structure

```
cal3/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/         # React Components
│   │   ├── services/           # API Services
│   │   ├── types/             # TypeScript Interfaces
│   │   └── styles/            # CSS & Animations
│   └── package.json
│
├── backend-nestjs/             # NestJS Application
│   ├── src/
│   │   ├── entities/          # Database Models
│   │   ├── modules/           # Feature Modules
│   │   ├── dto/               # Data Transfer Objects
│   │   └── database/          # Seeding & Migrations
│   └── package.json
│
└── version documentation/      # Project Documentation
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.1 | UI Framework |
| **TypeScript** | 5.8.3 | Type Safety |
| **Vite** | 7.1.2 | Build Tool |
| **Tailwind CSS** | 3.4.14 | Styling Framework |
| **Custom CSS** | - | Animations & Effects |

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **NestJS** | 11.0.1 | Backend Framework |
| **TypeORM** | 0.3.26 | ORM |
| **SQLite** | 5.1.7 | Database |
| **JWT** | 11.0.0 | Authentication |
| **Passport** | 0.7.0 | Auth Strategy |
| **bcryptjs** | 3.0.2 | Password Hashing |
| **Swagger** | 11.2.0 | API Documentation |

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Git** - Version control
- **GitHub** - Repository hosting

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │──────►│  Calendars  │──────►│   Events    │
│             │ 1:N   │             │ 1:N   │             │
│ - id (PK)   │       │ - id (PK)   │       │ - id (PK)   │
│ - username  │       │ - name      │       │ - title     │
│ - email     │       │ - ownerId   │       │ - startDate │
│ - role      │       │ - color     │       │ - calendarId│
│ - isActive  │       │ - visibility│       │ - createdBy │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │
       │                      │ M:N
       │              ┌─────────────────┐
       └─────────────►│ Calendar_Shares │
                 M:N  │                 │
                      │ - calendarId    │
                      │ - userId        │
                      │ - permission    │
                      └─────────────────┘
```

### Detailed Schema

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    isActive BOOLEAN DEFAULT true,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Calendars Table
```sql
CREATE TABLE calendars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(7) DEFAULT '#3b82f6',
    visibility VARCHAR(20) DEFAULT 'private',
    isActive BOOLEAN DEFAULT true,
    ownerId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id)
);
```

#### Events Table
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    startDate DATE NOT NULL,
    startTime TIME,
    endDate DATE,
    endTime TIME,
    isAllDay BOOLEAN DEFAULT false,
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'confirmed',
    recurrenceType VARCHAR(20) DEFAULT 'none',
    recurrenceRule JSON,
    color VARCHAR(7),
    notes TEXT,
    calendarId INTEGER NOT NULL,
    createdById INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calendarId) REFERENCES calendars(id),
    FOREIGN KEY (createdById) REFERENCES users(id)
);
```

#### Calendar Shares Table
```sql
CREATE TABLE calendar_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendarId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    permission VARCHAR(20) DEFAULT 'read',
    sharedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calendarId) REFERENCES calendars(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Enumerations

#### User Roles
- **OBSERVER**: Read-only access
- **USER**: Standard user with create/edit permissions
- **ADMIN**: Full system access with admin panel

#### Calendar Visibility
- **PRIVATE**: Only accessible by owner
- **SHARED**: Accessible by shared users
- **PUBLIC**: Publicly accessible

#### Event Status
- **CONFIRMED**: Confirmed event
- **TENTATIVE**: Tentative event
- **CANCELLED**: Cancelled event

#### Recurrence Types
- **NONE**: No recurrence
- **DAILY**: Daily recurrence
- **WEEKLY**: Weekly recurrence
- **MONTHLY**: Monthly recurrence
- **YEARLY**: Yearly recurrence

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Description:** User authentication with JWT token generation

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "user": {
    "id": 1,
    "username": "csepi",
    "email": "csepi@example.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/register
**Description:** New user registration

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

### Event Management Endpoints

#### GET /api/events
**Description:** Retrieve all events for authenticated user

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "startDate": "2025-09-16",
    "startTime": "09:00",
    "endDate": "2025-09-16",
    "endTime": "10:00",
    "location": "Conference Room",
    "calendar": {
      "id": 1,
      "name": "Work Calendar"
    }
  }
]
```

#### POST /api/events
**Description:** Create new event

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:MM",
  "isAllDay": false,
  "location": "string",
  "color": "#hex"
}
```

#### PUT /api/events/:id
**Description:** Update existing event

#### DELETE /api/events/:id
**Description:** Delete event

### Calendar Management Endpoints

#### GET /api/calendars
**Description:** Retrieve user calendars

#### POST /api/calendars
**Description:** Create new calendar

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "color": "#hex",
  "visibility": "private|shared|public"
}
```

#### PUT /api/calendars/:id
**Description:** Update calendar

#### DELETE /api/calendars/:id
**Description:** Delete calendar

### Admin Endpoints (Protected)

#### GET /api/admin/stats
**Description:** System statistics dashboard

**Response:**
```json
{
  "users": {
    "total": 15,
    "active": 12,
    "admins": 2
  },
  "calendars": {
    "total": 8
  },
  "events": {
    "total": 24
  },
  "shares": {
    "total": 5
  },
  "lastUpdated": "2025-09-16T10:30:00.000Z"
}
```

#### GET /api/admin/users
**Description:** Retrieve all users for admin management

#### DELETE /api/admin/users/:id
**Description:** Delete user (admin only)

#### PUT /api/admin/users/:id/role
**Description:** Update user role

---

## Frontend Components

### Component Architecture

#### Dashboard.tsx
**Purpose:** Main application container with navigation
**Features:**
- User authentication state management
- Role-based navigation (Calendar/Admin views)
- User profile display
- Logout functionality

#### Calendar.tsx
**Purpose:** Primary calendar interface
**Features:**
- Monthly calendar grid view
- Event creation, editing, deletion
- Event indicators with visual dots
- Month navigation
- Event filtering and display

#### Login.tsx
**Purpose:** User authentication interface
**Features:**
- Username/password login
- Demo mode access
- Admin credentials display
- Modern glassmorphism design

#### AdminPanel.tsx
**Purpose:** Administrative dashboard
**Features:**
- System statistics with clickable cards
- User management (CRUD operations)
- Calendar and event monitoring
- Database statistics
- Role management

### State Management
The application uses React's built-in state management with hooks:
- `useState` for component state
- `useEffect` for side effects and API calls
- Props drilling for data sharing between components

### Styling System
- **Tailwind CSS** for utility-first styling
- **Custom CSS animations** in `/src/styles/animations.css`
- **Glassmorphism effects** with backdrop blur
- **Responsive design** with mobile support
- **Blue-based color scheme** with gradient accents

---

## Backend Modules

### Module Structure

#### Auth Module
**Files:**
- `auth.controller.ts` - Authentication endpoints
- `auth.service.ts` - Authentication logic
- `jwt.strategy.ts` - JWT passport strategy
- `jwt-auth.guard.ts` - JWT protection guard

**Responsibilities:**
- User login/registration
- JWT token generation and validation
- Password hashing with bcryptjs
- Authentication middleware

#### Users Module
**Files:**
- `users.controller.ts` - User management endpoints
- `users.service.ts` - User business logic

**Responsibilities:**
- User profile management
- User CRUD operations
- User validation

#### Calendars Module
**Files:**
- `calendars.controller.ts` - Calendar endpoints
- `calendars.service.ts` - Calendar business logic

**Responsibilities:**
- Calendar CRUD operations
- Calendar sharing functionality
- Permission management
- Calendar-user relationships

#### Events Module
**Files:**
- `events.controller.ts` - Event endpoints
- `events.service.ts` - Event business logic

**Responsibilities:**
- Event CRUD operations
- Recurring event logic
- Event-calendar relationships
- Event filtering and querying

#### Admin Module
**Files:**
- `admin.controller.ts` - Admin panel endpoints
- `admin.service.ts` - Admin business logic
- `admin.guard.ts` - Admin role protection

**Responsibilities:**
- System statistics generation
- User management for admins
- System monitoring
- Database administration

### Database Integration
- **TypeORM** for object-relational mapping
- **SQLite** for development database
- **Automatic migrations** with entity changes
- **Seed data** for development setup

---

## User Roles & Permissions

### Permission Matrix

| Feature | Observer | User | Admin |
|---------|----------|------|-------|
| View own events | ✅ | ✅ | ✅ |
| Create events | ❌ | ✅ | ✅ |
| Edit own events | ❌ | ✅ | ✅ |
| Delete own events | ❌ | ✅ | ✅ |
| Create calendars | ❌ | ✅ | ✅ |
| Share calendars | ❌ | ✅ | ✅ |
| View admin panel | ❌ | ❌ | ✅ |
| Manage all users | ❌ | ❌ | ✅ |
| System statistics | ❌ | ❌ | ✅ |
| Delete any data | ❌ | ❌ | ✅ |

### Admin Credentials
- **Username:** csepi
- **Password:** enterenter
- **Role:** admin

### Demo Access
- **Username:** Any username
- **Password:** demo123
- **Role:** user

---

## Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn package manager
- Git

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:8080
```

### Backend Setup
```bash
cd backend-nestjs
npm install
npm run start:dev
# Runs on http://localhost:8081
```

### Database Setup
```bash
cd backend-nestjs
npm run seed
# Seeds database with sample data
```

### Environment Configuration
Create `.env` file in backend directory:
```
DB_PASSWORD="Enter.Enter"
JWT_SECRET="calendar-secret-key"
PORT=8081
```

### Development Commands

#### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run preview      # Preview build
```

#### Backend
```bash
npm run start:dev    # Development server with watch
npm run build        # Production build
npm run start:prod   # Production server
npm run test         # Run tests
npm run seed         # Seed database
```

---

## Deployment

### Production Considerations

#### Frontend Deployment
- Build optimized bundle with `npm run build`
- Deploy to static hosting (Netlify, Vercel, etc.)
- Configure environment variables for API URL

#### Backend Deployment
- Use production database (PostgreSQL recommended)
- Configure JWT secrets and environment variables
- Set up process manager (PM2)
- Enable HTTPS and CORS configuration
- Set up monitoring and logging

#### Database Migration
- Switch from SQLite to PostgreSQL for production
- Run migrations: `npm run migration:run`
- Set up database backups

### Docker Configuration (Recommended)
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8081
CMD ["npm", "run", "start:prod"]
```

---

## Version History

### Version 1.0 (September 16, 2025)
**Initial Release**

#### ✅ Completed Features:
- **Authentication System**
  - JWT-based login/registration
  - Role-based access control (Observer, User, Admin)
  - Password hashing and security

- **Calendar Management**
  - Create, edit, delete calendars
  - Color customization
  - Visibility settings
  - Calendar sharing with permissions

- **Event Management**
  - Full CRUD operations
  - Date/time scheduling
  - All-day events
  - Recurring events support
  - Location and notes
  - Event status tracking

- **Admin Panel**
  - System statistics dashboard
  - User management interface
  - Clickable navigation cards
  - Database monitoring
  - Role assignment

- **Modern UI/UX**
  - Glassmorphism design
  - Blue-based color scheme
  - Responsive layout
  - Custom animations
  - Smooth interactions

#### 🛠️ Technical Achievements:
- SQLite enum compatibility fixes
- TypeORM relationships setup
- Hot module replacement configuration
- Proper CORS and authentication flow
- Git repository with clean structure
- Comprehensive API documentation

#### 🎯 Key Metrics:
- **Backend**: 25+ API endpoints
- **Frontend**: 4 major components
- **Database**: 4 entities with relationships
- **Lines of Code**: 2000+ (backend), 1500+ (frontend)
- **Test Coverage**: Jest setup with initial tests

### Planned Future Releases

#### Version 1.1 (Upcoming)
- Email notifications for events
- Calendar import/export (ICS format)
- Mobile responsive improvements
- Performance optimizations

#### Version 1.2 (Future)
- Real-time collaboration
- WebSocket integration
- Advanced recurring patterns
- Meeting integration

#### Version 2.0 (Long-term)
- Mobile app (React Native)
- Advanced reporting
- Third-party integrations (Google Calendar, Outlook)
- Multi-tenant support

---

## Technical Notes

### Performance Considerations
- **Frontend**: Vite for fast development builds
- **Backend**: NestJS with efficient dependency injection
- **Database**: Indexed queries for performance
- **Caching**: Potential for Redis integration

### Security Features
- **JWT Authentication** with expiration
- **Password Hashing** with bcryptjs
- **Input Validation** with class-validator
- **SQL Injection Protection** via TypeORM
- **CORS Configuration** for API security

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code consistency
- **Prettier** for formatting
- **Git Hooks** for pre-commit validation

### Monitoring & Logging
- **Console Logging** in development
- **Error Handling** with try-catch blocks
- **Request Logging** via NestJS middleware
- **Database Query Logging** for debugging

---

## Support & Maintenance

### Development Team
- **Lead Developer**: Senior Full-Stack Developer
- **UI/UX Designer**: Modern interface design
- **Database Architect**: Schema design and optimization

### Contact Information
- **Repository**: https://github.com/Csepi/cal3
- **Issues**: GitHub Issues tracker
- **Documentation**: This document and inline code comments

### Contributing Guidelines
1. Fork the repository
2. Create feature branch
3. Follow TypeScript and ESLint rules
4. Add tests for new features
5. Submit pull request with detailed description

---

**Document Generated:** September 16, 2025
**Last Updated:** Version 1.0 Release
**Next Review:** October 2025

---

*This documentation is maintained as part of the Calendar MVP project and should be updated with each major release.*