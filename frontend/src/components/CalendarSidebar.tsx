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
  resources?: any[];
  selectedResources?: number[];
  onToggleResource?: (resourceId: number) => void;
  onSelectAllResources?: () => void;
  onDeselectAllResources?: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  calendars,
  selectedCalendars,
  onToggleCalendar,
  onSelectAll,
  onDeselectAll,
  onEditCalendar,
  themeColor,
  resources = [],
  selectedResources = [],
  onToggleResource,
  onSelectAllResources,
  onDeselectAllResources
}) => {
  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'red', light: 'red-100', text: 'red-700', hover: 'red-200' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'orange', light: 'orange-100', text: 'orange-700', hover: 'orange-200' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', primary: 'yellow', light: 'yellow-100', text: 'yellow-700', hover: 'yellow-200' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', primary: 'lime', light: 'lime-100', text: 'lime-700', hover: 'lime-200' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'green', light: 'green-100', text: 'green-700', hover: 'green-200' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', primary: 'emerald', light: 'emerald-100', text: 'emerald-700', hover: 'emerald-200' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'teal', light: 'teal-100', text: 'teal-700', hover: 'teal-200' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', primary: 'cyan', light: 'cyan-100', text: 'cyan-700', hover: 'cyan-200' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', primary: 'sky', light: 'sky-100', text: 'sky-700', hover: 'sky-200' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'blue', light: 'blue-100', text: 'blue-700', hover: 'blue-200' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'indigo', light: 'indigo-100', text: 'indigo-700', hover: 'indigo-200' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', primary: 'violet', light: 'violet-100', text: 'violet-700', hover: 'violet-200' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'purple', light: 'purple-100', text: 'purple-700', hover: 'purple-200' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'pink', light: 'pink-100', text: 'pink-700', hover: 'pink-200' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', primary: 'rose', light: 'rose-100', text: 'rose-700', hover: 'rose-200' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', primary: 'slate', light: 'slate-100', text: 'slate-700', hover: 'slate-200' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);
  const allSelected = calendars.length > 0 && selectedCalendars.length === calendars.length;
  const someSelected = selectedCalendars.length > 0 && selectedCalendars.length < calendars.length;

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col h-full" style={{
      background: `linear-gradient(135deg, white 0%, ${themeColor}05 50%, white 100%)`
    }}>
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
                : `bg-${themeColors.light} text-${themeColors.text} hover:bg-${themeColors.hover}`
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
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Calendar List - Reduced height when reservations present */}
      <div className={`${resources.length > 0 ? 'flex-none max-h-64' : 'flex-1'} overflow-y-auto p-4`}>
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

      {/* Reservations Section - Much larger space */}
      {resources.length > 0 && (
        <>
          <div className="flex-1 p-4 border-t border-gray-200 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Reservations</h3>

            <div className="flex gap-2 mb-3">
              <button
                onClick={onSelectAllResources}
                disabled={selectedResources.length === resources.length}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                  selectedResources.length === resources.length
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : `bg-${themeColors.light} text-${themeColors.text} hover:bg-${themeColors.hover}`
                }`}
              >
                Select All
              </button>
              <button
                onClick={onDeselectAllResources}
                disabled={selectedResources.length === 0}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                  selectedResources.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Deselect All
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {resources.map((resource) => {
                const isSelected = selectedResources.includes(resource.id);
                return (
                  <div
                    key={resource.id}
                    className={`group flex items-center p-2 rounded-lg border transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => onToggleResource?.(resource.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleResource?.(resource.id)}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: '#f97316' }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${
                        isSelected ? 'text-orange-900' : 'text-gray-900'
                      }`}>
                        {resource.name}
                      </h4>
                      {resource.resourceType && (
                        <p className="text-xs text-gray-500 truncate">
                          {resource.resourceType.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer with selection summary */}
      {calendars.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <span className="font-medium">
              {selectedCalendars.length} of {calendars.length}
            </span>
            {' calendars selected'}
          </div>

          {resources.length > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              <span className="font-medium">
                {selectedResources.length} of {resources.length}
              </span>
              {' resources selected'}
            </div>
          )}

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