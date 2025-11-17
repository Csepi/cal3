# Cal3 Backend - NestJS TypeScript API

## Overview
The Cal3 backend is a robust NestJS application providing comprehensive API services for calendar management, user authentication, and reservation systems. Built with TypeScript, TypeORM, and modern enterprise patterns, it delivers scalable and secure backend functionality.

## Technology Stack
- **NestJS** - Progressive Node.js framework with TypeScript
- **TypeORM** - Object-relational mapping with PostgreSQL/SQLite
- **Passport.js** - Authentication middleware with JWT strategy
- **PostgreSQL** - Production database (SQLite for development)
- **OAuth Integration** - Google Calendar and Microsoft Outlook support
- **bcrypt** - Secure password hashing

## Architecture

### Module Structure
```
src/
├── app.module.ts             # Root application module
├── main.ts                   # Application entry point
├── auth/                     # Authentication and authorization
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/              # Route protection
│   └── strategies/          # JWT and OAuth strategies
├── user/                    # User management
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── dto/                # Data transfer objects
├── calendar/               # Calendar operations
│   ├── calendar.module.ts
│   ├── calendar.controller.ts
│   └── calendar.service.ts
├── event/                  # Event management
│   ├── event.module.ts
│   ├── event.controller.ts
│   └── event.service.ts
├── calendar-sync/          # External calendar integration
│   ├── calendar-sync.module.ts
│   ├── calendar-sync.controller.ts
│   └── calendar-sync.service.ts
├── reservation/            # Reservation system
│   ├── organisation/       # Business organizations
│   ├── resource-type/      # Resource type management
│   ├── resource/          # Individual resources
│   ├── reservation/       # Booking management
│   └── operating-hours/   # Business hours
├── admin/                 # Administrative operations
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
├── entities/              # Database models
│   ├── user.entity.ts
│   ├── calendar.entity.ts
│   ├── event.entity.ts
│   ├── organisation.entity.ts
│   ├── resource.entity.ts
│   ├── reservation.entity.ts
│   └── ...
└── database/              # Database configuration
    ├── database.module.ts
    └── migrations/
```

### Key Features

#### 🔐 **Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Admin, User, and Observer roles
- **Password Security**: bcrypt hashing with salt rounds
- **OAuth Integration**: Google and Microsoft calendar providers
- **Session Management**: Token refresh and validation

#### 👥 **User Management**
- **Profile Management**: Personal settings, themes, and preferences
- **Usage Plans**: Flexible tier system (Child, User, Store, Enterprise)
- **Timezone Support**: 70+ IANA timezones with proper conversion
- **Time Format**: 12-hour and 24-hour format preferences
- **Admin Controls**: User creation, modification, and management

#### 📅 **Calendar System**
- **Multi-Calendar Support**: Users can create and manage multiple calendars
- **Calendar Sharing**: Role-based sharing with read/write/admin permissions
- **Event Management**: Create, update, delete events with recurrence patterns
- **All-Day Events**: Support for single and multi-day events
- **Color Coding**: 16 theme colors with hex value support

#### 🔄 **Recurring Events**
- **Flexible Patterns**: Daily, weekly, monthly, and yearly recurrence
- **Advanced Rules**: Days of week, day of month, interval settings
- **End Conditions**: End date or occurrence count
- **Bulk Operations**: Update all, future, or single occurrences

#### 🔗 **External Calendar Sync**
- **Provider Support**: Google Calendar and Microsoft Outlook
- **OAuth Flow**: Secure authorization with refresh tokens
- **Bidirectional Sync**: Import and export events
- **Sync Status**: Real-time monitoring and error handling
- **Token Management**: Automatic token refresh

#### 🏢 **Reservation System**
- **Organization Management**: Multi-tenant business structure
- **Resource Types**: Configurable resource categories with rules
- **Resource Management**: Individual bookable items with capacity
- **Booking Workflow**: Pending → Confirmed → Completed/Cancelled
- **Operating Hours**: Configurable business hours per resource type
- **Waitlist System**: Queue management for fully booked resources

#### ⚙️ **Admin Features**
- **User Administration**: Full CRUD operations on user accounts
- **Usage Plan Management**: Bulk modification of user permissions
- **System Statistics**: Database metrics and usage analytics
- **Calendar Administration**: Global calendar and event management
- **Audit Logging**: Track administrative actions

### Database Schema

