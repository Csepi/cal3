/**
 * MobileCalendarHeader - Mobile Navigation Header
 *
 * Compact header for mobile calendar view
 * Features:
 * - Month/Year display
 * - View switcher (Month/Week)
 * - Navigation arrows
 * - Calendar selector button
 * - Today button
 */

import React from 'react';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface MobileCalendarHeaderProps {
  currentDate: Date;
  currentView: 'month' | 'week' | 'timeline';
  onViewChange: (view: 'month' | 'week' | 'timeline') => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onOpenCalendarSelector: () => void;
  themeColor: string;
}

export const MobileCalendarHeader: React.FC<MobileCalendarHeaderProps> = ({
  currentDate,
  currentView,
  onViewChange,
  onNavigate,
  onOpenCalendarSelector,
  themeColor,
}) => {
  const formatMonthYear = (): string => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatWeekRange = (): string => {
    // Get week start (Monday)
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    // Get week end (Sunday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const formatFocusDay = (): string => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const resolvedTitle =
    currentView === 'month'
      ? formatMonthYear()
      : currentView === 'week'
        ? formatWeekRange()
        : formatFocusDay();

  return (
    <div className="bg-white border-b border-gray-200 safe-area-top">
      {/* Top Row: Navigation & Title */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Calendar Selector Button */}
        <TouchableArea
          onClick={onOpenCalendarSelector}
          className="flex items-center gap-2"
          minSize="lg"
        >
          <Icon icon="📅" size="md" />
          <Icon icon="▼" size="sm" className="text-gray-500" />
        </TouchableArea>

        {/* Date Display */}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {resolvedTitle}
          </h2>
        </div>

        {/* Today Button */}
        <TouchableArea
          onClick={() => onNavigate('today')}
          className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium"
          minSize="sm"
        >
          Today
        </TouchableArea>
      </div>

      {/* Bottom Row: View Switcher & Navigation */}
      <div className="flex items-center justify-between px-4 pb-3">
        {/* View Switcher */}
        <div className="flex rounded-lg bg-gray-100 p-1 overflow-x-auto">
          <TouchableArea
            onClick={() => onViewChange('month')}
            className={`
              px-3 py-1 rounded-md text-sm font-medium transition-all
              ${currentView === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
              }
            `}
            minSize="sm"
          >
            Month
          </TouchableArea>
          <TouchableArea
            onClick={() => onViewChange('week')}
            className={`
              px-3 py-1 rounded-md text-sm font-medium transition-all
              ${currentView === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
              }
            `}
            minSize="sm"
          >
            Week
          </TouchableArea>
          <TouchableArea
            onClick={() => onViewChange('timeline')}
            className={`
              px-3 py-1 rounded-md text-sm font-medium transition-all
              ${currentView === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
              }
            `}
            minSize="sm"
          >
            Timeline
          </TouchableArea>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <TouchableArea
            onClick={() => onNavigate('prev')}
            className="p-2 rounded-full hover:bg-gray-100"
            minSize="lg"
            ariaLabel="Previous"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </TouchableArea>

          <TouchableArea
            onClick={() => onNavigate('next')}
            className="p-2 rounded-full hover:bg-gray-100"
            minSize="lg"
            ariaLabel="Next"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </TouchableArea>
        </div>
      </div>
    </div>
  );
};
