import React from 'react';
import type {
  ActionType,
  ConditionField,
  ConditionOperator,
} from '../../types/Automation';
import { useSingleAuditLog } from '../../hooks/useAuditLogs';
import { useAutomationMetadata } from '../../hooks/useAutomationMetadata';
import { getStatusColor } from '../../services/automationService';

import { tStatic } from '../../i18n';

interface AuditLogDetailModalProps {
  logId: number;
  ruleId?: number;
  onClose: () => void;
  themeColor?: string;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  logId,
  ruleId,
  onClose,
  themeColor = '#3b82f6',
}) => {
  const { log, isLoading, error } = useSingleAuditLog({ logId, ruleId });
  const { getTriggerTypeLabel, getConditionFieldLabel, getOperatorLabel, getActionTypeLabel } =
    useAutomationMetadata();

  if (!log && !isLoading && !error) {
    return null;
  }

  const getStatusBadge = () => {
    if (!log) return null;

    const color = getStatusColor(log.status);
    const bgColors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      success: '✓',
      partial_success: '◐',
      failure: '✗',
      skipped: '⊘',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${bgColors[color]}`}>
        {icons[log.status]} {log.status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{tStatic('common:auto.frontend.kaf5e075775bb')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div
                  className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
                  style={{ borderTopColor: themeColor }}
                />
                <p className="mt-3 text-sm text-gray-600">{tStatic('common:auto.frontend.kcda75660f888')}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Log Details */}
          {log && (
            <>
              {/* Execution Summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tStatic('common:auto.frontend.kbae7d5be7082')}</h3>
                    <div className="mt-1">{getStatusBadge()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{tStatic('common:auto.frontend.k189800ade71b')}</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(log.executedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{tStatic('common:auto.frontend.k1370004da76f')}</p>
                    <p className="text-sm text-gray-900 mt-1">{log.executionTimeMs}{tStatic('common:auto.frontend.k26cc3217be64')}</p>
                  </div>
                </div>

                {log.executedByUsername && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">{tStatic('common:auto.frontend.k9838a52fad53')}</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {log.executedByUsername}
                      {log.executedByUserId && (
                        <span className="text-gray-500"> {tStatic('common:auto.frontend.k4c660d947eec')}{log.executedByUserId})</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Trigger Information */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className="font-semibold text-gray-900">{tStatic('common:auto.frontend.kd3f06a581b2b')}</h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>{tStatic('common:auto.frontend.kee3fb11d05c9')}</strong> {getTriggerTypeLabel(log.triggerType)}
                  </p>
                  {log.eventTitle && (
                    <p className="text-sm mt-2">
                      <strong>{tStatic('common:auto.frontend.ke1d1873098d3')}</strong> {log.eventTitle}
                      {log.eventId && <span className="text-gray-600"> {tStatic('common:auto.frontend.k4c660d947eec')}{log.eventId})</span>}
                    </p>
                  )}
                  {log.triggerContext && Object.keys(log.triggerContext).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                        {tStatic('common:auto.frontend.k6369c79c8b45')}</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border border-blue-200 overflow-x-auto">
                        {JSON.stringify(log.triggerContext, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              {/* Conditions Evaluation */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">✅</span>
                  <h3 className="font-semibold text-gray-900">
                    {tStatic('common:auto.frontend.k5f838a2688fd')}{log.conditionsResult.evaluations.filter((e) => e.passed).length}/
                    {log.conditionsResult.evaluations.length} {tStatic('common:auto.frontend.k1b3bc02a3f22')}</h3>
                </div>
                <div className="space-y-2">
                  {log.conditionsResult.evaluations.map((evaluation, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        evaluation.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {evaluation.passed ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {getConditionFieldLabel(
                              evaluation.field as ConditionField,
                            )}{' '}
                            {getOperatorLabel(
                              evaluation.operator as ConditionOperator,
                            )}
                          </p>
                          <div className="mt-1 text-xs space-y-1">
                            <p>
                              <strong>{tStatic('common:auto.frontend.k74576fed5c59')}</strong>{' '}
                              <code className="bg-white px-1 py-0.5 rounded">
                                {evaluation.expectedValue}
                              </code>
                            </p>
                            <p>
                              <strong>{tStatic('common:auto.frontend.k102e577fa021')}</strong>{' '}
                              <code className="bg-white px-1 py-0.5 rounded">
                                {JSON.stringify(evaluation.actualValue)}
                              </code>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {log.conditionsResult.logicExpression && (
                  <p className="mt-2 text-xs text-gray-600">
                    {tStatic('common:auto.frontend.k76a492f90d95')}{log.conditionsResult.logicExpression}
                  </p>
                )}
                <div className={`mt-3 p-3 rounded-lg border ${
                  log.conditionsResult.passed
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  <p className="text-sm font-medium">
                    {log.conditionsResult.passed
                      ? '✓ All conditions passed - Actions were executed'
                      : '✗ Conditions not met - Actions were skipped'}
                  </p>
                </div>
              </div>

              {/* Actions Results */}
              {log.actionResults && log.actionResults.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⚡</span>
                    <h3 className="font-semibold text-gray-900">
                      {tStatic('common:auto.frontend.kb0889f263e2e')}{log.actionResults.filter((a) => a.success).length}/
                      {log.actionResults.length} {tStatic('common:auto.frontend.k1d0f31106247')}</h3>
                  </div>
                  <div className="space-y-2">
                    {log.actionResults.map((action, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          action.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{action.success ? '✓' : '✗'}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {getActionTypeLabel(action.actionType as ActionType)}
                            </p>
                            {action.error && (
                              <p className="mt-1 text-xs text-red-700">
                                <strong>{tStatic('common:auto.frontend.k787aa1617c37')}</strong> {action.error}
                              </p>
                            )}
                            {action.data && Object.keys(action.data).length > 0 && (
                              <details className="mt-1">
                                <summary className="text-xs font-medium cursor-pointer hover:text-blue-600">
                                  {tStatic('common:auto.frontend.kebb835d8fea1')}</summary>
                                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(action.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {log.errorMessage && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900">{tStatic('common:auto.frontend.k7f2f6a15cf8d')}</p>
                    <p className="text-sm text-red-700 mt-1">{log.errorMessage}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tStatic('common:auto.frontend.kbbfa773e5a63')}</button>
        </div>
      </div>
    </div>
  );
};
