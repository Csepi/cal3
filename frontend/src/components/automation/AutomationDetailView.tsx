import React, { useState } from 'react';
import { AutomationRuleDetailDto } from '../../types/Automation';
import { useAutomationMetadata } from '../../hooks/useAutomationMetadata';
import { formatRelativeTime, executeRuleNow } from '../../services/automationService';
import { AuditLogViewer } from './AuditLogViewer';
import { AutomationRuleModal } from './AutomationRuleModal';
import { RetroactiveExecutionDialog } from './dialogs/RetroactiveExecutionDialog';
import { DeleteRuleDialog } from './dialogs/DeleteRuleDialog';

interface AutomationDetailViewProps {
  rule: AutomationRuleDetailDto;
  onBack: () => void;
  onUpdate: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  themeColor: string;
}

export const AutomationDetailView: React.FC<AutomationDetailViewProps> = ({
  rule,
  onBack,
  onUpdate,
  onToggle,
  onDelete,
  themeColor,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRunNowDialog, setShowRunNowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { getTriggerTypeLabel, getConditionFieldLabel, getOperatorLabel, getActionTypeLabel } =
    useAutomationMetadata();

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    setShowEditModal(false);
    onUpdate();
  };

  const handleRunNow = () => {
    setShowRunNowDialog(true);
  };

  const handleRunNowConfirm = async () => {
    const result = await executeRuleNow(rule.id);
    onUpdate(); // Refresh to update execution count
    return result;
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    await onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="Back to list"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{rule.name}</h2>
              {rule.description && (
                <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Switch */}
            <button
              onClick={() => onToggle(!rule.isEnabled)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                rule.isEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              title={rule.isEnabled ? 'Enabled' : 'Disabled'}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  rule.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            {/* Run Now Button */}
            <button
              onClick={handleRunNow}
              style={{ backgroundColor: themeColor }}
              className="px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              ▶️ Run Now
            </button>

            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              ✏️ Edit
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex gap-6 text-sm text-gray-600">
          <div>
            <strong>Created:</strong> {new Date(rule.createdAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Updated:</strong> {formatRelativeTime(rule.updatedAt)}
          </div>
          <div>
            <strong>Executions:</strong> {rule.executionCount}
          </div>
          <div>
            <strong>Last run:</strong> {formatRelativeTime(rule.lastExecutedAt)}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Execution History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-6">
            {/* Status Badge */}
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  rule.isEnabled
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {rule.isEnabled ? '✓ Enabled' : '○ Disabled'}
              </span>
            </div>

            {/* Trigger */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span> Trigger
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Type:</strong> {getTriggerTypeLabel(rule.triggerType)}
                </p>
                {rule.triggerConfig && Object.keys(rule.triggerConfig).length > 0 && (
                  <div>
                    <strong className="text-sm">Configuration:</strong>
                    <pre className="mt-1 text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(rule.triggerConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>✅</span> Conditions ({rule.conditions.length})
              </h3>
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Logic: {rule.conditionLogic === 'AND' ? 'All must be true' : 'Any can be true'}
                </span>
              </div>
              <div className="space-y-2">
                {rule.conditions.map((condition, index) => (
                  <div key={condition.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-sm">
                      <strong>{getConditionFieldLabel(condition.field)}</strong>{' '}
                      {getOperatorLabel(condition.operator)}{' '}
                      {condition.value && (
                        <code className="bg-white px-2 py-1 rounded text-xs">{condition.value}</code>
                      )}
                    </div>
                    {index < rule.conditions.length - 1 && (
                      <div className="mt-2 text-xs font-medium text-gray-600">
                        {condition.logicOperator}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚡</span> Actions ({rule.actions.length})
              </h3>
              <div className="space-y-2">
                {rule.actions.map((action, index) => (
                  <div key={action.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getActionTypeLabel(action.actionType)}</p>
                        {action.actionConfig && Object.keys(action.actionConfig).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                              View configuration
                            </summary>
                            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                              {JSON.stringify(action.actionConfig, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl">
            <AuditLogViewer ruleId={rule.id} themeColor={themeColor} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <AutomationRuleModal
          rule={rule}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          themeColor={themeColor}
        />
      )}

      {/* Run Now Dialog */}
      {showRunNowDialog && (
        <RetroactiveExecutionDialog
          rule={rule}
          onConfirm={handleRunNowConfirm}
          onCancel={() => setShowRunNowDialog(false)}
          themeColor={themeColor}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteRuleDialog
          rule={rule}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};
