# Cal3 - Modern Calendar & Reservation Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Cal3 is a comprehensive, full-stack calendar and reservation management system built with modern web technologies. It provides powerful calendar functionality alongside a complete booking/reservation system for businesses like salons, restaurants, meeting rooms, and any time-based resource management.

## 🚀 Features Overview

### 📅 **Core Calendar System**
- **Multi-View Calendar**: Month, Week, and Day views with seamless navigation
- **Event Management**: Create, edit, delete, and manage events with drag-and-drop functionality
- **Recurring Events**: Support for daily, weekly, and monthly recurring patterns
- **All-Day Events**: Full support for all-day and multi-day events
- **Color-Coded Events**: 16 beautiful theme colors with gradient backgrounds
- **Timezone Support**: 70+ world timezones across all continents

### 🏢 **Complete Reservation System**
- **Organisation Management**: Multi-tenant system with organisation-based access control
- **Organisation Admin Roles**: Dedicated organisation administrators with granular permissions
- **Reservation Calendar Management**: Fine-grained calendar access control with editor/reviewer roles
- **Resource Types**: Define categories of bookable resources with custom settings
- **Resource Management**: Individual resource tracking with capacity limits
- **Booking Management**: Complete reservation lifecycle from pending to completion
- **Status Workflow**: Automated status transitions (pending → confirmed → completed/cancelled)
- **Waitlist System**: Queue management for fully booked resources
- **Operating Hours**: Configurable business hours per resource type
- **Customer Information**: Flexible customer data collection

### 👤 **User Management & Admin Panel**
- **Multi-Level Role System**: Global admins, organisation admins, and standard users
- **User Profiles**: Personal settings, timezone preferences, theme selection, and time format settings
- **Time Format Settings**: 12-hour and 24-hour format support across calendar views and event management
- **Usage Plans**: Flexible user tier system (Child, User, Store, Enterprise)
- **Admin Dashboard**: Comprehensive user management with bulk operations
- **Permission Management**: Fine-grained access control for organizations and reservation calendars
- **Profile Customization**: 16 theme colors and personalized settings

### 🔗 **Calendar Integration**
- **External Calendar Sync**: Connect with Google Calendar, Outlook, and other providers
- **OAuth Authentication**: Secure integration with external services
- **Two-Way Sync**: Import and export events between calendars
- **Sync Status Monitoring**: Real-time sync status and error handling

### 🤖 **Calendar Automation System**
- **Rule-Based Automation**: Create intelligent rules that respond to event lifecycle triggers
- **Event Lifecycle Triggers**: Automatic actions on event.created, event.updated, event.deleted, and time-based triggers
- **Flexible Conditions**: Boolean logic (AND/OR/NOT) with 15+ operators for precise control
- **Extensible Actions**: Plugin architecture supporting event coloring and future actions
- **Retroactive Execution**: "Run Now" feature to apply rules to existing events
- **Comprehensive Audit Logging**: Detailed execution history with 1000-entry circular buffer per rule
- **User-Scoped Rules**: Private automations with complete isolation between users

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Glass Morphism**: Modern backdrop-blur effects and gradient designs
- **Tailwind CSS**: Utility-first styling with consistent design system
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: User-friendly error messages and recovery options

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication system
- **Multi-Level RBAC**: Role-based access control with global admin, org admin, and calendar-level roles
- **Password Management**: Secure password hashing and reset functionality
- **API Security**: Protected routes with comprehensive authorization guards
- **Permission Service**: Centralized permission management for organization and calendar access
- **Input Validation**: Comprehensive server-side and client-side validation

## 🏗️ Architecture

### **Backend - NestJS**
```
backend-nestjs/
├── src/
│   ├── entities/          # TypeORM database models
│   │   ├── user.entity.ts
│   │   ├── event.entity.ts
│   │   ├── calendar.entity.ts
│   │   ├── organisation.entity.ts
│   │   ├── resource.entity.ts
│   │   ├── reservation.entity.ts
│   │   └── ...
│   ├── controllers/       # API endpoint controllers
│   ├── services/         # Business logic services
│   ├── dto/             # Data transfer objects
│   ├── modules/         # Feature modules
│   └── auth/           # Authentication & authorization
└── ...
```

