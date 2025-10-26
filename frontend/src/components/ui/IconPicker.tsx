/**
 * IconPicker Component
 *
 * Allows users to select an emoji/icon for calendars, events, and resource types
 * Features:
 * - Predefined emoji categories (events, calendars, resources, common)
 * - Custom emoji input
 * - Clear selection option
 * - Compact, accessible design
 */

import React, { useState } from 'react';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  placeholder?: string;
  category?: 'calendar' | 'event' | 'resource' | 'all';
}

const ICON_CATEGORIES = {
  calendar: {
    label: 'Calendar Icons',
    icons: ['📅', '📆', '🗓️', '📋', '📝', '📄', '📌', '📍', '🗂️', '📊'],
  },
  event: {
    label: 'Event Icons',
    icons: ['🎉', '🎊', '🎈', '🎯', '⭐', '✨', '🎪', '🎭', '🎨', '🎬', '🎵', '🎤', '🏆', '🎓', '💼', '🍕', '🍰', '☕', '🏋️', '⚽'],
  },
  resource: {
    label: 'Resource Icons',
    icons: ['🏢', '🏪', '🏨', '🏠', '🚗', '🚙', '🚕', '📦', '🛠️', '💻', '📱', '🖥️', '⚙️', '🔧', '🔨', '📷', '🎥', '🎮', '🏃', '🚴'],
  },
  common: {
    label: 'Common Icons',
    icons: ['✅', '❌', '⚠️', '❤️', '💚', '💙', '💛', '🔴', '🟢', '🔵', '🟡', '⚪', '⚫', '🔸', '🔹', '💡', '🔔', '📢', '🎁', '🌟'],
  },
};

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = 'Select icon...',
  category = 'all',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customIcon, setCustomIcon] = useState('');
  const [activeTab, setActiveTab] = useState<keyof typeof ICON_CATEGORIES>(
    category === 'all' ? 'calendar' : category
  );

  // Get categories to display
  const categoriesToShow = category === 'all'
    ? Object.entries(ICON_CATEGORIES)
    : [[category, ICON_CATEGORIES[category]]];

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
    setCustomIcon('');
  };

  const handleCustomIconSubmit = () => {
    if (customIcon.trim()) {
      onChange(customIcon.trim());
      setCustomIcon('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setCustomIcon('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between bg-white"
      >
        <span className={value ? 'flex items-center gap-2' : 'text-gray-500'}>
          {value ? (
            <>
              <span className="text-2xl">{value}</span>
              <span className="text-sm text-gray-600">Selected</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Panel */}
          <div className="absolute top-full mt-2 left-0 w-full md:w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header with Tabs (if showing all categories) */}
            {category === 'all' && (
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {Object.entries(ICON_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key as keyof typeof ICON_CATEGORIES)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === key
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Icon Grid */}
            <div className="p-4 overflow-y-auto flex-1">
              {category === 'all' ? (
                // Show active tab
                <div className="grid grid-cols-8 gap-2">
                  {ICON_CATEGORIES[activeTab].icons.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 text-2xl rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                        value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              ) : (
                // Show single category
                <div className="grid grid-cols-8 gap-2">
                  {ICON_CATEGORIES[category].icons.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 text-2xl rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                        value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Icon Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomIconSubmit()}
                  placeholder="Or type custom emoji..."
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCustomIconSubmit}
                  disabled={!customIcon.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-200 flex justify-between gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
