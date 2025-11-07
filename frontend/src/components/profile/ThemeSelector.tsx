import React from 'react';
import { THEME_COLOR_OPTIONS } from '../../constants';
import { Card, CardHeader } from '../ui';

export interface ThemeSelectorProps {
  /** Currently selected theme color */
  currentTheme: string;
  /** Function to call when theme changes */
  onThemeChange: (color: string) => void;
  /** Whether a theme change request is in-flight */
  isSaving?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  isSaving = false,
  className = '',
}) => {
  const selectedTheme = THEME_COLOR_OPTIONS.find((option) => option.value === currentTheme);

  return (
    <Card
      className={className}
      themeColor={currentTheme}
      padding="lg"
      header={<CardHeader>Theme Colors</CardHeader>}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Choose the accent color used across the interface.</p>

        <div className="grid grid-cols-4 gap-3">
          {THEME_COLOR_OPTIONS.map((color) => {
            const isActive = currentTheme === color.value;

            return (
              <button
                key={color.value}
                type="button"
                onClick={() => onThemeChange(color.value)}
                disabled={isSaving}
                className={`relative rounded-lg border-2 p-3 transition-all duration-200 ${
                  isSaving ? 'cursor-wait opacity-60' : 'hover:scale-105'
                } ${
                  isActive
                    ? 'border-gray-800 shadow-lg ring-2 ring-offset-2 ring-gray-300'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={`Select ${color.name} theme`}
                aria-label={`Select ${color.name} theme`}
              >
                <div
                  className={`mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-r ${color.gradient} shadow-md`}
                  style={{ backgroundColor: color.value }}
                />

                <div className="text-center text-xs font-medium text-gray-700">{color.name}</div>

                {isActive && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center space-x-3">
            <div
              className="h-6 w-6 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: currentTheme }}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Current Theme: {selectedTheme?.name ?? 'Custom'}
              </p>
              <p className="text-xs text-gray-500">
                {isSaving ? 'Saving your preference…' : 'Applied across dashboards, dialogs, and highlights.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
