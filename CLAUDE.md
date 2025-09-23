# Claude Code Development Guide for Cal3 Calendar Application

## Project Overview
Cal3 is a modern full-stack calendar application built with NestJS backend and React TypeScript frontend. It features calendar sync, user profiles, timezone support, and comprehensive event management.

## Architecture
- **Backend**: NestJS + TypeORM + PostgreSQL/SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Development**: Hot reload enabled on both frontend (port 8080) and backend (port 8081)

## Quick Start Commands
```bash
# Frontend development server - MUST USE PORT 8080
cd frontend && npm run dev -- --port 8080

# Backend development server - MUST USE PORT 8081
cd backend-nestjs && PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

# Database operations
cd backend-nestjs && npm run seed
```

## CRITICAL PORT REQUIREMENTS
**⚠️ MANDATORY PORT CONFIGURATION:**
- **Frontend**: ALWAYS use port 8080 (never use any other port)
- **Backend**: ALWAYS use port 8081 (never use any other port)
- These ports are hardcoded in the application configuration and MUST NOT be changed

## Current Development Status

### ✅ Recently Completed Features
1. **Admin Usage Plan Management** - Individual and bulk modification of user usage plans with set/add/remove operations
2. **Expanded Color Palette** - 16 total theme colors in rainbow order including Sky (#0ea5e9) and Violet (#7c3aed)
3. **Usage Plans Read-Only Display** - User profile shows usage plans as non-editable badges in Account Information
4. **Comprehensive Timezone Support** - 70+ world timezones covering all continents
5. **Week View Time Range Selection** - Mouse drag functionality for creating events
6. **Profile Color Theming** - Applied to monthly and weekly view backgrounds with consistent gradients
7. **Modernized UI** - Softer gradients, backdrop-blur effects, improved readability
8. **Browser Extension Error Handling** - Robust suppression of extension context errors

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
└── Dashboard.tsx         # Main dashboard layout
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
- Custom hooks for reusable logic (useCalendarSettings)
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

### Usage Plans Management
Usage plans control feature access and are managed by admins:
- **Available Plans**: Child, User, Store, Enterprise
- **Admin Controls**: Individual user modification via modal
- **Bulk Operations**: Set (replace), Add (append), Remove (subtract)
- **User Display**: Read-only badges in Account Information section
- **Backend**: Stored as JSON array in user entity (`usagePlans` field)

## API Integration

### Backend Endpoints
- `/api/users/profile` - User profile management
- `/api/events` - CRUD operations for events
- `/api/calendar-sync` - External calendar integration
- `/api/auth` - Authentication and authorization
- `/api/admin/users/:id/usage-plans` - Admin-only usage plan modification (PATCH)
- `/api/admin/users` - Admin user management with usage plans display

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
├── src/controllers/        # API endpoints
├── src/services/          # Business logic
└── src/dto/               # Data transfer objects

frontend/src/
├── components/            # React components
├── services/             # API integration
├── types/                # TypeScript definitions
└── hooks/                # Custom React hooks
```

### Development Workflow
1. Check current feature status in this file
2. Run development servers (frontend:8080, backend:8081)
3. Make changes with hot reload
4. Test functionality thoroughly
5. Run type checking and linting
6. Commit changes with descriptive messages
7. Update this CLAUDE.md file if needed

### Emergency Commands
```bash
# Kill all node processes if stuck
tasklist | findstr node
taskkill /f /im node.exe

# Reset development environment
npm install
rm -rf node_modules package-lock.json
npm install

# Database reset
cd backend-nestjs && npm run migration:drop && npm run migration:run
```

This guide should help future AI sessions understand the current state and continue development effectively.