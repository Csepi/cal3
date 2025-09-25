import React from 'react';
import { THEME_COLOR_OPTIONS } from '../../constants';
import { Card, CardHeader } from '../ui';

/**
 * ThemeSelector component for choosing and applying theme colors
 *
 * This component provides a visual interface for users to select their preferred
 * theme color from the available options. It displays color swatches with gradients
 * and handles the theme change logic.
 */

export interface ThemeSelectorProps {
  /** Currently selected theme color */
  currentTheme: string;
  /** Function to call when theme changes */
  onThemeChange: (color: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Interactive theme color selector with visual preview of each color option
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = ''
}) => {
  return (
    <Card
      className={className}
      themeColor={currentTheme}
      padding="lg"
      header={
        <CardHeader>
          🎨 Theme Colors
        </CardHeader>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Choose your preferred color theme for the application interface
        </p>

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-3">
          {THEME_COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              onClick={() => onThemeChange(color.value)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105
                ${currentTheme === color.value
                  ? 'border-gray-800 shadow-lg ring-2 ring-offset-2 ring-gray-300'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              title={`Select ${color.name} theme`}
              aria-label={`Select ${color.name} theme`}
            >
              {/* Color Preview Circle */}
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 bg-gradient-to-r ${color.gradient} shadow-md`}
                style={{ backgroundColor: color.value }}
              />

              {/* Color Name */}
              <div className="text-xs font-medium text-gray-700 text-center">
                {color.name}
              </div>

              {/* Selected Indicator */}
              {currentTheme === color.value && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Current Selection Info */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: currentTheme }}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Current Theme: {THEME_COLOR_OPTIONS.find(c => c.value === currentTheme)?.name || 'Custom'}
              </p>
              <p className="text-xs text-gray-500">
                This color will be applied throughout the application interface
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};