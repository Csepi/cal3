# Claude Code Development Guide for Cal3 Calendar Application

## Project Overview
Cal3 is a modern full-stack calendar application built with NestJS backend and React TypeScript frontend. It features calendar sync, user profiles, timezone support, and comprehensive event management.

## Architecture
- **Backend**: NestJS + TypeORM + PostgreSQL/SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Mobile**: Capacitor wrapper for Android/iOS (v1.2.5)
- **Development**: Hot reload enabled on both frontend and backend

## ⚠️ MOBILE APP BUILD POLICY
**CRITICAL - READ CAREFULLY:**

From v1.2.5 onwards, mobile app builds follow a strict policy:

1. **Default Behavior**: All development requests modify **ONLY THE WEB APP**
2. **Mobile App Updates**: Mobile app is built **ONLY** when:
   - Explicitly requested with specific command (e.g., "build mobile app")
   - Major version release (e.g., v1.3.0, v2.0.0)
   - User specifically mentions "mobile" or "Android/iOS app"

3. **Rationale**:
   - Mobile builds take 1-2 minutes
   - Most changes are web-focused
   - Mobile app shares same web bundle (Capacitor wrapper)
   - Reduces unnecessary build time during rapid development

4. **Web Development Workflow** (Default):
   ```bash
   # Make changes to frontend
   # Test in browser (npm run dev)
   # Commit and push
   # NO mobile build unless explicitly requested
   ```

5. **Mobile Build Workflow** (Only when requested):
   ```bash
   cd frontend && npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   # APK at: android/app/build/outputs/apk/debug/app-debug.apk
   ```

**Remember**: Web changes automatically work in mobile app after sync - no rebuild needed during development!

## Quick Start Commands
```bash
# Frontend development server (default port: 8080, configurable via FRONTEND_PORT)
cd frontend && npm run dev -- --port 8080

# Backend development server (default port: 8081, configurable via PORT)
cd backend-nestjs && PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

# Database operations
cd backend-nestjs && npm run seed
```

## Browser MCP Testing Protocol
**⚠️ CRITICAL: ALWAYS USE BROWSER MCP FOR TESTING:**
- **ALWAYS** use Browser MCP (mcp__browsermcp__*) tools for testing the application
- Test **EVERY** feature and setting after making changes
- Navigate through all pages and verify functionality visually
- Take screenshots to verify UI changes
- Test user interactions (clicks, forms, navigation)
- Verify error states and edge cases
- **DO NOT** rely solely on code changes - always verify in the browser

## Port Configuration
**Default Ports (fully configurable via environment variables):**
- **Frontend**: Port 8080 (set via `FRONTEND_PORT` env var)
- **Backend**: Port 8081 (set via `PORT` env var)
- **Database**: Port 5433 (set via `DB_PORT` env var)

**Code has NO hardcoded ports** - all use environment variables with fallback defaults:
- Frontend: `import.meta.env.VITE_API_URL || 'http://localhost:8081'`
- Backend: `process.env.PORT || 8081`
- Backend CORS: `process.env.FRONTEND_URL || 'http://localhost:8080'`

**To use custom ports:**
1. Set environment variables in `.env` files
2. Update all URL variables to match (FRONTEND_URL, API_URL, VITE_API_URL)
3. Update OAuth callback URLs if using SSO

See [docker/README.md](docker/README.md) for complete port configuration guide.

## Environment Configuration

### Database Setup
**⚠️ IMPORTANT: External PostgreSQL Database**
- **Database Host**: 192.168.1.101:5433
- **Database Type**: PostgreSQL (self-hosted, shared environment)
- **Multiple Databases**: This host contains many databases besides cal3
- **DO NOT** modify docker-compose files to include this database
- **DO NOT** create database containers - use existing external database only
- **Configuration**: Set DB_HOST=192.168.1.101 and DB_PORT=5433 in backend-nestjs/.env

