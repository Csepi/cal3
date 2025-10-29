# PrimeCal Frontend - React TypeScript Calendar Application

## Overview
The PrimeCal frontend is a modern React 18 application built with TypeScript and Vite, providing a comprehensive calendar and reservation management interface. It features a modular architecture with clean separation of concerns and enterprise-grade theming system.

## Technology Stack
- **React 18** - Modern functional components with hooks
- **TypeScript** - Strict type safety and better developer experience
- **Vite** - Fast development server with HMR
- **Tailwind CSS** - Utility-first CSS framework with custom theming
- **Date/Time Libraries** - Native JavaScript Date with timezone support

## Architecture

### Component Structure
```
src/components/
 Calendar.tsx              # Main calendar wrapper component
 Dashboard.tsx             # Primary application layout and navigation
 UserProfile.tsx           # User settings and preferences
 AdminPanel.tsx            # Administrative interface
 CalendarSidebar.tsx       # Calendar navigation and management
 auth/                     # Authentication components
    Login.tsx
 calendar/                 # Calendar-specific components
    EnhancedCalendar.tsx  # Advanced calendar with full functionality
    CalendarEventModal.tsx  # Event creation/editing modal
    CalendarManager.tsx   # Calendar CRUD operations
 views/                    # Calendar view components
    MonthView.tsx         # Monthly calendar grid
    WeekView.tsx          # Weekly calendar with time slots
 ui/                       # Reusable UI components
    Button.tsx
    Input.tsx
    Card.tsx
    SimpleModal.tsx
 sync/                     # External calendar integration
     CalendarSync.tsx
```

### Key Features

####  **Comprehensive Theming System**
- **16 Theme Colors**: Complete rainbow palette with consistent styling
- **Dynamic Gradients**: Backdrop-blur effects and modern glass morphism
- **Color Options**: Red, Orange, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Pink, Rose, Slate
- **Responsive Design**: Mobile-first approach with touch-friendly interactions

####  **Calendar Management**
- **Multiple Views**: Month, Week, and Day views with seamless navigation
- **Event Management**: Drag-and-drop event creation, editing, and deletion
- **Recurring Events**: Support for daily, weekly, and monthly patterns
- **All-Day Events**: Full support for multi-day events
- **Color Coding**: Visual organization with 16 available theme colors

####  **Time Format Integration**
- **User Preferences**: 12-hour (AM/PM) and 24-hour format support
- **Component Integration**: Format settings applied to WeekView and CalendarEventModal
- **Real-time Updates**: Immediate reflection of format changes across all views
- **Default Handling**: Graceful fallback to 12-hour format when preference unavailable

####  **Timezone Support**
- **Global Coverage**: 70+ world timezones across all continents
- **Regional Groups**: Americas (16), Europe/Africa (22), Asia (18), Australia/Pacific (14)
- **User Preferences**: Personal timezone settings with automatic date/time conversion
- **IANA Standard**: Proper timezone handling using IANA timezone identifiers

####  **User Management**
- **Profile Customization**: Theme colors, timezone, time format, and personal information
- **Usage Plans**: Visual display of user permissions (Child, User, Store, Enterprise)
- **Account Security**: Password management and secure authentication
- **Admin Controls**: Role-based access control with admin panel

####  **External Integrations**
- **Calendar Sync**: Google Calendar and Microsoft Outlook integration
- **OAuth Authentication**: Secure connection to external calendar providers
- **Sync Status**: Real-time monitoring of synchronization status
- **Error Handling**: Robust error management with user-friendly notifications

### Development Setup

#### Prerequisites
- Node.js 18+ and npm
- Access to PrimeCal backend API (running on port 8081)

#### Installation & Running
```bash
# Install dependencies
npm install

# Start development server (MUST use port 8080)
npm run dev -- --port 8080

# Build for production
npm run build

# Preview production build
npm run preview
```

#### ** CRITICAL PORT REQUIREMENT**
The frontend **MUST** run on port 8080. This is hardcoded in the application configuration and cannot be changed.

### Component Integration

#### Data Flow
```
Dashboard  Calendar  EnhancedCalendar  WeekView/MonthView
                           
UserProfile  Theme  CalendarEventModal
```

#### State Management
- **React Hooks**: useState and useEffect for local component state
- **Props Drilling**: TypeScript interfaces ensure type safety
- **Context**: Theme and user preferences passed through component hierarchy
- **Local Storage**: Persistent session management and user preferences

