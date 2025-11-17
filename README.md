# Cal3 - Modern Cloud Calendar & Reservation Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Cal3 is a comprehensive, cloud-based calendar and reservation management system built with modern web technologies. It provides powerful calendar functionality alongside a complete booking system for businesses like salons, restaurants, meeting rooms, and any time-based resource management needs.

**🌐 Cloud Service** - No installation required. Access anywhere, anytime from any device.

## 🚀 Core Features

### 📅 **Smart Calendar System**
- **Multi-View Calendar**: Month, Week, and Day views with seamless navigation
- **Drag & Drop Events**: Create and reschedule events with intuitive drag-and-drop
- **Time Range Selection**: Click and drag in Week view to create events instantly
- **Recurring Events**: Daily, weekly, and monthly recurring patterns with flexible options
- **All-Day Events**: Full support for all-day and multi-day events
- **Color-Coded Organization**: 16 beautiful theme colors with gradient backgrounds
- **398 Emoji Icons**: Extensive icon library across Calendar, Event, Resource, and Common categories
- **Timezone Intelligence**: 70+ world timezones with automatic conversion
- **12/24 Hour Format**: User-configurable time format across all views

### 🤖 **Calendar Automation System**
Intelligent automation that responds to your calendar events automatically:

- **Event Lifecycle Triggers**: Automatic actions on event creation, updates, and deletion
- **Time-Based Triggers**: React to events starting or ending (e.g., "30 minutes before event starts")
- **Scheduled Actions**: Cron-based scheduling for recurring automation tasks
- **Flexible Conditions**: Boolean logic (AND/OR/NOT) with 15+ operators
  - String operations: contains, equals, starts with, ends with, regex matching
  - Numeric comparisons: greater than, less than, equals, ranges
  - Boolean checks: is true, is false
  - List operations: in list, not in list
- **Smart Actions**: Event coloring, status updates (extensible plugin architecture)
- **Retroactive Execution**: Apply rules to existing events with "Run Now" feature
- **Audit Logging**: Complete execution history with 1000-entry buffer per rule
- **User Privacy**: All automations are private and isolated per user