### Environment File Usage
- **Development Mode**: Uses `backend-nestjs/.env` file for configuration
- **Docker Mode**: Uses environment variables from docker-compose files
- **Never mix**: Development uses local .env, Docker uses compose environment variables

### Process Management
**⚠️ CRITICAL: Never Kill All Node Processes**
- **NEVER** run `taskkill /f /im node.exe` - this kills ALL Node.js processes on the system
- **ALWAYS** find the specific process by port first, then kill by PID
- **Correct workflow**:
  ```bash
  # Step 1: Find process by port
  netstat -ano | findstr :8080    # Frontend port
  netstat -ano | findstr :8081    # Backend port

  # Step 2: Kill specific process by PID (from rightmost column)
  taskkill /f /pid <PID_NUMBER>

  # Example:
  # netstat shows: TCP 0.0.0.0:8081 LISTENING 12345
  # Kill it: taskkill /f /pid 12345
  ```
- **Why this matters**: Killing all node.exe processes can terminate:
  - Other development servers
  - Background Node.js services
  - IDE extensions and tools
  - Other unrelated Node.js applications

## Current Development Status

### ✅ Recently Completed Features
1. **Mobile-First UI Overhaul (v1.1.9)** - Professional mobile app experience
   - Atomic Design Pattern component library (Atoms → Molecules → Organisms → Templates)
   - Responsive navigation with bottom tab bar on mobile
   - Mobile-optimized calendar views (month with event dots, week with time slots)
   - Swipe gestures for calendar navigation
   - Touch-optimized controls (44px+ touch targets, WCAG AAA)
   - Pull-to-refresh support
   - Floating action button for quick actions
   - Complete mobile component library for future page optimizations
   - See Mobile Architecture section below for details
2. **Feature Flags System** - Comprehensive global feature control system
   - Environment-based feature enablement (OAuth, Calendar Sync, Reservations, Automation)
   - Automatic UI hiding of disabled features (buttons, tabs, forms)
   - Public API endpoint for frontend feature flag queries
   - 5-minute frontend caching for performance
   - Complete documentation in [docs/feature-flags.md](docs/feature-flags.md)
3. **Calendar Automation System (v1.3.0)** - Complete rule-based automation with 8 phases implemented
   - Event lifecycle triggers (created, updated, deleted)
   - Time-based triggers (starts_in, ends_in, scheduled.time with cron)
   - 15+ condition operators with AND/OR boolean logic
   - Plugin-based action executor system (V1: event coloring)
   - Retroactive execution with rate limiting (1 min cooldown)
   - Circular buffer audit logging (1000 entries per rule)
   - Complete frontend UI with builder components and detail views
   - See [docs/automation.md](docs/automation.md) for comprehensive documentation