#### API Integration
```typescript
// Service layer handles all backend communication
import { apiService } from '../services/api';

// Example usage in components
const events = await apiService.getEvents();
const profile = await apiService.getUserProfile();
```

### Testing

#### Type Checking
```bash
npm run typecheck
```

#### Component Testing
```bash
npm run test
```

#### Build Verification
```bash
npm run build
```

### Code Quality Standards

#### TypeScript Usage
- **Strict Mode**: Enabled for enhanced type safety
- **Interface Definitions**: All props and data structures properly typed
- **Error Handling**: Comprehensive try-catch with user feedback
- **Type Guards**: Runtime type checking where necessary

#### Component Patterns
- **Functional Components**: Modern React hooks pattern
- **Props Interfaces**: Clear TypeScript interfaces for all components
- **Separation of Concerns**: UI logic separated from business logic
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

#### Styling Approach
- **Tailwind CSS**: Utility-first classes with dynamic theming
- **Responsive Design**: Mobile-first breakpoints
- **Consistent Spacing**: Standardized margin/padding throughout
- **Color System**: Dynamic theme colors with proper contrast ratios

### Performance Optimizations

#### Loading Strategies
- **Lazy Loading**: Large calendar views loaded on demand
- **Memoization**: Expensive calculations cached appropriately
- **Debounced Events**: User input handling optimized for performance
- **Virtual Scrolling**: Efficient rendering of large event lists

#### Bundle Optimization
- **Tree Shaking**: Unused code eliminated in production builds
- **Code Splitting**: Dynamic imports for route-based splitting
- **Asset Optimization**: Images and fonts properly optimized
- **Minification**: Production builds fully minified

### Browser Compatibility

#### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

#### Features Used
- **ES6+ Syntax**: Modern JavaScript features
- **CSS Grid/Flexbox**: Modern layout techniques
- **Fetch API**: Native HTTP requests
- **Local Storage**: Client-side data persistence

### Common Development Tasks

#### Adding New Theme Colors
1. Update `THEME_COLOR_OPTIONS` in `constants/theme.ts`
2. Add color mappings in `getThemeConfig()` function
3. Include gradient definitions and hover states
4. Test across all components for consistency

#### Creating New Components
1. Follow TypeScript interface patterns
2. Include proper props typing
3. Add theme color support via props
4. Implement accessibility features
5. Add to appropriate component category

#### Integrating New APIs
1. Add endpoint to `services/api.ts`
2. Create TypeScript interfaces for data
3. Implement error handling
4. Add loading states to UI
5. Update component state management

### Troubleshooting

#### Common Issues

**HMR Not Working**
- Restart development server
- Clear browser cache
- Check for syntax errors in TypeScript

**Theme Colors Not Applying**
- Verify color prop is passed correctly
- Check `getThemeConfig()` function
- Ensure Tailwind classes are properly generated

**API Connection Issues**
- Verify backend is running on port 8081
- Check authentication token in localStorage
- Review network tab for failed requests

**Type Errors**
- Run `npm run typecheck` for detailed errors
- Verify interface definitions match API responses
- Check for missing required props

#### Emergency Commands
```bash
# Clear all caches and reinstall
rm -rf node_modules package-lock.json
npm install

# Force rebuild
npm run build --force

# Reset local development
git clean -fdx
npm install
```

### File Organization

#### Import Structure
```typescript
// React imports first
import React, { useState, useEffect } from 'react';

// Third-party imports
import { format } from 'date-fns';

// Local imports
import { Button, Input } from '../ui';
import { apiService } from '../../services/api';
import type { Event } from '../../types/Event';
```

#### Component Template
```typescript
interface ComponentProps {
  themeColor: string;
  // other props...
}

export const Component: React.FC<ComponentProps> = ({
  themeColor,
  // other props...
}) => {
  const themeConfig = getThemeConfig(themeColor);

  return (
    <div className={`${themeConfig.gradient.background}`}>
      {/* component content */}
    </div>
  );
};
```

### Deployment Considerations

#### Environment Variables
- Development uses hardcoded localhost URLs
- Production requires environment-specific API endpoints
- Authentication tokens managed via localStorage

#### Build Process
```bash
# Production build
npm run build

# Output directory: dist/
# Serve with any static web server
```

#### Security
- No sensitive data in frontend code
- Authentication handled via secure JWT tokens
- API keys managed on backend only
- HTTPS required for production deployment

---

**Frontend Version**: 1.2.0
**Last Updated**: September 2025
**React Version**: 18.3.1
**TypeScript Version**: 5.2.2