### 🤖 **MCP Agent Integrations**
- Per-user agent profiles with granular action permissions (calendar access, automation triggers, profile data).
- One-click API key issuance with secure hashing and revocation controls.
- HTTP gateway for external MCP-compatible tools (`/api/mcp/metadata`, `/api/mcp/actions`, `/api/mcp/execute`).
- Tasks workspace endpoints so agents can list/create/update/delete tasks and manage labels while mirroring to the owner`s default Tasks calendar.
- [Setup guide](docs/agents/setup.md) · [Usage guide](docs/agents/usage.md)

**Example Use Cases**:
- Auto-color work meetings blue and personal events green
- Flag high-priority events when title contains "urgent"
- Track events longer than 2 hours
- Automatically process events from specific calendars

### 🏢 **Complete Reservation System**
Professional booking management for any business:

**Multi-Tenant Organization Management**
- Create and manage multiple business organizations
- Organization-level administrators with granular permissions
- User assignment and role management across organizations
- Complete isolation between organizations

**Resource & Booking Management**
- Define resource types (meeting rooms, styling chairs, tables, equipment)
- Individual resource tracking with capacity limits
- Configurable operating hours per resource type
- Booking constraints (minimum duration, buffer times between bookings)
- Real-time availability checking and conflict resolution

**Reservation Workflow**
- Status progression: Pending → Confirmed → Completed/Cancelled
- Waitlist system for fully booked resources with auto-promotion capability
- Customer information collection with flexible fields
- Booking calendar with color-coded status indicators
- Bulk operations for efficient management

**Fine-Grained Access Control**
- Reservation calendar-level permissions (Editor/Reviewer roles)
- Organization admins with full management capabilities
- User role assignment across multiple organizations
- Centralized permission management system

### 🔗 **External Calendar Integration**
- **OAuth Authentication**: Secure connections with Google Calendar and Microsoft Outlook
- **Two-Way Sync**: Import and export events between calendars
- **Sync Status Monitoring**: Real-time status updates and error handling
- **Multiple Account Support**: Connect multiple external calendars simultaneously

### 👤 **User Management**
- **Multi-Level Roles**: Global admins, organization admins, and standard users
- **Personal Profiles**: Timezone preferences, theme selection, time format settings
- **Usage Tiers**: Flexible plan system (Child, User, Store, Enterprise)
- **Admin Dashboard**: Comprehensive user management with bulk operations
- **Profile Customization**: 16 theme colors in rainbow order (Red → Violet)

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach optimized for all screen sizes
- **Touch-Friendly**: 44px+ touch targets for excellent mobile experience
- **Glass Morphism**: Modern backdrop-blur effects and gradient designs
- **Smooth Animations**: Loading states, transitions, and skeleton screens
- **Smart Error Handling**: User-friendly messages with recovery options
- **React Portal Modals**: Proper z-index layering for all dialogs and dropdowns

### 📱 **Native Mobile Apps**
**Android/iOS Apps** (Capacitor-powered):
- Native performance with web technology foundation
- Bottom tab navigation with role-based access
- Optimized calendar views (event dots in month view, time slots in week view)
- Swipe gestures with haptic feedback
- Pull-to-refresh functionality
- Safe area support for iOS notch/home bar
- Touch-optimized controls (WCAG AAA compliance)

### 🔐 **Enterprise-Grade Security**
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control (RBAC)**: Multi-level permission system
  - Global administrators (full system access)
  - Organization administrators (organization-level management)
  - Calendar editors (create/edit reservations)
  - Calendar reviewers (view-only access)
- **Password Security**: Industry-standard hashing and secure reset flows
- **API Protection**: Comprehensive authorization guards on all endpoints
- **Input Validation**: Server-side and client-side validation throughout

## 🏗️ Technology Stack

### **Frontend**
- **React 19** - Modern UI library with latest features
- **TypeScript 5.8+** - Full type safety across the codebase
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS** - Utility-first styling with custom design system
- **React Hooks** - Custom hooks for calendar settings, automation, and audit logs

### **Backend**
- **NestJS 11** - Enterprise-grade Node.js framework
- **TypeORM** - Powerful ORM with PostgreSQL support
- **Passport.js** - OAuth integration (Google, Microsoft)
- **JWT** - Secure authentication tokens
- **Swagger/OpenAPI** - Comprehensive API documentation

### **Database**
- **PostgreSQL** - Production-grade relational database
- **Optimized Schema** - Indexed columns for fast queries
- **Entity Relationships** - Complex many-to-many and one-to-many relationships

### **Mobile**
- **Capacitor** - Native Android/iOS app framework
- **Atomic Design** - Component library (Atoms → Molecules → Organisms)
- **Native Features** - Camera, notifications, haptic feedback

## 🎯 Key Feature Highlights

### **Version 1.2.7** (Latest)
- ✅ **Expanded Icon Library**: 398 emojis across 4 categories
  - Calendar: 40 icons (office/planning themed)
  - Event: 118 icons (celebrations, sports, food, entertainment, awards)
  - Resource: 129 icons (buildings, vehicles, technology, tools, packages)
  - Common: 111 icons (status, hearts, shapes, arrows, weather, symbols)
- ✅ **UI Refinements**: Fixed z-index layering, improved dropdown positioning
- ✅ **Calendar Sidebar**: Collapsible with icon display (collapsed + expanded views)
- ✅ **Icon Management**: Full save/load functionality across calendars and events

### **Version 1.3.0**
- ✅ **Calendar Automation System**: Production-ready rule-based automation
  - 7 trigger types (event lifecycle + time-based + scheduled)
  - 15+ condition operators with boolean logic
  - Plugin-based action system (extensible architecture)
  - Retroactive execution with rate limiting
  - Comprehensive audit logging (1000 entries per rule)
  - Complete frontend UI with visual rule builder

### **Version 1.2.0**
- ✅ **Organization Admin System**: Dedicated admin roles at organization level
- ✅ **Reservation Calendar Roles**: Editor/Reviewer permissions for fine-grained control
- ✅ **Permission Service**: Centralized permission management
- ✅ **Multi-Level RBAC**: Complete role hierarchy (Global → Org → Calendar)

### **Established Features**
- ✅ **Hour Format Settings**: 12h/24h across all calendar views and modals
- ✅ **16 Theme Colors**: Rainbow palette with gradients and hover states
- ✅ **70+ Timezones**: Automatic timezone conversion across Americas, Europe, Asia, Pacific
- ✅ **Usage Plans**: Flexible tier system (Child, User, Store, Enterprise)
- ✅ **OAuth Integration**: Google and Microsoft calendar synchronization
- ✅ **Feature Flags**: Global feature control (OAuth, Calendar Sync, Reservations, Automation)

## 📊 Use Cases

### **For Individuals**
- Personal calendar management with external sync
- Automated event organization and color coding
- Cross-device access (web + mobile apps)
- Recurring event management

### **For Small Businesses**
- Appointment scheduling (salons, clinics, consulting)
- Meeting room booking
- Equipment rental management
- Customer booking portal

### **For Enterprises**
- Multi-location resource management
- Department-level calendar organization
- Complex booking workflows with approvals
- Integration with existing calendar systems

### **For Service Industries**
- Restaurant table reservations
- Hotel room booking
- Fitness class scheduling
- Event space management

## 📱 Platform Availability

- **Web App**: Access from any modern browser (Chrome, Firefox, Safari, Edge)
- **Android App**: Native Android application (Google Play Store)
- **iOS App**: Native iOS application (App Store) - Coming soon
- **Progressive Web App**: Install directly from browser for app-like experience

## 🎨 Customization Options

### **Personal Themes**
16 theme colors with consistent design language:
- **Warm**: Red, Orange, Yellow, Lime
- **Cool**: Green, Emerald, Teal, Cyan, Sky, Blue
- **Deep**: Indigo, Violet, Purple
- **Soft**: Pink, Rose
- **Neutral**: Slate

### **Calendar Appearance**
- Color-coded calendars with gradient backgrounds
- Custom icons from 398-emoji library
- Configurable calendar visibility
- Collapsible sidebar for more screen space

### **Time & Locale**
- 70+ timezone options across all continents
- 12-hour AM/PM or 24-hour time format
- Date format localization

## 🔮 Roadmap

### **Q1 2025**
- [ ] Advanced notification system (email, SMS, push)
- [ ] Waitlist auto-promotion on cancellations
- [ ] Real-time updates with WebSockets
- [ ] Operating hours management UI

### **Q2 2025**
- [ ] Customer self-service booking portal
- [ ] Payment processing integration (Stripe, PayPal)
- [ ] Advanced analytics dashboard
- [ ] Staff scheduling module

### **Q3 2025**
- [ ] Multi-location management
- [ ] White-label solutions for agencies
- [ ] API marketplace for third-party plugins
- [ ] Advanced automation actions (notifications, webhooks)

### **Q4 2025**
- [ ] Calendar integration marketplace
- [ ] Team collaboration features
- [ ] Custom branding options
- [ ] Advanced reporting and insights

## 📞 Support & Documentation

- **Setup Guide**: See [setup-guide.md](setup-guide.md) for initial configuration
- **API Documentation**: Complete endpoint reference at [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Automation Guide**: Detailed automation documentation at [docs/automation.md](docs/automation.md)
- **Feature Flags**: Configuration guide at [docs/feature-flags.md](docs/feature-flags.md)
- **Deployment**: Server deployment guide at [DEPLOYMENT.md](DEPLOYMENT.md)

For support inquiries, please contact the development team or open an issue on GitHub.

## 🤝 Contributing

Contributions are welcome! Please see our contribution guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript strict mode and existing code style
4. Maintain test coverage
5. Use conventional commit messages
6. Submit a Pull Request

**Development Guidelines**:
- Full TypeScript type coverage
- Component-based architecture
- Comprehensive error handling
- Test with multiple user roles
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS for the robust backend framework
- React community for excellent frontend tools and libraries
- Tailwind CSS for utility-first styling approach
- TypeORM for seamless database integration
- Capacitor for native mobile app capabilities
- All contributors, testers, and early adopters

---

**Cal3** - Empowering individuals and businesses with modern calendar and reservation management. Built with ❤️ using cutting-edge technologies.

**Version**: 1.2.7 | **Status**: Production Ready | **License**: MIT