3. **Hour Format Settings Integration** - User profile time format (12h/24h) now applies to WeekView and CalendarEventModal
4. **Admin Usage Plan Management** - Individual and bulk modification of user usage plans with set/add/remove operations
5. **Expanded Color Palette** - 16 total theme colors in rainbow order including Sky (#0ea5e9) and Violet (#7c3aed)
6. **Usage Plans Read-Only Display** - User profile shows usage plans as non-editable badges in Account Information
7. **Comprehensive Timezone Support** - 70+ world timezones covering all continents
8. **Week View Time Range Selection** - Mouse drag functionality for creating events
9. **Profile Color Theming** - Applied to monthly and weekly view backgrounds with consistent gradients
10. **Modernized UI** - Softer gradients, backdrop-blur effects, improved readability
11. **Browser Extension Error Handling** - Robust suppression of extension context errors

### 📱 Mobile Architecture (Atomic Design Pattern)

Cal3 uses **Atomic Design Pattern** for mobile components, ensuring consistency, reusability, and scalability:

```
frontend/src/components/mobile/
├── index.ts                    # Central export for all mobile components
├── atoms/                      # Basic building blocks
│   ├── TouchableArea.tsx      # 44px+ touch targets with haptic feedback
│   ├── Icon.tsx               # Unified icon system (emoji or SVG)
│   └── Badge.tsx              # Notification badges and dots
├── molecules/                  # Simple component combinations
│   ├── TabBarItem.tsx         # Individual tab with icon, label, badge
│   ├── FormField.tsx          # Touch-optimized form input (48px height)
│   └── ListItem.tsx           # Touch-friendly list item with actions
├── organisms/                  # Complex UI components
│   ├── BottomTabBar.tsx       # Main mobile navigation (role + feature-flag aware)
│   ├── ResponsiveNavigation.tsx # Adaptive nav (bottom on mobile, horizontal on desktop)
│   ├── FloatingActionButton.tsx # FAB for primary actions (mobile only)
│   ├── MobileSection.tsx      # Collapsible section wrapper
│   └── MobileTable.tsx        # Responsive table (cards on mobile, table on desktop)
├── templates/                  # Page layouts
│   └── MobileLayout.tsx       # Main layout with safe areas, pull-to-refresh
└── calendar/                   # Calendar-specific mobile components
    ├── MobileMonthView.tsx    # Google Calendar-style event dots
    ├── MobileWeekView.tsx     # Full week with scrollable time slots
    ├── MobileCalendarHeader.tsx # Compact header with view switcher
    ├── DayDetailSheet.tsx     # Bottom sheet for day events
    └── EventListItem.tsx      # Touch-friendly event card
```

**Hooks for Mobile:**
```
frontend/src/hooks/
├── useScreenSize.ts           # Detect mobile/tablet/desktop breakpoints
└── useSwipeGesture.ts         # Swipe left/right with haptic feedback
```

**Mobile Design Principles:**
- **Touch Targets**: Minimum 44px (WCAG AAA compliance)
- **Conditional Rendering**: No hidden DOM elements (isMobile checks)
- **Haptic Feedback**: Vibration on interactions (navigator.vibrate)
- **Safe Areas**: iOS notch/home bar support (env() variables)
- **Pull-to-Refresh**: Standard mobile gesture pattern
- **Swipe Navigation**: Left/right swipes for calendar
- **Bottom Tab Bar**: 5-tab limit, role-based visibility
- **Feature Preservation**: ALL features work on ALL screen sizes

### 🔧 Key Components Structure
```
frontend/src/components/
├── Calendar.tsx           # Main calendar component with view switching
├── MonthView.tsx         # Month calendar grid with event display
├── WeekView.tsx          # Week view with time slots and drag selection
├── CalendarSidebar.tsx   # Navigation and calendar management
├── CalendarSync.tsx      # External calendar synchronization
├── UserProfile.tsx       # User settings, timezone, theme colors
├── AdminPanel.tsx        # Admin user management
├── ReservationsPanel.tsx # Reservation system
├── automation/           # Automation system components
│   ├── AutomationPanel.tsx           # Main automation panel
│   ├── AutomationList.tsx            # Rule list with filtering
│   ├── AutomationRuleCard.tsx        # Individual rule display
│   ├── AutomationRuleModal.tsx       # Create/edit rule modal
│   ├── AutomationDetailView.tsx      # Rule detail with tabs
│   ├── AuditLogViewer.tsx            # Execution history table
│   ├── builders/
│   │   ├── TriggerSelector.tsx       # Trigger configuration
│   │   ├── ConditionBuilder.tsx      # Condition management
│   │   ├── ConditionRow.tsx          # Individual condition
│   │   ├── ActionBuilder.tsx         # Action management
│   │   ├── ActionRow.tsx             # Type-specific actions
│   │   └── SetEventColorForm.tsx     # Color picker form
│   └── dialogs/
│       ├── RetroactiveExecutionDialog.tsx
│       └── DeleteRuleDialog.tsx
├── Dashboard.tsx         # Main dashboard layout with responsive navigation
└── mobile/               # See Mobile Architecture above
```

### 🎨 Theming System
The application uses a comprehensive color system with **16 theme colors** in rainbow order:
- **Red** (#ef4444), **Orange** (#f59e0b), **Yellow** (#eab308), **Lime** (#84cc16)
- **Green** (#10b981), **Emerald** (#22c55e), **Teal** (#14b8a6), **Cyan** (#06b6d4)
- **Sky** (#0ea5e9), **Blue** (#3b82f6), **Indigo** (#6366f1), **Violet** (#7c3aed)
- **Purple** (#8b5cf6), **Pink** (#ec4899), **Rose** (#f43f5e), **Slate** (#64748b)

Each color has corresponding gradients, hover states, button styles, and accessibility considerations across all components.

### 🌐 Timezone Implementation
Timezone support covers major cities across:
- **Americas**: 16 timezones (Anchorage to Sao Paulo)
- **Europe/Africa**: 22 timezones (London to Cape Town)
- **Asia**: 18 timezones (Dubai to Tokyo)
- **Australia/Pacific**: 14 timezones (Perth to Auckland)

## Development Patterns

### 🔄 State Management
- React useState/useEffect for local state
- Custom hooks for reusable logic:
  - useCalendarSettings - Calendar display preferences
  - useAutomationRules - Automation rule management
  - useAutomationMetadata - Trigger/condition/action metadata
  - useAuditLogs - Execution history management
- Props drilling with TypeScript interfaces for type safety

### 🎯 Event Handling
- Mouse events for time range selection in WeekView
- Keyboard navigation support
- Touch-friendly mobile interactions

### 🎨 Styling Approach
- Tailwind CSS with dynamic classes
- Gradient backgrounds for modern appeal
- Responsive design with mobile-first approach
- Backdrop-blur for glass morphism effects

## Common Development Tasks

### Adding New Colors
1. Update `themeColorOptions` in `UserProfile.tsx` (maintain rainbow order)
2. Add color mapping in all `getThemeColors()` functions:
   - Calendar.tsx, Dashboard.tsx, LoadingScreen.tsx
   - AdminPanel.tsx, CalendarSidebar.tsx
   - RecurrenceSelector.tsx, RecurrenceEditDialog.tsx
3. Include gradient definitions, button styles, and text colors for consistency

### Timezone Management
Timezones are defined in `UserProfile.tsx` with format:
```typescript
{ name: 'Display Name (City)', value: 'IANA_Timezone' }
```

### Event Management
Events use the `Event` interface in `types/Event.ts`:
- Support for all-day events
- Color coding and calendar association
- Timezone-aware date handling

### Time Format Implementation
Time format settings flow from user profile through component hierarchy:
- **Profile Setting**: Users select '12h' or '24h' format in UserProfile.tsx
- **Data Flow**: Dashboard → Calendar → EnhancedCalendar → WeekView/CalendarEventModal
- **Format Conversion**: '12h'/'24h' from profile converts to '12'/'24' for WeekView API
- **Default Values**: Falls back to '12h' format when user preference unavailable
- **Components Updated**: Calendar.tsx, Dashboard.tsx, EnhancedCalendar.tsx, CalendarEventModal.tsx

### Usage Plans Management
Usage plans control feature access and are managed by admins:
- **Available Plans**: Child, User, Store, Enterprise
- **Admin Controls**: Individual user modification via modal
- **Bulk Operations**: Set (replace), Add (append), Remove (subtract)
- **User Display**: Read-only badges in Account Information section
- **Backend**: Stored as JSON array in user entity (`usagePlans` field)

### Feature Flags System
Feature flags provide global control over feature availability:
- **Configuration**: Environment variables in backend `.env` file
- **Available Flags**: `ENABLE_OAUTH`, `ENABLE_CALENDAR_SYNC`, `ENABLE_RESERVATIONS`, `ENABLE_AUTOMATION`
- **UI Behavior**: Disabled features automatically hide all related buttons, tabs, and forms
- **Multi-Level Control**: Combines with user permissions (e.g., Reservations requires both flag + permission)
- **API Endpoint**: `GET /api/feature-flags` returns current flag status
- **Frontend Caching**: 5-minute cache for performance optimization
- **Use Cases**: Gradual feature rollout, maintenance mode, customer-specific deployments
- **Documentation**: See [docs/feature-flags.md](docs/feature-flags.md) for complete details

**Starting backend with feature flags**:
```bash
cd backend-nestjs
ENABLE_OAUTH=false ENABLE_CALENDAR_SYNC=false ENABLE_RESERVATIONS=true ENABLE_AUTOMATION=true PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

## API Integration

### Backend Endpoints
- `/api/feature-flags` - Public endpoint for feature flag status
- `/api/users/profile` - User profile management
- `/api/events` - CRUD operations for events
- `/api/calendar-sync` - External calendar integration
- `/api/auth` - Authentication and authorization
- `/api/admin/users/:id/usage-plans` - Admin-only usage plan modification (PATCH)
- `/api/admin/users` - Admin user management with usage plans display
- `/api/automation/rules` - Automation rule CRUD operations
- `/api/automation/rules/:id/execute` - Retroactive rule execution
- `/api/automation/rules/:id/audit-logs` - Execution history
- `/api/automation/audit-logs/:logId` - Detailed audit log
- `/api/automation/rules/:id/stats` - Execution statistics

### Error Handling
- Frontend: Comprehensive try-catch with user feedback
- Backend: HTTP status codes with descriptive messages
- Browser Extensions: Robust error suppression system

## Testing Strategy

### Frontend Testing
```bash
cd frontend && npm test
```

### Backend Testing
```bash
cd backend-nestjs && npm run test
```

### Type Checking
```bash
cd frontend && npm run typecheck
cd backend-nestjs && npm run lint
```

## Deployment Considerations

### Environment Variables
- Backend `.env` file contains sensitive data (excluded from git)
- Frontend environment variables for API endpoints
- Database connection strings and JWT secrets

### Build Process
```bash
# Frontend production build
cd frontend && npm run build

# Backend production build
cd backend-nestjs && npm run build
```

## Troubleshooting Guide

### Common Issues

1. **Extension Context Errors**
   - These are browser extension interactions
   - Already handled in CalendarSync.tsx with error suppression
   - User-friendly notification explains they're harmless

2. **Duplicate React Keys**
   - Check timezone/color arrays for duplicate values
   - Ensure unique keys in map operations

3. **Database Connection**
   - Verify PostgreSQL/SQLite configuration
   - Check environment variables
   - Run migrations if needed

4. **HMR Issues**
   - Restart development servers
   - Clear browser cache
   - Check for syntax errors

### Performance Optimization
- Lazy loading for large calendar views
- Memoization for expensive calculations
- Debounced event handlers for user input

## Code Quality Standards

### TypeScript Usage
- Strict type checking enabled
- Interface definitions for all data structures
- Proper error typing and handling

### Component Architecture
- Functional components with hooks
- Props drilling with TypeScript interfaces
- Separation of concerns (UI vs logic)

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

## Future Development Areas

### Potential Enhancements
1. **Real-time Collaboration** - WebSocket integration for shared calendars
2. **Mobile App** - React Native implementation
3. **Advanced Recurring Events** - Complex recurrence patterns
4. **Calendar Templates** - Pre-configured calendar setups
5. **Integration APIs** - Slack, Teams, Zoom meeting links
6. **Analytics Dashboard** - User activity and calendar insights

### Technical Debt
- Consider state management library for complex state
- Implement comprehensive test coverage
- Add performance monitoring
- Enhance error boundary implementation

## Security Considerations
- JWT token management and refresh
- Input validation and sanitization
- CORS configuration for production
- Rate limiting for API endpoints
- Secure calendar sync token storage

## File Security Guidelines
**⚠️ NEVER COMMIT THESE FILES TO GIT:**
- `.env` files (contain sensitive database credentials and OAuth secrets)
- `settings.local.json` files (contain local development settings)
- MCP-related files (model context protocol configuration files)
- Any files containing API keys, passwords, or access tokens

These files should always be added to `.gitignore` to prevent accidental exposure of sensitive information.

---

## Quick Reference

### Important File Paths
```
backend-nestjs/
├── src/entities/           # Database models
│   ├── automation-rule.entity.ts
│   ├── automation-condition.entity.ts
│   ├── automation-action.entity.ts
│   └── automation-audit-log.entity.ts
├── src/automation/        # Automation system
│   ├── automation.controller.ts
│   ├── automation.service.ts
│   ├── automation-evaluator.service.ts
│   ├── automation-scheduler.service.ts
│   ├── automation-audit.service.ts
│   ├── dto/
│   │   ├── automation-rule.dto.ts
│   │   └── automation-audit-log.dto.ts
│   └── executors/
│       ├── action-executor.interface.ts
│       ├── action-executor-registry.ts
│       └── set-event-color.executor.ts
├── src/common/            # Common utilities
│   ├── feature-flags.service.ts      # Feature flag service
│   └── feature-flags.controller.ts   # Feature flag API
├── src/controllers/        # API endpoints
├── src/services/          # Business logic
└── src/dto/               # Data transfer objects

frontend/src/
├── components/            # React components
│   └── automation/        # Automation components
├── services/             # API integration
│   ├── automationService.ts
│   └── featureFlagsService.ts         # Feature flags client
├── types/                # TypeScript definitions
│   └── Automation.ts
└── hooks/                # Custom React hooks
    ├── useAutomationRules.ts
    ├── useAutomationMetadata.ts
    ├── useAuditLogs.ts
    └── useFeatureFlags.ts               # Feature flags hook
```

### Version Management
**⚠️ CRITICAL: Version Increment Before Every Git Push**

Before every git push, you MUST increment the bugfix version number by 1.

**Version Format**: `MAJOR.MINOR.PATCH` (e.g., 1.3.0 → 1.3.1)

**Files to Update**:
1. **backend-nestjs/package.json** - Update `version` field
2. **frontend/package.json** - Update `version` field

**Process**:
```bash
# 1. Increment bugfix version (PATCH number)
# Example: 1.3.0 → 1.3.1, 1.3.1 → 1.3.2, etc.

# 2. Update backend-nestjs/package.json
cd backend-nestjs
npm version patch --no-git-tag-version

# 3. Update frontend/package.json
cd ../frontend
npm version patch --no-git-tag-version

# 4. Commit version changes
cd ..
git add backend-nestjs/package.json frontend/package.json
git commit -m "chore: bump version to X.X.X"

# 5. Now safe to push
git push
```

**When to Increment**:
- ✅ **ALWAYS** before `git push`
- ✅ After bug fixes
- ✅ After feature additions
- ✅ After documentation updates
- ✅ For any commit that will be pushed

**Version Types**:
- **PATCH (bugfix)** - Increment for bug fixes, small changes, documentation (default for every push)
- **MINOR** - Increment for new features (e.g., 1.3.9 → 1.4.0)
- **MAJOR** - Increment for breaking changes (e.g., 1.9.0 → 2.0.0)

### Development Workflow
1. Check current feature status in this file
2. Run development servers (frontend:8080, backend:8081)
3. Make changes with hot reload
4. Test functionality thoroughly
5. Run type checking and linting
6. **Increment bugfix version** (see Version Management above)
7. Commit changes with descriptive messages
8. Update this CLAUDE.md file if needed

### Emergency Commands
```bash
# Find and kill specific process by port (NEVER kill all node.exe!)
netstat -ano | findstr :8080    # Find frontend process
netstat -ano | findstr :8081    # Find backend process
taskkill /f /pid <PID>          # Kill by specific PID only

# Reset development environment
npm install
rm -rf node_modules package-lock.json
npm install

# Database operations (connects to 192.168.1.101:5433)
cd backend-nestjs && npm run seed                    # Seed data
cd backend-nestjs && npm run typeorm migration:run   # Run migrations
cd backend-nestjs && npm run typeorm migration:revert # Revert last migration
```

This guide should help future AI sessions understand the current state and continue development effectively.

## Documentation Status

### 📚 Current Documentation
All primary documentation has been updated to reflect the current application state:
- **README.md** - Comprehensive project overview with latest features including automation system
- **API_DOCUMENTATION.md** - Complete API reference with all endpoints including automation
- **docs/automation.md** - Comprehensive automation system documentation (1700+ lines)
- **docs/feature-flags.md** - Complete feature flags system documentation with examples and best practices
- **DEPLOYMENT.md** - Full deployment guide covering multiple platforms and configurations
- **setup-guide.md** - Complete setup instructions from initial installation to running application
- **frontend/README.md** - Detailed frontend architecture and development guide
- **backend-nestjs/README.md** - Complete backend documentation and API development guide
- **CLAUDE.md** - This development guide with latest features and patterns

### ⚠️ Legacy Documentation Files
These files exist but are outdated and should not be used for current development:
- **REACT-DEPLOYMENT.md** - Old deployment guide (replaced by DEPLOYMENT.md)
- **SSO.md** - Legacy SSO setup (integrated into setup-guide.md)
- **Google Sync.md** - Outdated sync documentation (covered in API_DOCUMENTATION.md)
- **RESERVATION_SYSTEM_PLAN.md** - Planning document (features now implemented)

### 📝 Documentation Maintenance
All current documentation reflects:
- **Feature flags system** - Global feature control with UI hiding
- **Calendar automation system** (Phase 8 complete - Production ready)
- Hour format settings integration across components
- Latest 16-color theming system
- Updated API endpoints and authentication
- Modern deployment practices
- Current development workflow and patterns

## Automation System Overview

The automation system is a complete rule-based automation platform integrated into Cal3:

### Key Features
- **7 Trigger Types**: event.created, event.updated, event.deleted, event.starts_in, event.ends_in, calendar.imported, scheduled.time
- **11 Event Fields**: title, description, location, notes, duration, is_all_day, color, status, calendar.id, calendar.name, computed duration
- **15+ Operators**: String (contains, equals, matches regex, etc.), Numeric (>, <, >=, <=), Boolean (is_true, is_false), Array (in, not_in)
- **Boolean Logic**: AND/OR at rule level, NOT at condition level
- **Action System**: Plugin architecture with self-registration (V1: set_event_color)
- **Audit Logging**: Circular buffer (1000 entries per rule) with detailed execution traces
- **Retroactive Execution**: "Run Now" feature with rate limiting
- **User Scoping**: Complete isolation between users

### Architecture
- **Backend**: 8 services (automation, evaluator, scheduler, audit, 4 executors)
- **Frontend**: 14 components (panel, modal, builders, dialogs, audit viewer)
- **Database**: 4 tables (rules, conditions, actions, audit_logs) with 9 indexes
- **Integration**: Hooks in EventsService, CalendarSyncService, @Cron scheduler

### Development Notes
- **Adding New Triggers**: Update TriggerType enum, add to AutomationSchedulerService
- **Adding New Operators**: Update ConditionOperator enum, add to AutomationEvaluatorService
- **Adding New Actions**: Create executor implementing IActionExecutor, add to AutomationModule providers
- **Testing**: All CRUD endpoints tested, automation tab accessible at Dashboard → 🤖 Automation

For complete details, see [docs/automation.md](docs/automation.md)