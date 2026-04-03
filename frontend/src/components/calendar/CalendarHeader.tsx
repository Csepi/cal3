/**
 * CalendarHeader component for calendar navigation and view controls
 *
 * This component provides a comprehensive header interface for calendar navigation,
 * including date navigation, view switching, and quick action buttons.
 * It replaces the header logic from the monolithic Calendar component.
 */

import React from 'react';
import { Button } from '../ui';
import { getThemeConfig } from '../../constants';
import { useAppTranslation } from '../../i18n/useAppTranslation';

import { tStatic } from '../../i18n';

export interface CalendarHeaderProps {
  /** Current date being displayed */
  currentDate: Date;
  /** Function to navigate to previous period */
  onPrevious: () => void;
  /** Function to navigate to next period */
  onNext: () => void;
  /** Function to navigate to today */
  onToday: () => void;
  /** Current view ('month' or 'week') */
  currentView: 'month' | 'week';
  /** Function to change view */
  onViewChange: (view: 'month' | 'week') => void;
  /** Function to create new event */
  onCreateEvent: () => void;
  /** Function to create new calendar */
  onCreateCalendar: () => void;
  /** Current theme color */
  themeColor: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Comprehensive calendar header with navigation and controls
 */
export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  currentView,
  onViewChange,
  onCreateEvent,
  onCreateCalendar,
  themeColor,
  loading = false
}) => {
  const { t, i18n } = useAppTranslation(['calendar', 'common']);
  const locale = i18n.resolvedLanguage || i18n.language || undefined;
  const themeConfig = getThemeConfig(themeColor);

  /**
   * Format the current date display based on view
   */
  const formatDateDisplay = (): string => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric'
      });
    } else {
      // Week view - show week range
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // If week spans across months/years
      if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
          year: startOfWeek.getFullYear() !== endOfWeek.getFullYear() ? 'numeric' : undefined
        })} - ${endOfWeek.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}`;
      } else {
        return `${startOfWeek.toLocaleDateString(locale, {
          month: 'long',
          year: 'numeric'
        })} (Week ${getWeekNumber(currentDate)})`;
      }
    }
  };

  /**
   * Get ISO week number
   */
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  /**
   * Get navigation period description
   */
  const getNavigationHint = (direction: 'prev' | 'next'): string => {
    if (currentView === 'month') {
      return direction === 'prev'
        ? t('navigation.goToPrevMonth', {
            ns: 'calendar',
            defaultValue: 'Go to previous month',
          })
        : t('navigation.goToNextMonth', {
            ns: 'calendar',
            defaultValue: 'Go to next month',
          });
    }

    return direction === 'prev'
      ? t('navigation.goToPrevWeek', {
          ns: 'calendar',
          defaultValue: 'Go to previous week',
        })
      : t('navigation.goToNextWeek', {
          ns: 'calendar',
          defaultValue: 'Go to next week',
        });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Left Section - Date Display and Navigation */}
        <div className="flex items-center space-x-4">
          {/* Date Display */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${themeConfig.gradientFrom} ${themeConfig.gradientTo} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">
                  {currentDate.getDate()}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatDateDisplay()}
              </h1>
              <p className="text-sm text-gray-500">
                {currentView === 'month'
                  ? t('views.monthlyView', {
                      ns: 'calendar',
                      defaultValue: 'Monthly Calendar View',
                    })
                  : t('views.weeklyView', {
                      ns: 'calendar',
                      defaultValue: 'Weekly Calendar View',
                    })}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 ml-8">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={loading}
              title={getNavigationHint('prev')}
              themeColor={themeColor}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            />

            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              disabled={loading}
              themeColor={themeColor}
            >
              {tStatic('common:auto.frontend.k24345a14377f')}</Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={loading}
              title={getNavigationHint('next')}
              themeColor={themeColor}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Right Section - View Controls and Actions */}
        <div className="flex items-center space-x-4">
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewChange('month')}
              disabled={loading}
              data-testid="calendar-view-month"
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${currentView === 'month'
                  ? `${themeConfig.bgColor} text-white shadow-sm`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }
              `}
              title={tStatic('common:auto.frontend.kc623169539f0')}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{tStatic('common:auto.frontend.k082bc378cd60')}</span>
              </div>
            </button>

            <button
              onClick={() => onViewChange('week')}
              disabled={loading}
              data-testid="calendar-view-week"
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${currentView === 'week'
                  ? `${themeConfig.bgColor} text-white shadow-sm`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }
              `}
              title={tStatic('common:auto.frontend.kf40f3fcd07be')}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{tStatic('common:auto.frontend.kf82be68a7fb4')}</span>
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="md"
              onClick={onCreateCalendar}
              disabled={loading}
              data-testid="calendar-open-create-calendar"
              themeColor={themeColor}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              <span className="hidden sm:inline">{tStatic('common:auto.frontend.kfe0b9a9de658')}</span>
              <span className="sm:hidden">{tStatic('common:auto.frontend.kadab5090ac6a')}</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onCreateEvent}
              disabled={loading}
              data-testid="calendar-open-create-event"
              themeColor={themeColor}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              <span className="hidden sm:inline">{tStatic('common:auto.frontend.k6396b65c4ecf')}</span>
              <span className="sm:hidden">{tStatic('common:auto.frontend.kad8919ace091')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Info Bar */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {tStatic('common:auto.frontend.k80862a89e60d')}{currentView} {tStatic('common:auto.frontend.ke4ffacba5591')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${themeConfig.gradientFrom} ${themeConfig.gradientTo}`}></div>
              <span>{tStatic('common:auto.frontend.k6c9245a33ae8')}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs">
            <span>{tStatic('common:auto.frontend.k8cde830ef5fb')}</span>
            <span>•</span>
            <span>{tStatic('common:auto.frontend.kcfb024aafef5')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
