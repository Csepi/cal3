/**
 * Calendar Header Component
 *
 * Navigation and view controls for the calendar
 */

import { memo, useCallback, useMemo } from 'react';
import type { CalendarHeaderProps } from '../types';
import { formatDate } from '../../../utils/calendar';

import { tStatic } from '../../../i18n';

export const CalendarHeader = memo<CalendarHeaderProps>(({
  currentDate,
  view,
  interactions,
  showNavigation = true,
  showViewSwitcher = true,
  showToday = true,
  customActions,
  className = '',
  style,
  'data-testid': testId
}) => {
  // Navigation handlers
  const handlePrevious = useCallback(() => {
    interactions?.onNavigate?.(currentDate, 'previous');
  }, [interactions, currentDate]);

  const handleNext = useCallback(() => {
    interactions?.onNavigate?.(currentDate, 'next');
  }, [interactions, currentDate]);

  const handleToday = useCallback(() => {
    interactions?.onNavigate?.(currentDate, 'today');
  }, [interactions, currentDate]);

  // View change handlers
  const handleViewChange = useCallback((newView: 'month' | 'week' | 'day') => {
    interactions?.onViewChange?.(newView);
  }, [interactions]);

  // Action handlers
  const handleCreateEvent = useCallback(() => {
    interactions?.onCreateEvent?.();
  }, [interactions]);

  const handleCreateCalendar = useCallback(() => {
    interactions?.onCreateCalendar?.();
  }, [interactions]);

  // Format title based on view
  const title = useMemo(() => {
    switch (view) {
      case 'month':
        return formatDate(currentDate, { month: 'long', year: 'numeric' });
      case 'week': {
        // For week view, show the week range
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday

        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${formatDate(weekStart, { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${formatDate(weekStart, { month: 'short', day: 'numeric' })} - ${formatDate(weekEnd, { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
        }
      }
      case 'day':
        return formatDate(currentDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return formatDate(currentDate, { month: 'long', year: 'numeric' });
    }
  }, [currentDate, view]);

  // Button base classes
  const buttonBaseClasses = 'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Navigation button classes
  const navButtonClasses = `${buttonBaseClasses} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500`;

  // View button classes
  const viewButtonClasses = (isActive: boolean) =>
    `${buttonBaseClasses} ${
      isActive
        ? `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
        : `text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500`
    }`;

  // Today button classes
  const todayButtonClasses = `${buttonBaseClasses} text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 focus:ring-blue-500`;

  // Action button classes
  const actionButtonClasses = `${buttonBaseClasses} text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 focus:ring-blue-500`;

  return (
    <div
      className={`calendar-header flex items-center justify-between p-4 bg-white border-b border-gray-200 ${className}`}
      style={style}
      data-testid={testId}
    >
      {/* Left section: Navigation */}
      <div className="flex items-center space-x-4">
        {showNavigation && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevious}
              className={navButtonClasses}
              aria-label={tStatic('common:auto.frontend.k0aab6a575e14')}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className={navButtonClasses}
              aria-label={tStatic('common:auto.frontend.k0630852d72f5')}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {showToday && (
          <button
            onClick={handleToday}
            className={todayButtonClasses}
            type="button"
          >
            {tStatic('common:auto.frontend.k24345a14377f')}</button>
        )}

        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-900 ml-4">
          {title}
        </h1>
      </div>

      {/* Right section: Action buttons, view switcher and custom actions */}
      <div className="flex items-center space-x-4">
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {interactions?.onCreateEvent && (
            <button
              onClick={handleCreateEvent}
              className={actionButtonClasses}
              type="button"
              aria-label={tStatic('common:auto.frontend.k44cf8342ddd4')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">{tStatic('common:auto.frontend.k6396b65c4ecf')}</span>
              <span className="sm:hidden">{tStatic('common:auto.frontend.kad8919ace091')}</span>
            </button>
          )}

          {interactions?.onCreateCalendar && (
            <button
              onClick={handleCreateCalendar}
              className={`${buttonBaseClasses} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500`}
              type="button"
              aria-label={tStatic('common:auto.frontend.k66ec06fd1b14')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{tStatic('common:auto.frontend.kfe0b9a9de658')}</span>
              <span className="sm:hidden">{tStatic('common:auto.frontend.kadab5090ac6a')}</span>
            </button>
          )}
        </div>

        {showViewSwitcher && (
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => handleViewChange('month')}
              className={`${viewButtonClasses(view === 'month')} border-0 rounded-none first:rounded-l-md`}
              type="button"
            >
              {tStatic('common:auto.frontend.k082bc378cd60')}</button>
            <button
              onClick={() => handleViewChange('week')}
              className={`${viewButtonClasses(view === 'week')} border-0 border-l border-gray-300 rounded-none`}
              type="button"
            >
              {tStatic('common:auto.frontend.kf82be68a7fb4')}</button>
            <button
              onClick={() => handleViewChange('day')}
              className={`${viewButtonClasses(view === 'day')} border-0 border-l border-gray-300 rounded-none last:rounded-r-md`}
              type="button"
            >
              {tStatic('common:auto.frontend.k987b9ced08d4')}</button>
          </div>
        )}

        {/* Custom actions */}
        {customActions && (
          <div className="flex items-center space-x-2">
            {customActions}
          </div>
        )}
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';
