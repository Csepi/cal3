/**
 * Main Calendar Component
 *
 * Serves as the primary interface for the calendar application.
 * Now utilizes the EnhancedCalendar component for improved performance,
 * accessibility, and theme integration following full-stack best practices.
 */

import React from 'react';
import { EnhancedCalendar } from './calendar/EnhancedCalendar';

interface CalendarProps {
  /** Current theme color */
  themeColor: string;
  /** Time format preference (12h/24h) */
  timeFormat?: string;
  /** Optional timezone identifier (e.g. 'Europe/Budapest') */
  timezone?: string;
}

/**
 * Main Calendar Component utilizing the enterprise-grade EnhancedCalendar
 *
 * Features:
 * - Clean Architecture with separation of concerns
 * - Comprehensive error handling and loading states
 * - Optimized performance with React best practices
 * - Full theme integration with chosen user colors
 * - Accessible and mobile-responsive design
 * - Type-safe with comprehensive TypeScript coverage
 * - Modular and maintainable code structure
 */
const Calendar: React.FC<CalendarProps> = ({ themeColor, timeFormat = '12h', timezone }) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <EnhancedCalendar
        themeColor={themeColor}
        timeFormat={timeFormat}
        timezone={timezone}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
};

export default Calendar;
