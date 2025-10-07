import React, { useState } from 'react';
import type { AutomationRuleDetailDto } from '../../../types/Automation';

interface RetroactiveExecutionDialogProps {
  rule: AutomationRuleDetailDto;
  onConfirm: () => Promise<{ message: string; executionCount: number }>;
  onCancel: () => void;
  themeColor?: string;
}

export const RetroactiveExecutionDialog: React.FC<RetroactiveExecutionDialogProps> = ({
  rule,
  onConfirm,
  onCancel,
  themeColor = 'blue',
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    message: string;
    executionCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await onConfirm();
      setExecutionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rule');
      console.error('Retroactive execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    if (executionResult) {
      // If execution completed, close the dialog
      onCancel();
    } else if (!isExecuting) {
      // Only allow cancel if not executing
      onCancel();
    }
  };

  const getThemeColors = () => {
    const colors: Record<string, { primary: string; hover: string; light: string }> = {
      blue: { primary: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-50' },
      green: { primary: 'bg-green-500', hover: 'hover:bg-green-600', light: 'bg-green-50' },
      purple: { primary: 'bg-purple-500', hover: 'hover:bg-purple-600', light: 'bg-purple-50' },
      red: { primary: 'bg-red-500', hover: 'hover:bg-red-600', light: 'bg-red-50' },
      orange: { primary: 'bg-orange-500', hover: 'hover:bg-orange-600', light: 'bg-orange-50' },
      teal: { primary: 'bg-teal-500', hover: 'hover:bg-teal-600', light: 'bg-teal-50' },
      indigo: { primary: 'bg-indigo-500', hover: 'hover:bg-indigo-600', light: 'bg-indigo-50' },
      pink: { primary: 'bg-pink-500', hover: 'hover:bg-pink-600', light: 'bg-pink-50' },
    };
    return colors[themeColor] || colors.blue;
  };

  const colors = getThemeColors();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retroactive-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className={`${colors.primary} text-white px-6 py-4 rounded-t-lg`}>
          <h2 id="retroactive-dialog-title" className="text-xl font-semibold">
            {executionResult ? 'Execution Complete' : 'Run Rule Now'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {!executionResult && !error && (
            <>
              <p className="text-gray-700 mb-4">
                Are you sure you want to run this rule on all existing events?
              </p>

              <div className={`${colors.light} border border-${themeColor}-200 rounded-lg p-4 mb-4`}>
                <h3 className="font-semibold text-gray-900 mb-2">Rule Details:</h3>
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {rule.name}
                </p>
                {rule.description && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Description:</strong> {rule.description}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Trigger:</strong> {rule.triggerType.replace('event.', '')}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Conditions:</strong> {rule.conditions.length} condition(s)
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Actions:</strong> {rule.actions.length} action(s)
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-semibold mb-1">Important:</p>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>This will evaluate all your existing events</li>
                      <li>Matching events will have the rule's actions applied</li>
                      <li>This operation cannot be undone</li>
                      <li>Large event sets may take some time to process</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {isExecuting && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
              <p className="text-gray-700 font-semibold">Executing rule on your events...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          )}

          {executionResult && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-green-600 text-3xl">✓</span>
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">Execution Complete</p>
              <p className="text-gray-700">
                {executionResult.message}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Processed {executionResult.executionCount} event(s)
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-2">✗</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-semibold mb-1">Execution Failed</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          {!executionResult && !isExecuting && (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                disabled={isExecuting}
                aria-label="Cancel retroactive execution"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white ${colors.primary} ${colors.hover} rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                disabled={isExecuting}
                aria-label="Confirm retroactive execution"
              >
                Run Now
              </button>
            </>
          )}

          {(executionResult || error) && (
            <button
              onClick={handleClose}
              className={`px-4 py-2 text-white ${colors.primary} ${colors.hover} rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              aria-label="Close dialog"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
