// @ts-nocheck
/**
 * DayDetailSheet - Bottom sheet showing all events for a day
 *
 * Features:
 * - Swipeable bottom sheet
 * - Event list with all details
 * - Quick create event button
 * - Empty state for no events
 * - Grouped by time (all-day first)
 */

import React, { useMemo } from 'react';
import type { Event } from '../../../types/Event';
import { BottomSheet } from '../BottomSheet';
import { EventListItem } from './EventListItem';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onCreateEvent: () => void;
  themeColor: string;
}

export const DayDetailSheet: React.FC<DayDetailSheetProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
  onCreateEvent,
  themeColor,
}) => {
  // Group events by all-day vs timed
  const groupedEvents = useMemo(() => {
    const allDay = events.filter(e => e.isAllDay);
    const timed = events.filter(e => !e.isAllDay).sort((a, b) => {
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    return { allDay, timed };
  }, [events]);

  const totalEvents = events.length;

  const formattedDate = useMemo(() => {
    const isToday = date.toDateString() === new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [date]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="85vh"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{formattedDate}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalEvents === 0 ? 'No events' : `${totalEvents} event${totalEvents !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Create Event Button */}
          <TouchableArea
            onClick={() => {
              onClose();
              onCreateEvent();
            }}
            className="rounded-full"
            style={{ backgroundColor: themeColor }}
            minSize="lg"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <Icon icon="➕" size="lg" className="text-white" />
            </div>
          </TouchableArea>
        </div>

        {/* Events List */}
        {totalEvents > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-1">
            {/* All-day Events */}
            {groupedEvents.allDay.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                  All-day events
                </div>
                <div className="space-y-2">
                  {groupedEvents.allDay.map(event => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      themeColor={themeColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timed Events */}
            {groupedEvents.timed.length > 0 && (
              <div>
                {groupedEvents.allDay.length > 0 && (
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    Scheduled events
                  </div>
                )}
                <div className="space-y-2">
                  {groupedEvents.timed.map(event => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      themeColor={themeColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events</h3>
            <p className="text-sm text-gray-600 mb-6 px-8">
              You don't have any events scheduled for this day
            </p>
            <TouchableArea
              onClick={() => {
                onClose();
                onCreateEvent();
              }}
              className="px-6 py-3 rounded-full shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-2 text-white font-medium">
                <Icon icon="➕" size="sm" />
                <span>Create Event</span>
              </div>
            </TouchableArea>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

