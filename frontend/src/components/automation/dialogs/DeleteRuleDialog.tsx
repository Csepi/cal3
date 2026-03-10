import React, { useState } from 'react';
import type { AutomationRuleDetailDto, AutomationRuleDto } from '../../../types/Automation';

import { tStatic } from '../../../i18n';

interface DeleteRuleDialogProps {
  rule: AutomationRuleDetailDto | AutomationRuleDto;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  themeColor?: string;
}

export const DeleteRuleDialog: React.FC<DeleteRuleDialogProps> = ({
  rule,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      // Don't close here - let parent handle it after successful deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      console.error('Delete rule error:', err);
      setIsDeleting(false);
    }
  };

  const hasExecutionHistory = rule.executionCount && rule.executionCount > 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="bg-red-500 text-white px-6 py-4 rounded-t-lg">
          <h2 id="delete-dialog-title" className="text-xl font-semibold">
            {tStatic('common:auto.frontend.k67cf81aaa91f')}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {tStatic('common:auto.frontend.k2aaec934133c')}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{tStatic('common:auto.frontend.k5a01491f1467')}</h3>
            <p className="text-sm text-gray-700">
              <strong>{tStatic('common:auto.frontend.k71dd2eff9b4d')}</strong> {rule.name}
            </p>
            {'description' in rule && rule.description && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>{tStatic('common:auto.frontend.k9b6f3f076617')}</strong> {rule.description}
              </p>
            )}
            <p className="text-sm text-gray-700 mt-1">
              <strong>{tStatic('common:auto.frontend.k11dc9e195292')}</strong>{' '}
              <span className={rule.isEnabled ? 'text-green-600' : 'text-gray-500'}>
                {rule.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            {hasExecutionHistory && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>{tStatic('common:auto.frontend.k1e90bd5e0a96')}</strong> {rule.executionCount}
              </p>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-semibold mb-1">{tStatic('common:auto.frontend.k3217f290369e')}</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>{tStatic('common:auto.frontend.k4f89cfd1e5d5')}</li>
                  {hasExecutionHistory && (
                    <li>{tStatic('common:auto.frontend.kf6a329889ca4')}{rule.executionCount} {tStatic('common:auto.frontend.k52fe07a1599d')}</li>
                  )}
                  <li>{tStatic('common:auto.frontend.ke00f42cd83ed')}</li>
                  <li>{tStatic('common:auto.frontend.k0d1d9908264f')}</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-2">✗</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-semibold mb-1">{tStatic('common:auto.frontend.k305db47a6c37')}</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
            aria-label={tStatic('common:auto.frontend.k45b0c39d53d2')}
          >
            {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
            aria-label={tStatic('common:auto.frontend.ke53e762e5697')}
          >
            {isDeleting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {tStatic('common:auto.frontend.ke16cac651b17')}</span>
            ) : (
              'Delete Rule'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
