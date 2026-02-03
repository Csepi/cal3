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
    const colorMap: Record<string, unknown> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', spinner: 'border-red-500', text: 'text-red-600' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', spinner: 'border-orange-500', text: 'text-orange-600' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', spinner: 'border-yellow-500', text: 'text-yellow-600' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', spinner: 'border-lime-500', text: 'text-lime-600' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', spinner: 'border-green-500', text: 'text-green-600' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', spinner: 'border-emerald-500', text: 'text-emerald-600' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', spinner: 'border-teal-500', text: 'text-teal-600' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', spinner: 'border-cyan-500', text: 'text-cyan-600' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', spinner: 'border-sky-500', text: 'text-sky-600' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', spinner: 'border-blue-500', text: 'text-blue-600' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', spinner: 'border-indigo-500', text: 'text-indigo-600' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', spinner: 'border-violet-500', text: 'text-violet-600' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', spinner: 'border-purple-500', text: 'text-purple-600' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', spinner: 'border-pink-500', text: 'text-pink-600' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', spinner: 'border-rose-500', text: 'text-rose-600' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', spinner: 'border-slate-500', text: 'text-slate-600' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  const containerClasses = overlay
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    : `min-h-screen flex items-center justify-center bg-gradient-to-br ${themeColors.gradient}`;

  return (
    <div className={containerClasses}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 backdrop-blur-lg">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className={`w-16 h-16 border-4 border-gray-200 rounded-full animate-spin`}>
              <div className={`w-full h-full border-4 border-transparent ${themeColors.spinner} border-t-4 rounded-full`}></div>
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

