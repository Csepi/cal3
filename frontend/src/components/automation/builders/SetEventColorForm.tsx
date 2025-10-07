import React from 'react';

interface SetEventColorFormProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const PRESET_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#10b981' },
  { name: 'Emerald', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Slate', value: '#64748b' },
];

export const SetEventColorForm: React.FC<SetEventColorFormProps> = ({ config, onChange }) => {
  const selectedColor = config.color || '#3b82f6';

  const handleColorChange = (color: string) => {
    onChange({ color });
  };

  const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className="space-y-4">
      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Event Color *</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => {
              const value = e.target.value;
              if (isValidHexColor(value) || value === '' || value.startsWith('#')) {
                handleColorChange(value);
              }
            }}
            placeholder="#3b82f6"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div
            className="w-12 h-12 rounded border-2 border-gray-300"
            style={{ backgroundColor: isValidHexColor(selectedColor) ? selectedColor : '#f3f4f6' }}
            title="Preview"
          />
        </div>
        {!isValidHexColor(selectedColor) && selectedColor && (
          <p className="mt-1 text-xs text-red-600">Invalid hex color format</p>
        )}
      </div>

      {/* Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preset Colors
        </label>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleColorChange(preset.value)}
              className={`w-full aspect-square rounded border-2 transition-all hover:scale-110 ${
                selectedColor.toLowerCase() === preset.value.toLowerCase()
                  ? 'border-gray-900 ring-2 ring-blue-500'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-gray-700">
          <strong>How it works:</strong> When this rule triggers, the event's color will be
          changed to the selected color. This applies to the event's visual appearance in the
          calendar.
        </p>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
        <div
          className="p-3 rounded text-white font-medium text-sm"
          style={{ backgroundColor: isValidHexColor(selectedColor) ? selectedColor : '#9ca3af' }}
        >
          Sample Event Title
        </div>
      </div>
    </div>
  );
};
