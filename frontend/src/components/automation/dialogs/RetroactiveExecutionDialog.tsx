import React, { useState } from 'react';
import type { AutomationRuleDetailDto } from '../../../types/Automation';

import { tStatic } from '../../../i18n';

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
                {tStatic('common:auto.frontend.kcba3a2be4f7b')}</p>

              <div className={`${colors.light} border border-${themeColor}-200 rounded-lg p-4 mb-4`}>
                <h3 className="font-semibold text-gray-900 mb-2">{tStatic('common:auto.frontend.k5a01491f1467')}</h3>
                <p className="text-sm text-gray-700">
                  <strong>{tStatic('common:auto.frontend.k71dd2eff9b4d')}</strong> {rule.name}
                </p>
                {rule.description && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>{tStatic('common:auto.frontend.k9b6f3f076617')}</strong> {rule.description}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-1">
                  <strong>{tStatic('common:auto.frontend.k0e84bec6113d')}</strong> {rule.triggerType.replace('event.', '')}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>{tStatic('common:auto.frontend.kcdb6217a0174')}</strong> {rule.conditions.length} {tStatic('common:auto.frontend.k20ef46cbe17a')}</p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>{tStatic('common:auto.frontend.k3894e58bd387')}</strong> {rule.actions.length} {tStatic('common:auto.frontend.k493861a9c510')}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-semibold mb-1">{tStatic('common:auto.frontend.k18dd7e894b3d')}</p>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>{tStatic('common:auto.frontend.k409eaf89c76f')}</li>
                      <li>{tStatic('common:auto.frontend.kbdb4e3175a04')}</li>
                      <li>{tStatic('common:auto.frontend.kc4d1f1ce96ff')}</li>
                      <li>{tStatic('common:auto.frontend.k9569a385aced')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {isExecuting && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
              <p className="text-gray-700 font-semibold">{tStatic('common:auto.frontend.k9bcbe50664bf')}</p>
              <p className="text-gray-500 text-sm mt-2">{tStatic('common:auto.frontend.k639108a3064f')}</p>
            </div>
          )}

          {executionResult && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-green-600 text-3xl">✓</span>
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">{tStatic('common:auto.frontend.kabd0e26a9f69')}</p>
              <p className="text-gray-700">
                {executionResult.message}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {tStatic('common:auto.frontend.k8291b246a971')}{executionResult.executionCount} {tStatic('common:auto.frontend.k0ac9d9800cf8')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-2">✗</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-semibold mb-1">{tStatic('common:auto.frontend.kb18f0e3b50db')}</p>
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
                aria-label={tStatic('common:auto.frontend.k7e5a87e8c48f')}
              >
                {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white ${colors.primary} ${colors.hover} rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                disabled={isExecuting}
                aria-label={tStatic('common:auto.frontend.kaf89d8963b77')}
              >
                {tStatic('common:auto.frontend.k4ee85a626ff6')}</button>
            </>
          )}

          {(executionResult || error) && (
            <button
              onClick={handleClose}
              className={`px-4 py-2 text-white ${colors.primary} ${colors.hover} rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              aria-label={tStatic('common:auto.frontend.k7b29020292a4')}
            >
              {tStatic('common:auto.frontend.kbbfa773e5a63')}</button>
          )}
        </div>
      </div>
    </div>
  );
};
