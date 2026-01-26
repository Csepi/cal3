/**
 * MobileWeekView - Mobile-Optimized Week View
 *
 * Touch-friendly week view for mobile devices
 * Features:
 * - Scrollable time slots
 * - Touch-optimized event cards
 * - Swipe between days
 * - Tap time slots to create events
 * - Current time indicator
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Event } from '../../../types/Event';
import { getMeetingLinkFromEvent } from '../../../utils/meetingLinks';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface MobileWeekViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  themeColor: string;
  timeFormat: '12' | '24';
}

export const MobileWeekView: React.FC<MobileWeekViewProps> = ({
  currentDate,
  events,
  selectedDate,
  onDateClick,
  onEventClick,
  onTimeSlotClick,
  themeColor,
  timeFormat,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToCurrentTime = useRef(false);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount (once)
  useEffect(() => {
    if (!hasScrolledToCurrentTime.current && scrollRef.current) {
      const currentHour = new Date().getHours();
      const targetScroll = Math.max(0, currentHour - 2) * 60; // 60px per hour, show 2 hours before
      scrollRef.current.scrollTop = targetScroll;
      hasScrolledToCurrentTime.current = true;
    }
  }, []);

  // Get week days starting from current date's week
  const getWeekDays = (): Date[] => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    start.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Format time for display
  const formatTime = (hour: number): string => {
    if (timeFormat === '12') {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour} ${period}`;
    }
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Get events for a specific day and hour
  const getEventsForTimeSlot = (date: Date, hour: number): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if event overlaps with this time slot
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Calculate current time position (in pixels from top)
  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours * 60 + minutes; // 60px per hour + proportional minutes
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Day Headers - Horizontal Scroll */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20">
        {/* Time column placeholder */}
        <div className="w-12 shrink-0 border-r border-gray-200" />

        {/* Days */}
        <div className="flex flex-1 overflow-x-auto">
          {weekDays.map((day, index) => (
            <TouchableArea
              key={index}
              onClick={() => onDateClick(day)}
              className={`
                flex-1 min-w-[50px] py-2 border-r border-gray-200
                ${isToday(day) ? 'bg-blue-50' : ''}
                ${isSelected(day) ? 'bg-gray-100' : ''}
              `}
              minSize="sm"
            >
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`
                    text-lg font-semibold mt-1
                    ${isToday(day) ? 'text-blue-600' : 'text-gray-800'}
                  `}
                >
                  {day.getDate()}
                </div>
              </div>
            </TouchableArea>
          ))}
        </div>
      </div>

      {/* Time Slots - Vertical Scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {/* Current Time Indicator */}
        {isToday(weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]) && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{
              top: `${getCurrentTimePosition()}px`,
            }}
          >
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full -ml-1"
                style={{ backgroundColor: themeColor }}
              />
              <div
                className="flex-1 h-0.5"
                style={{ backgroundColor: themeColor }}
              />
            </div>
          </div>
        )}

        {/* Time Grid */}
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="flex" style={{ height: '60px' }}>
            {/* Time Label */}
            <div className="w-12 shrink-0 border-r border-gray-200 pr-1 pt-1 text-right">
              <span className="text-xs text-gray-500">{formatTime(hour)}</span>
            </div>

            {/* Day Columns */}
            <div className="flex flex-1">
              {weekDays.map((day, dayIndex) => {
                const slotEvents = getEventsForTimeSlot(day, hour);

                return (
                  <TouchableArea
                    key={dayIndex}
                    onClick={() => onTimeSlotClick(day, hour)}
                    className="flex-1 min-w-[50px] border-r border-b border-gray-100 relative"
                    minSize="sm"
                  >
                    {/* Events in this slot */}
                    {slotEvents.map((event, eventIndex) => {
                      const eventStart = new Date(event.startDate);
                      const eventEnd = new Date(event.endDate);
                      const slotStart = new Date(day);
                      slotStart.setHours(hour, 0, 0, 0);
                      const meetingLink = getMeetingLinkFromEvent(event);

                      // Calculate position within the hour slot
                      const startMinute = eventStart.getHours() === hour ? eventStart.getMinutes() : 0;
                      const endMinute = eventEnd.getHours() === hour ? eventEnd.getMinutes() : 60;
                      const duration = endMinute - startMinute;
                      const topOffset = (startMinute / 60) * 60; // 60px per hour
                      const height = (duration / 60) * 60;

                      return (
                        <div
                          key={eventIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className="absolute left-0 right-0 px-1 cursor-pointer relative"
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 20)}px`,
                            backgroundColor: event.color || event.calendar?.color || themeColor,
                            opacity: 0.9,
                          }}
                        >
                          <div className="text-white text-xs font-medium truncate">
                            {event.title}
                          </div>
                          {height > 30 && (
                            <div className="text-white text-xs opacity-75 truncate">
                              {formatTime(eventStart.getHours())}
                            </div>
                          )}
                          {meetingLink && (
                            <button
                              type="button"
                              className="absolute bottom-0.5 right-1 inline-flex items-center rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(meetingLink, '_blank', 'noopener,noreferrer');
                              }}
                              aria-label={`Join ${event.title} meeting`}
                            >
                              Join
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </TouchableArea>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