### **Frontend - React TypeScript**
```
frontend/src/
├── components/           # React components
│   ├── Calendar.tsx      # Main calendar component
│   ├── MonthView.tsx     # Month calendar view
│   ├── WeekView.tsx      # Week calendar view
│   ├── UserProfile.tsx   # User settings
│   ├── AdminPanel.tsx    # Admin management
│   ├── ReservationsPanel.tsx  # Reservation system
│   ├── automation/       # Automation system components
│   │   ├── AutomationPanel.tsx
│   │   ├── AutomationRuleModal.tsx
│   │   ├── AutomationDetailView.tsx
│   │   └── builders/     # Rule builder components
│   └── ...
├── services/            # API integration
├── types/              # TypeScript definitions
└── hooks/             # Custom React hooks
```

## 🛠️ Technology Stack

### **Core Technologies**
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: NestJS 11, TypeORM, Node.js
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT, Passport.js (Google OAuth, Microsoft OAuth)
- **Authorization**: Custom RBAC with guards and decorators
- **API**: RESTful APIs with Swagger/OpenAPI documentation

### **Development Tools**
- **Hot Reload**: Vite for frontend, NestJS for backend
- **Type Safety**: Full TypeScript coverage (TypeScript 5.8+)
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git with conventional commits
- **API Documentation**: Swagger UI with comprehensive endpoint documentation

## 📋 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL database
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Csepi/cal3.git
cd cal3
```

2. **Backend Setup**
```bash
cd backend-nestjs
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and OAuth secrets

# Start backend development server
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Start frontend development server
npm run dev -- --port 8080
```

4. **Access the Application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:8081/api
- API Documentation: http://localhost:8081/api-docs (when implemented)

### **Default Credentials**
- **Admin User**: `admin` / `enterenter`
- **Regular User**: `user` / `enterenter`

## 🎯 Feature Demonstrations

### **1. Calendar Views**

**Month View**
- Clean grid layout with event cards
- Color-coded events by calendar
- Quick event creation and navigation
- Reservation integration with resource information

**Week View**
- Hourly time slots with precise event positioning
- User-configurable time format (12-hour AM/PM or 24-hour)
- Drag-to-select time ranges for new events
- Reservation blocks with status indicators
- Mobile-responsive design

### **2. Reservation Management System**

**Organisation Setup**
- Create and manage business organisations
- User assignment and role management
- Multi-tenant isolation

**Resource Configuration**
- Define resource types (meeting rooms, styling chairs, tables)
- Set booking constraints (minimum duration, buffer time)
- Configure capacity limits and operating hours

**Booking Process**
- Interactive time selection
- Customer information collection
- Availability checking and conflict resolution
- Status workflow management

**Admin Management**
- Comprehensive reservation dashboard
- Filtering by status, resource, date range
- Bulk operations and status updates
- Real-time booking statistics

### **3. User Experience**

**Profile Customization**
- 16 theme colors in rainbow order
- Timezone selection from 70+ world cities
- Personal information management
- Usage plan display

**Theme Colors Available**
- Red, Orange, Yellow, Lime
- Green, Emerald, Teal, Cyan
- Sky, Blue, Indigo, Violet
- Purple, Pink, Rose, Slate

**Calendar Integration**
- External calendar synchronization
- OAuth-based secure connections
- Sync status monitoring
- Error handling and recovery

## 📊 API Documentation

### **Authentication Endpoints**
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
GET  /api/auth/profile        # Get current user profile
GET  /api/auth/google         # Google OAuth login
GET  /api/auth/microsoft      # Microsoft OAuth login
```

### **Calendar & Events**
```
GET    /api/calendars         # Get user calendars
POST   /api/calendars         # Create calendar
GET    /api/events           # Get events
POST   /api/events           # Create event
PATCH  /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event
```

