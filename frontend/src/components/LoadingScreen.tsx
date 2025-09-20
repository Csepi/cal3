import React from 'react';

interface LoadingScreenProps {
  progress?: number; // 0-100
  message?: string;
  themeColor?: string;
  overlay?: boolean; // If true, shows as overlay, otherwise fullscreen
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = 0,
  message = 'Loading...',
  themeColor = '#3b82f6',
  overlay = false
}) => {
  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#3b82f6': { // Blue
        primary: 'blue-500',
        light: 'blue-100',
        gradient: 'from-blue-500 to-indigo-500',
        ring: 'ring-blue-500',
        text: 'text-blue-600'
      },
      '#8b5cf6': { // Purple
        primary: 'purple-500',
        light: 'purple-100',
        gradient: 'from-purple-500 to-violet-500',
        ring: 'ring-purple-500',
        text: 'text-purple-600'
      },
      '#10b981': { // Green
        primary: 'green-500',
        light: 'green-100',
        gradient: 'from-green-500 to-emerald-500',
        ring: 'ring-green-500',
        text: 'text-green-600'
      },
      '#ef4444': { // Red
        primary: 'red-500',
        light: 'red-100',
        gradient: 'from-red-500 to-rose-500',
        ring: 'ring-red-500',
        text: 'text-red-600'
      },
      '#f59e0b': { // Orange
        primary: 'orange-500',
        light: 'orange-100',
        gradient: 'from-orange-500 to-amber-500',
        ring: 'ring-orange-500',
        text: 'text-orange-600'
      },
      '#ec4899': { // Pink
        primary: 'pink-500',
        light: 'pink-100',
        gradient: 'from-pink-500 to-rose-500',
        ring: 'ring-pink-500',
        text: 'text-pink-600'
      },
      '#6366f1': { // Indigo
        primary: 'indigo-500',
        light: 'indigo-100',
        gradient: 'from-indigo-500 to-blue-500',
        ring: 'ring-indigo-500',
        text: 'text-indigo-600'
      },
      '#14b8a6': { // Teal
        primary: 'teal-500',
        light: 'teal-100',
        gradient: 'from-teal-500 to-cyan-500',
        ring: 'ring-teal-500',
        text: 'text-teal-600'
      },
      '#eab308': { // Yellow
        primary: 'yellow-500',
        light: 'yellow-100',
        gradient: 'from-yellow-500 to-amber-500',
        ring: 'ring-yellow-500',
        text: 'text-yellow-600'
      },
      '#64748b': { // Slate
        primary: 'slate-500',
        light: 'slate-100',
        gradient: 'from-slate-500 to-gray-500',
        ring: 'ring-slate-500',
        text: 'text-slate-600'
      }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  const containerClasses = overlay
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    : "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100";

  return (
    <div className={containerClasses}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 backdrop-blur-lg">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className={`w-16 h-16 border-4 border-gray-200 rounded-full animate-spin`}>
              <div className={`w-full h-full border-4 border-transparent border-t-${themeColors.primary} rounded-full`}></div>
            </div>

            {/* Inner pulsing dot */}
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-4 h-4 bg-gradient-to-r ${themeColors.gradient} rounded-full animate-pulse`}></div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${themeColors.text}`}>{message}</span>
            <span className={`text-sm font-bold ${themeColors.text}`}>{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar Background */}
          <div className={`w-full bg-${themeColors.light} rounded-full h-3 overflow-hidden shadow-inner`}>
            {/* Progress Bar Fill */}
            <div
              className={`h-full bg-gradient-to-r ${themeColors.gradient} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 bg-${themeColors.primary} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 rounded-3xl opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;