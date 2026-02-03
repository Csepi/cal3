import React, { useState } from 'react';
import type { RecurrencePattern } from '../types/Event';

interface RecurrenceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: 'this' | 'future' | 'all', eventData?: unknown, recurrence?: RecurrencePattern) => void;
  eventTitle: string;
  themeColor: string;
  editType: 'update' | 'delete';
}

const RecurrenceEditDialog: React.FC<RecurrenceEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  themeColor,
  editType
}) => {
  const [selectedScope, setSelectedScope] = useState<'this' | 'future' | 'all'>('this');

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

  const handleConfirm = () => {
    onConfirm(selectedScope);
    onClose();
  };

  if (!isOpen) return null;

  const getScopeIcon = (scope: 'this' | 'future' | 'all') => {
    switch (scope) {
      case 'this': return '📝';
      case 'future': return '⏭️';
      case 'all': return '🔄';
    }
  };

  const getScopeTitle = (scope: 'this' | 'future' | 'all') => {
    switch (scope) {
      case 'this': return editType === 'delete' ? 'Only this event' : 'Only this event';
      case 'future': return editType === 'delete' ? 'This and future events' : 'This and future events';
      case 'all': return editType === 'delete' ? 'All events in the series' : 'All events in the series';
    }
  };

  const getScopeDescription = (scope: 'this' | 'future' | 'all') => {
    switch (scope) {
      case 'this':
        return editType === 'delete'
          ? 'Only this occurrence will be deleted. Other events in the series will remain unchanged.'
          : 'Only this occurrence will be changed. Other events in the series will remain unchanged.';
      case 'future':
        return editType === 'delete'
          ? 'This event and all future occurrences will be deleted. Past events will remain unchanged.'
          : 'This event and all future occurrences will be changed. Past events will remain unchanged.';
      case 'all':
        return editType === 'delete'
          ? 'All events in this recurring series will be deleted permanently.'
          : 'All events in this recurring series will be changed to match your updates.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div
        className="rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
        style={{
          background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}08 25%, white 50%, ${themeColor}08 75%, ${themeColor}15 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 25px 50px -12px ${themeColor}40`
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${themeColors.text}`}>
              {editType === 'delete' ? '🗑️ Delete Recurring Event' : '✏️ Edit Recurring Event'}
            </h2>
            <p className="text-gray-600 text-sm">
              "{eventTitle}" is part of a recurring series
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed">
            How would you like to {editType === 'delete' ? 'delete' : 'change'} this recurring event?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {(['this', 'future', 'all'] as const).map((scope) => (
            <label
              key={scope}
              className={`block cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedScope === scope
                  ? `${themeColors.border} bg-white/80 shadow-md`
                  : 'border-gray-200 bg-white/40 hover:bg-white/60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="scope"
                  value={scope}
                  checked={selectedScope === scope}
                  onChange={(e) => setSelectedScope(e.target.value as 'this' | 'future' | 'all')}
                  className={`mt-1 text-${themeColor.replace('#', '')} focus:ring-2 focus:ring-${themeColor.replace('#', '')}`}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getScopeIcon(scope)}</span>
                    <h3 className="font-semibold text-gray-800">{getScopeTitle(scope)}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {getScopeDescription(scope)}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Warning for 'all' option */}
        {selectedScope === 'all' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">
                  {editType === 'delete' ? 'Permanent Deletion' : 'Series-wide Changes'}
                </h4>
                <p className="text-sm text-amber-700">
                  {editType === 'delete'
                    ? 'This action cannot be undone. All events in this recurring series will be permanently deleted.'
                    : 'This will update all events in the series, including past events. This action affects the entire recurring pattern.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
              editType === 'delete' && selectedScope === 'all'
                ? 'bg-red-500 hover:bg-red-600'
                : themeColors.button
            }`}
          >
            {editType === 'delete' ? 'Delete' : 'Update'} {getScopeTitle(selectedScope)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceEditDialog;


