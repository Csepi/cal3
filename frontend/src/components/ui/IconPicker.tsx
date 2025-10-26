/**
 * IconPicker Component
 *
 * Allows users to select an emoji/icon for calendars, events, and resource types
 * Features:
 * - Predefined emoji categories with searchable names
 * - Search functionality by icon name
 * - Custom emoji input
 * - High z-index for modal compatibility
 * - Compact, accessible design
 */

import React, { useState, useMemo } from 'react';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  placeholder?: string;
  category?: 'calendar' | 'event' | 'resource' | 'all';
}

interface IconWithName {
  icon: string;
  name: string;
  keywords: string[];
}

const ICON_CATEGORIES = {
  calendar: {
    label: 'Calendar Icons',
    icons: [
      { icon: '📅', name: 'calendar', keywords: ['calendar', 'date', 'schedule'] },
      { icon: '📆', name: 'calendar-page', keywords: ['calendar', 'page', 'date'] },
      { icon: '🗓️', name: 'calendar-spiral', keywords: ['calendar', 'spiral', 'schedule'] },
      { icon: '📋', name: 'clipboard', keywords: ['clipboard', 'list', 'notes'] },
      { icon: '📝', name: 'memo', keywords: ['memo', 'note', 'write'] },
      { icon: '📄', name: 'document', keywords: ['document', 'file', 'paper'] },
      { icon: '📌', name: 'pin', keywords: ['pin', 'mark', 'important'] },
      { icon: '📍', name: 'location', keywords: ['location', 'place', 'map'] },
      { icon: '🗂️', name: 'organizer', keywords: ['organizer', 'folder', 'files'] },
      { icon: '📊', name: 'chart', keywords: ['chart', 'graph', 'stats'] },
    ],
  },
  event: {
    label: 'Event Icons',
    icons: [
      { icon: '🎉', name: 'party', keywords: ['party', 'celebration', 'fun'] },
      { icon: '🎊', name: 'confetti', keywords: ['confetti', 'celebration', 'party'] },
      { icon: '🎈', name: 'balloon', keywords: ['balloon', 'party', 'birthday'] },
      { icon: '🎯', name: 'target', keywords: ['target', 'goal', 'aim'] },
      { icon: '⭐', name: 'star', keywords: ['star', 'favorite', 'important'] },
      { icon: '✨', name: 'sparkles', keywords: ['sparkles', 'magic', 'special'] },
      { icon: '🎪', name: 'circus', keywords: ['circus', 'tent', 'show'] },
      { icon: '🎭', name: 'theater', keywords: ['theater', 'drama', 'performance'] },
      { icon: '🎨', name: 'art', keywords: ['art', 'paint', 'creative'] },
      { icon: '🎬', name: 'movie', keywords: ['movie', 'film', 'cinema'] },
      { icon: '🎵', name: 'music', keywords: ['music', 'note', 'song'] },
      { icon: '🎤', name: 'microphone', keywords: ['microphone', 'sing', 'speak'] },
      { icon: '🏆', name: 'trophy', keywords: ['trophy', 'award', 'winner'] },
      { icon: '🎓', name: 'graduation', keywords: ['graduation', 'education', 'school'] },
      { icon: '💼', name: 'briefcase', keywords: ['briefcase', 'work', 'business'] },
      { icon: '🍕', name: 'pizza', keywords: ['pizza', 'food', 'meal'] },
      { icon: '🍰', name: 'cake', keywords: ['cake', 'dessert', 'birthday'] },
      { icon: '☕', name: 'coffee', keywords: ['coffee', 'drink', 'cafe'] },
      { icon: '🏋️', name: 'workout', keywords: ['workout', 'exercise', 'gym'] },
      { icon: '⚽', name: 'soccer', keywords: ['soccer', 'sport', 'football'] },
    ],
  },
  resource: {
    label: 'Resource Icons',
    icons: [
      { icon: '🏢', name: 'building', keywords: ['building', 'office', 'work'] },
      { icon: '🏪', name: 'shop', keywords: ['shop', 'store', 'retail'] },
      { icon: '🏨', name: 'hotel', keywords: ['hotel', 'lodging', 'accommodation'] },
      { icon: '🏠', name: 'house', keywords: ['house', 'home', 'residence'] },
      { icon: '🚗', name: 'car', keywords: ['car', 'vehicle', 'auto'] },
      { icon: '🚙', name: 'suv', keywords: ['suv', 'vehicle', 'car'] },
      { icon: '🚕', name: 'taxi', keywords: ['taxi', 'cab', 'transport'] },
      { icon: '📦', name: 'package', keywords: ['package', 'box', 'delivery'] },
      { icon: '🛠️', name: 'tools', keywords: ['tools', 'repair', 'fix'] },
      { icon: '💻', name: 'laptop', keywords: ['laptop', 'computer', 'tech'] },
      { icon: '📱', name: 'phone', keywords: ['phone', 'mobile', 'smartphone'] },
      { icon: '🖥️', name: 'desktop', keywords: ['desktop', 'computer', 'monitor'] },
      { icon: '⚙️', name: 'settings', keywords: ['settings', 'gear', 'config'] },
      { icon: '🔧', name: 'wrench', keywords: ['wrench', 'tool', 'fix'] },
      { icon: '🔨', name: 'hammer', keywords: ['hammer', 'tool', 'build'] },
      { icon: '📷', name: 'camera', keywords: ['camera', 'photo', 'picture'] },
      { icon: '🎥', name: 'video', keywords: ['video', 'camera', 'film'] },
      { icon: '🎮', name: 'gaming', keywords: ['gaming', 'game', 'play'] },
      { icon: '🏃', name: 'running', keywords: ['running', 'sport', 'exercise'] },
      { icon: '🚴', name: 'cycling', keywords: ['cycling', 'bike', 'sport'] },
    ],
  },
  common: {
    label: 'Common Icons',
    icons: [
      { icon: '✅', name: 'check', keywords: ['check', 'yes', 'done'] },
      { icon: '❌', name: 'cross', keywords: ['cross', 'no', 'cancel'] },
      { icon: '⚠️', name: 'warning', keywords: ['warning', 'alert', 'caution'] },
      { icon: '❤️', name: 'heart', keywords: ['heart', 'love', 'favorite'] },
      { icon: '💚', name: 'green-heart', keywords: ['heart', 'green', 'love'] },
      { icon: '💙', name: 'blue-heart', keywords: ['heart', 'blue', 'love'] },
      { icon: '💛', name: 'yellow-heart', keywords: ['heart', 'yellow', 'love'] },
      { icon: '🔴', name: 'red-circle', keywords: ['red', 'circle', 'dot'] },
      { icon: '🟢', name: 'green-circle', keywords: ['green', 'circle', 'dot'] },
      { icon: '🔵', name: 'blue-circle', keywords: ['blue', 'circle', 'dot'] },
      { icon: '🟡', name: 'yellow-circle', keywords: ['yellow', 'circle', 'dot'] },
      { icon: '⚪', name: 'white-circle', keywords: ['white', 'circle', 'dot'] },
      { icon: '⚫', name: 'black-circle', keywords: ['black', 'circle', 'dot'] },
      { icon: '🔸', name: 'orange-diamond', keywords: ['orange', 'diamond', 'shape'] },
      { icon: '🔹', name: 'blue-diamond', keywords: ['blue', 'diamond', 'shape'] },
      { icon: '💡', name: 'lightbulb', keywords: ['lightbulb', 'idea', 'light'] },
      { icon: '🔔', name: 'bell', keywords: ['bell', 'notification', 'alert'] },
      { icon: '📢', name: 'announcement', keywords: ['announcement', 'megaphone', 'broadcast'] },
      { icon: '🎁', name: 'gift', keywords: ['gift', 'present', 'surprise'] },
      { icon: '🌟', name: 'star-shine', keywords: ['star', 'shine', 'special'] },
    ],
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<keyof typeof ICON_CATEGORIES>(
    category === 'all' ? 'calendar' : category
  );

  // Get categories to display
  const categoriesToShow = category === 'all'
    ? Object.entries(ICON_CATEGORIES)
    : [[category, ICON_CATEGORIES[category]]];

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return category === 'all'
        ? ICON_CATEGORIES[activeTab].icons
        : ICON_CATEGORIES[category].icons;
    }

    const query = searchQuery.toLowerCase();
    const iconsToSearch = category === 'all'
      ? ICON_CATEGORIES[activeTab].icons
      : ICON_CATEGORIES[category].icons;

    return iconsToSearch.filter(({ name, keywords }) =>
      name.toLowerCase().includes(query) ||
      keywords.some(kw => kw.toLowerCase().includes(query))
    );
  }, [searchQuery, activeTab, category]);

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
    setCustomIcon('');
    setSearchQuery('');
  };

  const handleCustomIconSubmit = () => {
    if (customIcon.trim()) {
      onChange(customIcon.trim());
      setCustomIcon('');
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setCustomIcon('');
    setSearchQuery('');
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

      {/* Dropdown Panel - VERY HIGH Z-INDEX for modal compatibility */}
      {isOpen && (
        <>
          {/* Backdrop with high z-index */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Picker Panel with highest z-index */}
          <div className="absolute top-full mt-2 left-0 w-full md:w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-[9999] max-h-96 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Header with Tabs (if showing all categories) */}
            {category === 'all' && !searchQuery && (
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
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map(({ icon, name }, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 text-2xl rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                        value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      title={name}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No icons found for "{searchQuery}"</p>
                  <p className="text-xs mt-2">Try a different search term</p>
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
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
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
