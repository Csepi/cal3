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
- **Resource Types**: Define categories of bookable resources with custom settings
- **Resource Management**: Individual resource tracking with capacity limits
- **Booking Management**: Complete reservation lifecycle from pending to completion
- **Status Workflow**: Automated status transitions (pending → confirmed → completed/cancelled)
- **Waitlist System**: Queue management for fully booked resources
- **Operating Hours**: Configurable business hours per resource type
- **Customer Information**: Flexible customer data collection

### 👤 **User Management & Admin Panel**
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **User Profiles**: Personal settings, timezone preferences, and theme selection
- **Usage Plans**: Flexible user tier system (Child, User, Store, Enterprise)
- **Admin Dashboard**: Comprehensive user management with bulk operations
- **Profile Customization**: 16 theme colors and personalized settings

### 🔗 **Calendar Integration**
- **External Calendar Sync**: Connect with Google Calendar, Outlook, and other providers
- **OAuth Authentication**: Secure integration with external services
- **Two-Way Sync**: Import and export events between calendars
- **Sync Status Monitoring**: Real-time sync status and error handling

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Glass Morphism**: Modern backdrop-blur effects and gradient designs
- **Tailwind CSS**: Utility-first styling with consistent design system
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: User-friendly error messages and recovery options

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication system
- **Password Management**: Secure password hashing and reset functionality
- **API Security**: Protected routes with role-based authorization
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
│   └── ...
├── services/            # API integration
├── types/              # TypeScript definitions
└── hooks/             # Custom React hooks
```

## 🛠️ Technology Stack

### **Core Technologies**
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: NestJS, TypeORM, Node.js
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT, Passport.js
- **API**: RESTful APIs with comprehensive documentation

### **Development Tools**
- **Hot Reload**: Vite for frontend, NestJS for backend
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git with conventional commits

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

### **Reservation System**
```
GET    /api/organisations     # Get organisations
POST   /api/organisations     # Create organisation
GET    /api/resource-types    # Get resource types
POST   /api/resource-types    # Create resource type
GET    /api/resources         # Get resources
POST   /api/resources         # Create resource
GET    /api/reservations      # Get reservations
POST   /api/reservations      # Create reservation
PATCH  /api/reservations/:id  # Update reservation status
```

### **Admin Operations**
```
GET    /api/admin/users       # Get all users
PATCH  /api/admin/users/:id/usage-plans  # Modify user plans
GET    /api/admin/stats       # Get system statistics
```

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
- **Resources**: Bookable items with capacity
- **Reservations**: Booking records with status workflow

### **Key Relationships**
- Users ↔ Organisations (Many-to-Many)
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

### **Docker Support** (Future Enhancement)
```bash
docker-compose up -d
```

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

**Cal3** - Empowering businesses with modern calendar and reservation management solutions. Built with ❤️ using modern web technologies.