### **Automation System**
```
GET    /api/automation/rules              # List automation rules
POST   /api/automation/rules              # Create rule
GET    /api/automation/rules/:id          # Get rule details
PUT    /api/automation/rules/:id          # Update rule
DELETE /api/automation/rules/:id          # Delete rule
POST   /api/automation/rules/:id/execute  # Run rule retroactively
GET    /api/automation/rules/:id/audit-logs  # Get audit logs
GET    /api/automation/audit-logs/:logId  # Get log details
GET    /api/automation/rules/:id/stats    # Get execution stats
```

### **Reservation System**
```
GET    /api/organisations     # Get accessible organisations
POST   /api/organisations     # Create organisation (admin)
GET    /api/resource-types    # Get resource types
POST   /api/resource-types    # Create resource type
GET    /api/resources         # Get resources
POST   /api/resources         # Create resource
GET    /api/reservations      # Get reservations
POST   /api/reservations      # Create reservation
PATCH  /api/reservations/:id  # Update reservation status
```

### **Organisation Admin Management**
```
POST   /api/organisations/:id/admins         # Assign org admin
DELETE /api/organisations/:id/admins/:userId # Remove org admin
GET    /api/organisations/:id/admins         # Get org admins
POST   /api/organisations/:id/users          # Add user to org
DELETE /api/organisations/:id/users/:userId  # Remove user from org
GET    /api/organisations/admin-roles        # Get user's admin roles
```

### **Reservation Calendar Management**
```
POST   /api/organisations/:id/reservation-calendars  # Create calendar
GET    /api/organisations/:id/reservation-calendars  # Get org calendars
POST   /api/reservation-calendars/:id/roles          # Assign role
DELETE /api/reservation-calendars/:id/roles/:userId  # Remove role
GET    /api/users/reservation-calendars              # Get accessible calendars
```

### **User Permissions**
```
GET    /api/user-permissions                        # Get user permissions
GET    /api/user-permissions/accessible-organizations  # Get accessible orgs
GET    /api/user-permissions/accessible-reservation-calendars  # Get accessible calendars
```

### **Admin Operations**
```
GET    /api/admin/users                    # Get all users
PATCH  /api/admin/users/:id/usage-plans    # Modify user plans
GET    /api/admin/stats                    # Get system statistics
GET    /api/admin/organizations            # Get all organizations
POST   /api/admin/users/:id/organizations  # Add user to org
GET    /api/admin/reservations             # Get all reservations
```

For complete API documentation with request/response examples, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=cal3_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### **Port Configuration**
⚠️ **CRITICAL**: The application requires specific ports:
- **Frontend**: Port 8080 (hardcoded in configuration)
- **Backend**: Port 8081 (hardcoded in configuration)

These ports must not be changed as they are referenced throughout the application.

## 📈 Database Schema

### **Core Entities**
- **Users**: Authentication, profiles, usage plans
- **Calendars**: User calendars and sharing
- **Events**: Calendar events with recurrence support
- **Organisations**: Multi-tenant business entities
- **OrganisationAdmins**: Organisation-level administrators
- **ReservationCalendars**: Fine-grained calendar access control
- **ReservationCalendarRoles**: User roles for calendars (editor/reviewer)
- **Resources**: Bookable items with capacity
- **Reservations**: Booking records with status workflow
- **AutomationRules**: Automation rules with triggers and conditions
- **AutomationConditions**: Rule conditions with operators
- **AutomationActions**: Rule actions with configurations
- **AutomationAuditLogs**: Execution history and debugging

### **Key Relationships**
- Users ↔ Organisations (Many-to-Many)
- Users ↔ OrganisationAdmins (Many-to-Many through join table)
- Organisations → ReservationCalendars (One-to-Many)
- ReservationCalendars ↔ Users (Many-to-Many through ReservationCalendarRoles)
- Organisations → Resource Types (One-to-Many)
- Resource Types → Resources (One-to-Many)
- Resources → Reservations (One-to-Many)
- Users → Events (One-to-Many)
- Calendars → Events (One-to-Many)

