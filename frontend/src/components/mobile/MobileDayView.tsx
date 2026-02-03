import React, { useState, useEffect } from 'react';
import type { Event } from '../../types/Event';
import { getMeetingLinkFromEvent } from '../../utils/meetingLinks';

interface MobileDayViewProps {
  date: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeSlotClick?: (hour: number) => void;
  themeColor: string;
  timeFormat?: string;
}

export const MobileDayView: React.FC<MobileDayViewProps> = ({
  date,
  events,
  onEventClick,
  onTimeSlotClick,
  themeColor,
  timeFormat = '12',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number): string => {
    if (timeFormat === '24') {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${period}`;
  };

  const getEventsForHour = (hour: number): Event[] => {
    return events.filter(event => {
      if (event.isAllDay) return hour === 0;

      if (event.startTime) {
        const [eventHour] = event.startTime.split(':').map(Number);
        return eventHour === hour;
      }

      return false;
    });
  };

  const isCurrentHour = (hour: number): boolean => {
    const isToday = date.toDateString() === currentTime.toDateString();
    return isToday && currentTime.getHours() === hour;
  };

  const getCurrentTimePosition = (): number | null => {
    const isToday = date.toDateString() === currentTime.toDateString();
    if (!isToday) return null;

    const minutes = currentTime.getMinutes();
    return (minutes / 60) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Date Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${themeColor}15, white)`,
        }}
      >
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">
            {date.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="text-2xl font-bold" style={{ color: themeColor }}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isCurrent = isCurrentHour(hour);

          return (
            <div
              key={hour}
              className={`relative border-b border-gray-100 ${
                isCurrent ? 'bg-blue-50' : ''
              }`}
              style={{ minHeight: '80px' }}
              onClick={() => onTimeSlotClick?.(hour)}
            >
              {/* Hour Label */}
              <div className="absolute top-2 left-2 text-xs font-medium text-gray-500 w-16">
                {formatHour(hour)}
              </div>

              {/* Current Time Indicator */}
              {isCurrent && currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 z-10"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                    <div
                      className="flex-1 h-0.5"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                </div>
              )}

              {/* Events */}
              <div className="ml-20 mr-2 mt-2 space-y-2">
                {hourEvents.map((event) => {
                  const meetingLink = getMeetingLinkFromEvent(event);

                  return (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg shadow-sm border-l-4 cursor-pointer active:scale-98 transition-transform"
                      style={{
                        borderLeftColor: event.color || event.calendar.color,
                        backgroundColor: `${event.color || event.calendar.color}10`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-semibold text-gray-900 text-sm">
                        {event.title}
                      </div>
                      {!event.isAllDay && event.startTime && event.endTime && (
                        <div className="text-xs text-gray-600 mt-1">
                          {event.startTime} - {event.endTime}
                        </div>
                      )}
                      {event.location && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </div>
                      )}
                      {meetingLink && (
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
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
              </div>

              {/* Empty state for tap to create */}
              {hourEvents.length === 0 && (
                <div className="ml-20 mr-2 h-full min-h-[60px] flex items-center justify-center text-gray-300 text-xs">
                  Tap to create event
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

