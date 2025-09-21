import React from 'react';
import type { Calendar as CalendarType } from '../types/Calendar';

interface CalendarSidebarProps {
  calendars: CalendarType[];
  selectedCalendars: number[];
  onToggleCalendar: (calendarId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEditCalendar: (calendar: CalendarType) => void;
  themeColor: string;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  calendars,
  selectedCalendars,
  onToggleCalendar,
  onSelectAll,
  onDeselectAll,
  onEditCalendar,
  themeColor
}) => {
  const allSelected = calendars.length > 0 && selectedCalendars.length === calendars.length;
  const someSelected = selectedCalendars.length > 0 && selectedCalendars.length < calendars.length;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">My Calendars</h3>

        {/* Select All/None Controls */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              allSelected
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            disabled={selectedCalendars.length === 0}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              selectedCalendars.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Calendar List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {calendars.map((calendar) => {
            const isSelected = selectedCalendars.includes(calendar.id);

            return (
              <div
                key={calendar.id}
                className={`group flex items-center p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-300 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${calendar.color}15, ${calendar.color}25, #f0f9ff)`
                    : `linear-gradient(135deg, ${calendar.color}08, #ffffff)`
                }}
                onClick={() => onToggleCalendar(calendar.id)}
              >
                {/* Checkbox */}
                <div className="flex items-center mr-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCalendar(calendar.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Calendar Color Indicator */}
                <div
                  className="w-4 h-4 rounded-full mr-3 border-2 border-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${calendar.color}, ${calendar.color}dd)`,
                    boxShadow: `0 2px 4px ${calendar.color}40, inset 0 1px 2px rgba(255,255,255,0.3)`
                  }}
                />

                {/* Calendar Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {calendar.name}
                    </h4>

                    <div className="flex items-center gap-2">
                      {/* Edit button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCalendar(calendar);
                        }}
                        className="p-1 opacity-60 hover:opacity-100 hover:bg-gray-200 rounded transition-all duration-200"
                        title="Edit Calendar"
                      >
                        <span className="text-xs">✏️</span>
                      </button>

                      {/* Owner indicator */}
                      {calendar.owner && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isSelected
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          Owner
                        </span>
                      )}
                    </div>
                  </div>

                  {calendar.description && (
                    <p className={`text-xs mt-1 truncate ${
                      isSelected ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {calendar.description}
                    </p>
                  )}

                  {/* Event count if available */}
                  {calendar.eventCount !== undefined && (
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {calendar.eventCount} events
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {calendars.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  📅
                </div>
                <p>No calendars found</p>
                <p className="text-xs mt-1">Create a calendar to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with selection summary */}
      {calendars.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <span className="font-medium">
              {selectedCalendars.length} of {calendars.length}
            </span>
            {' calendars selected'}
          </div>

          {someSelected && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              ⚠️ Some calendars are hidden
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarSidebar;