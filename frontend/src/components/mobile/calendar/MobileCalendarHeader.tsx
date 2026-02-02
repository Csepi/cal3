// @ts-nocheck
/**
 * MobileCalendarHeader - Mobile Navigation Header
 *
 * Compact header for mobile calendar view
 * Features:
 * - Timeline-first view switcher
 * - Navigation arrows
 * - Calendar selector button
 * - Today shortcut
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

const withAlpha = (color: string, alpha: number) => {
  if (!color.startsWith('#')) return color;
  const hex = color.replace('#', '');
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

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
      day: 'numeric',
    });
  };

  const resolvedTitle =
    currentView === 'month'
      ? formatMonthYear()
      : currentView === 'week'
        ? formatWeekRange()
        : formatFocusDay();

  const viewOptions: Array<{ id: 'month' | 'week' | 'timeline'; label: string }> = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  return (
    <div className="bg-white/95 border-b border-gray-100 safe-area-top backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2.5">
        <TouchableArea
          onClick={onOpenCalendarSelector}
          className="flex items-center"
          minSize="lg"
        >
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
            style={{
              borderColor: withAlpha(themeColor, 0.2),
              backgroundColor: withAlpha(themeColor, 0.06),
            }}
          >
            <Icon
              icon={(
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                  <path d="M8 3v4" />
                  <path d="M16 3v4" />
                  <path d="M3.5 11h17" />
                </svg>
              )}
              size="sm"
            />
            <span>Calendars</span>
            <Icon icon="▼" size="xs" className="text-gray-500" />
          </div>
        </TouchableArea>

        <div className="flex-1 text-center px-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold">
            {currentView === 'timeline' ? 'Today timeline' : currentView === 'week' ? 'This week' : 'This month'}
          </p>
          <h2
            className="text-lg font-bold leading-tight"
            style={{ color: themeColor }}
          >
            {resolvedTitle}
          </h2>
        </div>

        <TouchableArea
          onClick={() => onNavigate('today')}
          className="px-3 py-2 rounded-xl bg-gray-50 text-gray-800 text-sm font-semibold shadow-sm border border-gray-200"
          minSize="sm"
        >
          Today
        </TouchableArea>
      </div>

      <div className="flex items-center justify-between px-4 pb-3 gap-3">
        <div className="flex flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-1 overflow-x-auto">
          {viewOptions.map((option) => {
            const isActive = currentView === option.id;
            return (
              <TouchableArea
                key={option.id}
                onClick={() => onViewChange(option.id)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'shadow-sm' : 'text-gray-600'
                }`}
                minSize="sm"
                ariaLabel={`Switch to ${option.label} view`}
                style={{
                  backgroundColor: isActive ? withAlpha(themeColor, 0.12) : 'transparent',
                  color: isActive ? themeColor : undefined,
                  border: isActive ? `1px solid ${withAlpha(themeColor, 0.2)}` : '1px solid transparent',
                }}
              >
                {option.label}
              </TouchableArea>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <TouchableArea
            onClick={() => onNavigate('prev')}
            className="p-2 rounded-xl bg-white shadow-sm border border-gray-200"
            minSize="lg"
            ariaLabel="Previous"
          >
            <svg
              className="w-5 h-5 text-gray-700"
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
            className="p-2 rounded-xl bg-white shadow-sm border border-gray-200"
            minSize="lg"
            ariaLabel="Next"
          >
            <svg
              className="w-5 h-5 text-gray-700"
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

