import React, { useState } from 'react';
import type { RecurrencePattern } from '../types/Event';
import { RecurrenceType, RecurrenceEndType } from '../types/Event';

export enum WeekDay {
  SUNDAY = 'SU',
  MONDAY = 'MO',
  TUESDAY = 'TU',
  WEDNESDAY = 'WE',
  THURSDAY = 'TH',
  FRIDAY = 'FR',
  SATURDAY = 'SA'
}

export { RecurrenceType, RecurrenceEndType };

interface RecurrenceSelectorProps {
  value: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  themeColor: string;
  disabled?: boolean;
}

const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange,
  themeColor,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getThemeColors = (color: string) => {
    const colorMap: Record<string, unknown> = {
      '#ef4444': { button: 'bg-red-500 hover:bg-red-600', text: 'text-red-600', border: 'border-red-200' },
      '#f59e0b': { button: 'bg-orange-500 hover:bg-orange-600', text: 'text-orange-600', border: 'border-orange-200' },
      '#eab308': { button: 'bg-yellow-500 hover:bg-yellow-600', text: 'text-yellow-600', border: 'border-yellow-200' },
      '#84cc16': { button: 'bg-lime-500 hover:bg-lime-600', text: 'text-lime-600', border: 'border-lime-200' },
      '#10b981': { button: 'bg-green-500 hover:bg-green-600', text: 'text-green-600', border: 'border-green-200' },
      '#22c55e': { button: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200' },
      '#14b8a6': { button: 'bg-teal-500 hover:bg-teal-600', text: 'text-teal-600', border: 'border-teal-200' },
      '#06b6d4': { button: 'bg-cyan-500 hover:bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200' },
      '#0ea5e9': { button: 'bg-sky-500 hover:bg-sky-600', text: 'text-sky-600', border: 'border-sky-200' },
      '#3b82f6': { button: 'bg-blue-500 hover:bg-blue-600', text: 'text-blue-600', border: 'border-blue-200' },
      '#6366f1': { button: 'bg-indigo-500 hover:bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200' },
      '#7c3aed': { button: 'bg-violet-500 hover:bg-violet-600', text: 'text-violet-600', border: 'border-violet-200' },
      '#8b5cf6': { button: 'bg-purple-500 hover:bg-purple-600', text: 'text-purple-600', border: 'border-purple-200' },
      '#ec4899': { button: 'bg-pink-500 hover:bg-pink-600', text: 'text-pink-600', border: 'border-pink-200' },
      '#f43f5e': { button: 'bg-rose-500 hover:bg-rose-600', text: 'text-rose-600', border: 'border-rose-200' },
      '#64748b': { button: 'bg-slate-500 hover:bg-slate-600', text: 'text-slate-600', border: 'border-slate-200' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  const getRecurrenceText = (pattern: RecurrencePattern): string => {
    if (pattern.type === RecurrenceType.NONE) return 'Does not repeat';

    const interval = pattern.interval || 1;
    const intervalText = interval === 1 ? '' : `every ${interval} `;

    switch (pattern.type) {
      case RecurrenceType.DAILY:
        return `Repeats ${intervalText}day${interval === 1 ? '' : 's'}`;
      case RecurrenceType.WEEKLY:
        return `Repeats ${intervalText}week${interval === 1 ? '' : 's'}`;
      case RecurrenceType.MONTHLY:
        return `Repeats ${intervalText}month${interval === 1 ? '' : 's'}`;
      case RecurrenceType.YEARLY:
        return `Repeats ${intervalText}year${interval === 1 ? '' : 's'}`;
      default:
        return 'Does not repeat';
    }
  };

  const handlePatternChange = (updates: Partial<RecurrencePattern>) => {
    if (!value) {
      onChange({
        type: RecurrenceType.DAILY,
        interval: 1,
        endType: RecurrenceEndType.NEVER,
        ...updates
      });
    } else {
      onChange({ ...value, ...updates });
    }
  };

  const weekDayLabels = {
    [WeekDay.SUNDAY]: 'Sun',
    [WeekDay.MONDAY]: 'Mon',
    [WeekDay.TUESDAY]: 'Tue',
    [WeekDay.WEDNESDAY]: 'Wed',
    [WeekDay.THURSDAY]: 'Thu',
    [WeekDay.FRIDAY]: 'Fri',
    [WeekDay.SATURDAY]: 'Sat'
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        🔄 Recurrence
      </label>

      {/* Basic recurrence selector */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left bg-white/80 hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 flex justify-between items-center"
        >
          <span className="text-gray-700">
            {value ? getRecurrenceText(value) : 'Does not repeat'}
          </span>
          <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className={`border ${themeColors.border} rounded-xl p-4 bg-white/90 space-y-4`}>
            {/* Recurrence type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Frequency</label>
              <select
                value={value?.type || RecurrenceType.NONE}
                onChange={(e) => {
                  const type = e.target.value as RecurrenceType;
                  if (type === RecurrenceType.NONE) {
                    onChange(null);
                    setIsExpanded(false);
                  } else {
                    handlePatternChange({ type });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={RecurrenceType.NONE}>Does not repeat</option>
                <option value={RecurrenceType.DAILY}>Daily</option>
                <option value={RecurrenceType.WEEKLY}>Weekly</option>
                <option value={RecurrenceType.MONTHLY}>Monthly</option>
                <option value={RecurrenceType.YEARLY}>Yearly</option>
              </select>
            </div>

            {value && value.type !== RecurrenceType.NONE && (
              <>
                {/* Interval */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">Repeat every</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={value.interval || 1}
                        onChange={(e) => handlePatternChange({ interval: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-sm text-gray-600">
                        {value.type === RecurrenceType.DAILY && 'day(s)'}
                        {value.type === RecurrenceType.WEEKLY && 'week(s)'}
                        {value.type === RecurrenceType.MONTHLY && 'month(s)'}
                        {value.type === RecurrenceType.YEARLY && 'year(s)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Days of week (for weekly recurrence) */}
                {value.type === RecurrenceType.WEEKLY && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">Repeat on</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(weekDayLabels).map(([day, label]) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const currentDays = value.daysOfWeek || [];
                            const dayValue = day as WeekDay;
                            const newDays = currentDays.includes(dayValue)
                              ? currentDays.filter(d => d !== dayValue)
                              : [...currentDays, dayValue];
                            handlePatternChange({ daysOfWeek: newDays });
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            (value.daysOfWeek || []).includes(day as WeekDay)
                              ? `${themeColors.button} text-white`
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* End condition */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">Ends</label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="endType"
                        checked={value.endType === RecurrenceEndType.NEVER || !value.endType}
                        onChange={() => handlePatternChange({ endType: RecurrenceEndType.NEVER, count: undefined, endDate: undefined })}
                        className="text-blue-500"
                      />
                      <span className="text-sm">Never</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="endType"
                        checked={value.endType === RecurrenceEndType.COUNT}
                        onChange={() => handlePatternChange({ endType: RecurrenceEndType.COUNT, endDate: undefined })}
                        className="text-blue-500"
                      />
                      <span className="text-sm">After</span>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={value.count || ''}
                        onChange={(e) => handlePatternChange({ count: parseInt(e.target.value) || undefined })}
                        disabled={value.endType !== RecurrenceEndType.COUNT}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                      />
                      <span className="text-sm">occurrences</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="endType"
                        checked={value.endType === RecurrenceEndType.DATE}
                        onChange={() => handlePatternChange({ endType: RecurrenceEndType.DATE, count: undefined })}
                        className="text-blue-500"
                      />
                      <span className="text-sm">On date</span>
                      <input
                        type="date"
                        value={value.endDate || ''}
                        onChange={(e) => handlePatternChange({ endDate: e.target.value })}
                        disabled={value.endType !== RecurrenceEndType.DATE}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrenceSelector;