## 🧪 Testing

### **Backend Testing**
```bash
cd backend-nestjs
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

### **Frontend Testing**
```bash
cd frontend
npm run test          # Component tests
npm run test:coverage # Coverage report
```

### **API Testing**
All REST APIs have been comprehensively tested with 100% success rate:
- Authentication flows
- CRUD operations for all entities
- Error handling and validation
- Role-based access control
- External integrations

## 🚀 Deployment

### **Production Build**
```bash
# Backend
cd backend-nestjs
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with your preferred web server
```

### **Docker Support** ✅
Full Docker deployment with configurable ports:

```bash
# Quick start (development)
cd docker && ./scripts/start-dev.sh

# Production deployment
cd docker && ./scripts/start-prod.sh

# Configure ports if conflicts exist:
# Add to Portainer environment variables or config/.env:
FRONTEND_PORT=8080    # Default: 8080
BACKEND_PORT=8081     # Default: 8081
DB_PORT=5433          # Default: 5433
```

📖 **Complete Docker Guide**: See [docker/README.md](docker/README.md) for detailed setup
📖 **Portainer Guide**: See [docker/PORTAINER_GUIDE.md](docker/PORTAINER_GUIDE.md) for UI deployment

## 🎉 Key Features Highlights

### **Recent Additions (v1.3.0)**
- ✅ **Calendar Automation System**: Complete rule-based automation with 8 phases implemented
  - Event lifecycle triggers (created, updated, deleted)
  - Time-based triggers (starts_in, ends_in, scheduled.time)
  - 15+ condition operators with boolean logic
  - Plugin-based action system (V1: event coloring)
  - Retroactive execution with rate limiting
  - Circular buffer audit logging (1000 entries per rule)
  - Complete frontend UI with builder components

### **Previous Additions (v1.2.0)**
- ✅ **Organisation Admin System**: Dedicated admin roles at the organisation level
- ✅ **Reservation Calendar Roles**: Editor and reviewer roles for fine-grained access control
- ✅ **Permission Service**: Centralized permission management system
- ✅ **Multi-Level RBAC**: Comprehensive role-based access control hierarchy
- ✅ **Enhanced Admin Panel**: Complete organization and user management interface

### **Established Features**
- ✅ **Hour Format Settings**: 12h/24h time format across all calendar views
- ✅ **16 Theme Colors**: Complete rainbow color palette with gradients
- ✅ **Timezone Support**: 70+ world timezones with automatic conversion
- ✅ **Usage Plans Management**: Flexible tier system with admin controls
- ✅ **Recurring Events**: Full support for daily, weekly, and monthly patterns
- ✅ **OAuth Integration**: Google and Microsoft calendar synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript strict mode
- Use conventional commit messages
- Maintain test coverage
- Follow the existing code style
- Update documentation as needed
- Test with multiple user roles (admin, org admin, user)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Development Team** - *Initial work and ongoing development*

## 🙏 Acknowledgments

- NestJS for the robust backend framework
- React community for excellent frontend tools
- Tailwind CSS for the utility-first styling approach
- TypeORM for seamless database integration
- All contributors and testers

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

## 🔮 Roadmap

### **Immediate Next Steps**
- [ ] Operating Hours Frontend UI
- [ ] Advanced Notification System
- [ ] Waitlist Auto-promotion
- [ ] Real-time Updates with WebSockets

### **Medium-term Goals**
- [ ] Customer Self-service Portal
- [ ] Payment Processing Integration
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)

### **Long-term Vision**
- [ ] External Calendar Integration Marketplace
- [ ] Multi-location Management
- [ ] Staff Scheduling Integration
- [ ] White-label Solutions
- [ ] API Marketplace for Third-party Plugins

---

**Cal3** - Empowering everyone from indivials up to businesses with modern calendar and reservation management solutions. Built with ❤️ using modern technologies.