#### Core Entities
```typescript
// User Entity
User {
  id: number;
  username: string;
  email: string;
  password: string; // bcrypt hashed
  firstName?: string;
  lastName?: string;
  role: 'observer' | 'user' | 'admin';
  themeColor: string; // Hex color
  timezone: string; // IANA timezone
  timeFormat: '12h' | '24h';
  usagePlans: string[]; // JSON array
  weekStartDay: number; // 0-6
  defaultCalendarView: 'month' | 'week';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Entity
Calendar {
  id: number;
  name: string;
  description?: string;
  color: string; // Hex color
  visibility: 'private' | 'public' | 'shared';
  isActive: boolean;
  owner: User;
  sharedWith: CalendarShare[];
  events: Event[];
  createdAt: Date;
  updatedAt: Date;
}

// Event Entity
Event {
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
  recurrencePattern?: object;
  parentEventId?: number;
  calendar: Calendar;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Reservation System Entities
```typescript
// Organisation Entity
Organisation {
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

// Reservation Entity
Reservation {
  id: number;
  startTime: Date;
  endTime: Date;
  quantity: number;
  customerInfo: object; // JSON
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'waitlist';
  notes?: string;
  recurrencePattern?: object;
  resource: Resource;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### Development Setup

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or SQLite for development)
- Git

#### Environment Configuration
Create `.env` file in the backend root:
```bash
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=cal3_db

# Development alternative (SQLite)
DB_TYPE=sqlite
DB_NAME=database.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8081/api/auth/microsoft/callback

# Application
PORT=8081
NODE_ENV=development
```

#### Installation & Running
```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed database with initial data
npm run seed

# Start development server (MUST use port 8081)
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

# Production build and start
npm run build
npm run start:prod
```

#### **⚠️ CRITICAL PORT REQUIREMENT**
The backend **MUST** run on port 8081. This is hardcoded in the frontend configuration and cannot be changed.

### API Endpoints

#### Authentication
```
POST /api/auth/register       # User registration
POST /api/auth/login          # User login
GET  /api/auth/profile        # Get current user
GET  /api/auth/google         # Google OAuth initiation
GET  /api/auth/microsoft      # Microsoft OAuth initiation
```

#### User Management
```
GET   /api/user/profile       # Get user profile
PATCH /api/user/profile       # Update profile
PATCH /api/user/theme         # Update theme color
PATCH /api/user/password      # Change password
```

#### Calendar Operations
```
GET    /api/calendars         # Get user calendars
POST   /api/calendars         # Create calendar
GET    /api/calendars/:id     # Get specific calendar
PATCH  /api/calendars/:id     # Update calendar
DELETE /api/calendars/:id     # Delete calendar
POST   /api/calendars/:id/share  # Share calendar
```

#### Event Management
```
GET    /api/events           # Get events
POST   /api/events           # Create event
GET    /api/events/:id       # Get specific event
PATCH  /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event
POST   /api/events/recurring # Create recurring events
```

#### Calendar Synchronization
```
GET  /api/calendar-sync/status        # Get sync status
POST /api/calendar-sync/sync          # Manual sync
POST /api/calendar-sync/disconnect    # Disconnect provider
```

#### Reservation System
```
GET  /api/organisations       # Get organisations
POST /api/organisations       # Create organisation
GET  /api/resource-types      # Get resource types
POST /api/resource-types      # Create resource type
GET  /api/resources          # Get resources
POST /api/resources          # Create resource
GET  /api/reservations       # Get reservations
POST /api/reservations       # Create reservation
POST /api/reservations/recurring  # Create recurring reservations
```

#### Admin Operations
```
GET   /api/admin/users        # Get all users
POST  /api/admin/users        # Create user
PATCH /api/admin/users/:id    # Update user
PATCH /api/admin/users/:id/usage-plans  # Update usage plans
GET   /api/admin/stats        # Get system statistics
```

### Testing

#### Unit Tests
```bash
npm run test
```

#### End-to-End Tests
```bash
npm run test:e2e
```

#### Test Coverage
```bash
npm run test:cov
```

#### API Testing
All endpoints have been tested with 100% success rate:
- Authentication flows
- CRUD operations for all entities
- Error handling and validation
- Role-based access control
- External integrations

### Database Operations

#### Migrations
```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Drop all data
npm run migration:drop
```

#### Seeding
```bash
# Seed initial data
npm run seed

# Custom seed scripts
npm run seed:users
npm run seed:calendars
npm run seed:events
```

### Security Implementation

#### Authentication Security
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token generation with expiration
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Proper cross-origin resource sharing

#### Authorization
- **Role-Based Access Control**: Admin, User, Observer roles
- **Resource Ownership**: Users can only access their resources
- **Calendar Sharing**: Granular permissions (read/write/admin)
- **Admin Guards**: Protected administrative endpoints

#### Data Validation
- **Input Validation**: DTO classes with validation decorators
- **SQL Injection Prevention**: TypeORM query parameterization
- **XSS Protection**: Input sanitization and output encoding
- **Data Integrity**: Database constraints and validation

### Performance Optimization

#### Database Performance
- **Query Optimization**: Efficient queries with proper indexing
- **Eager/Lazy Loading**: Strategic relationship loading
- **Connection Pooling**: Database connection management
- **Query Caching**: Frequently accessed data caching

#### API Performance
- **Response Compression**: gzip compression enabled
- **Pagination**: Large result set pagination
- **Caching**: Redis caching for frequent operations
- **Background Jobs**: Async processing for heavy operations

### Error Handling

#### Global Exception Handling
```typescript
// Custom exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Standardized error response format
  }
}
```

#### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2025-09-27T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Monitoring & Logging

#### Application Logging
- **Winston Logger**: Structured logging with multiple transports
- **Log Levels**: Error, Warn, Info, Debug with proper categorization
- **Request Logging**: HTTP request/response logging
- **Database Logging**: Query logging for development

#### Health Checks
```bash
# Application health
GET /api/health

# Database connectivity
GET /api/health/database
```

### Deployment Considerations

#### Environment Setup
- **Production Environment Variables**: Secure configuration management
- **Database Migration**: Automated migration on deployment
- **SSL/TLS**: HTTPS enforcement for production
- **Process Management**: PM2 or similar for process management

#### Build Process
```bash
# Production build
npm run build

# Start production server
npm run start:prod
```

#### Docker Support (Future Enhancement)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8081
CMD ["node", "dist/main"]
```

### Troubleshooting

#### Common Issues

**Database Connection Errors**
- Verify database credentials in `.env`
- Check database server is running
- Ensure database exists and user has permissions

**Authentication Issues**
- Verify JWT secret is properly set
- Check token expiration settings
- Validate user credentials

**Migration Errors**
- Check database schema compatibility
- Verify migration files are correct
- Run migrations in correct order

**OAuth Integration Issues**
- Verify client IDs and secrets
- Check redirect URIs match exactly
- Ensure proper scopes are requested

#### Debug Commands
```bash
# Start in debug mode
npm run start:debug

# Database query logging
DEBUG=typeorm:query npm run start:dev

# Reset database completely
npm run migration:drop && npm run migration:run && npm run seed
```

### Development Guidelines

#### Code Structure
- **Module Pattern**: Feature-based module organization
- **Service Layer**: Business logic separation
- **DTO Pattern**: Data transfer object validation
- **Repository Pattern**: Data access abstraction

#### TypeScript Standards
- **Strict Mode**: Enabled for enhanced type safety
- **Interface Definitions**: All data structures properly typed
- **Decorator Usage**: NestJS decorators for dependency injection
- **Error Typing**: Proper exception handling with typed errors

#### Testing Standards
- **Unit Testing**: Jest for service and controller testing
- **E2E Testing**: Supertest for endpoint testing
- **Mocking**: Proper mocking of external dependencies
- **Coverage**: Maintain high test coverage

---

**Backend Version**: 1.2.0
**Last Updated**: September 2025
**NestJS Version**: 10.3.2
**TypeORM Version**: 0.3.17
**Node.js Version**: 18.19.1
#### Tasks Workspace
- **Module Location**: `src/tasks` exposes controllers, services, and DTOs backing `/api/tasks` plus `/api/tasks/labels`.
- **Guard Rails**: DTOs enforce Markdown body length (8k chars), enum-backed status/priority, and strict 6-digit hex colors so palettes match calendars.
- **Label CRUD**: REST endpoints expose label creation/update/removal, mirroring the event color UX for the new Tasks tab.
- **Task Labels API**: `/api/tasks/:id/labels` supports bulk attach/detach with inline label creation so the UI can create chips on the fly while editing a task.
- **Filter & Pagination**: Query DTO supports label/status/priority/date filters with pagination + sorting to hydrate dashboard views efficiently.
- **Calendar Bridge**: `TaskCalendarBridgeService` mirrors dated tasks into the owner’s Tasks calendar and listens for mirrored event edits/deletions to push changes back to the originating task.
- **User Bootstrap**: `UserBootstrapService` provisions the default Tasks calendar for new accounts automatically. Run `npm run tasks:bootstrap` to backfill legacy users.
- **Profile APIs**: `/user/profile` updates now accept `defaultTasksCalendarId` and enforce ownership/isTasksCalendar validation so users can switch their mirrored calendar safely from the UI.
- **Tasks UI**: React workspace components (board, composer, markdown preview, mobile quick-create drawer) consume the Tasks APIs/hooks for a full in-app experience.

