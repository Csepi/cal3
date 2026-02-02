// @ts-nocheck
/**
 * EventListItem - Touch-friendly event card
 *
 * Displays a single event in a list with:
 * - Large touch target
 * - Clear visual hierarchy
 * - Time, title, location
 * - Color indicator
 * - Swipe actions (future)
 */

import React from 'react';
import type { Event } from '../../../types/Event';
import { getMeetingLinkFromEvent } from '../../../utils/meetingLinks';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface EventListItemProps {
  event: Event;
  onClick: (event: Event) => void;
  themeColor: string;
  compact?: boolean;
}

export const EventListItem: React.FC<EventListItemProps> = ({
  event,
  onClick,
  themeColor,
  compact = false,
}) => {
  const eventColor = event.color || event.calendar.color || themeColor;
  const meetingLink = getMeetingLinkFromEvent(event);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <TouchableArea
      onClick={() => onClick(event)}
      className={`
        w-full border-l-4 bg-white border-gray-100
        transition-all duration-200 active:scale-[0.98]
        ${compact ? 'px-3 py-2' : 'px-4 py-3'}
      `}
      style={{ borderLeftColor: eventColor }}
      minSize="lg"
    >
      <div className="flex items-start gap-3">
        {/* Time Column */}
        <div className="flex-shrink-0 w-16 text-right">
          {event.isAllDay ? (
            <div className="text-xs font-medium text-gray-500">All day</div>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-900">
                {event.startTime ? formatTime(event.startTime).split(' ')[0] : '--:--'}
              </div>
              <div className="text-xs text-gray-500">
                {event.startTime ? formatTime(event.startTime).split(' ')[1] : ''}
              </div>
            </>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="font-semibold text-gray-900 truncate mb-1">
            {event.title}
            {event.isRecurring && (
              <Icon icon="🔄" size="xs" className="ml-1 inline-block text-gray-400" />
            )}
          </div>

          {/* Time Range (for non-all-day events) */}
          {!event.isAllDay && event.startTime && event.endTime && (
            <div className="text-xs text-gray-600 mb-1">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Icon icon="📍" size="xs" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {meetingLink && (
            <button
              type="button"
              className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                window.open(meetingLink, '_blank', 'noopener,noreferrer');
              }}
              aria-label={`Join ${event.title} meeting`}
            >
              Join
            </button>
          )}

          {/* Calendar Name */}
          {!compact && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: eventColor }}
              />
              <span>{event.calendar.name}</span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <Icon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          }
          className="text-gray-400 flex-shrink-0"
        />
      </div>
    </TouchableArea>
  );
};

