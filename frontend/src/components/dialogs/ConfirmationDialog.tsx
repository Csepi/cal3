import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  themeColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  themeColor,
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  if (!isOpen) return null;

  // Get warning theme colors based on the user's profile color
  const getWarningTheme = (color: string) => {
    // Convert user's theme color to warning variants
    const warningThemes: Record<string, unknown> = {
      '#3b82f6': { // Blue -> Red warning
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-700'
      },
      '#8b5cf6': { // Purple -> Orange warning
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        confirmBtn: 'bg-orange-600 hover:bg-orange-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-orange-900',
        accent: 'text-orange-700'
      },
      '#10b981': { // Green -> Red warning
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-700'
      },
      '#ef4444': { // Red -> Darker red warning
        bg: 'bg-red-50',
        border: 'border-red-300',
        icon: 'text-red-700',
        confirmBtn: 'bg-red-700 hover:bg-red-800',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-800'
      },
      '#f59e0b': { // Orange -> Red warning
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-700'
      },
      '#ec4899': { // Pink -> Red warning
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-700'
      },
      '#6366f1': { // Indigo -> Orange warning
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        confirmBtn: 'bg-orange-600 hover:bg-orange-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-orange-900',
        accent: 'text-orange-700'
      },
      '#14b8a6': { // Teal -> Red warning
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        text: 'text-red-900',
        accent: 'text-red-700'
      }
    };

    return warningThemes[color] || warningThemes['#3b82f6']; // Default to red warning
  };

  const warningTheme = getWarningTheme(themeColor);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header with warning color */}
        <div className={`${warningTheme.bg} ${warningTheme.border} border-b px-6 py-4`}>
          <div className="flex items-center space-x-3">
            <div className={`${warningTheme.icon} text-2xl`}>
              ⚠️
            </div>
            <h3 className={`text-lg font-semibold ${warningTheme.text}`}>
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className={`text-gray-700 leading-relaxed ${warningTheme.accent}`}>
            {message}
          </p>

          {isDestructive && (
            <div className={`mt-4 p-3 ${warningTheme.bg} ${warningTheme.border} border rounded-lg`}>
              <div className="flex items-center space-x-2">
                <span className={`${warningTheme.icon} text-sm`}>🔥</span>
                <span className={`text-sm font-medium ${warningTheme.accent}`}>
                  This action cannot be undone
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${warningTheme.cancelBtn} border hover:scale-105 shadow-sm`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-medium text-white transition-all duration-200 ${warningTheme.confirmBtn} hover:scale-105 shadow-md`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

