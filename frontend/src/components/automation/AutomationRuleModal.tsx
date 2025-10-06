import React, { useState, useEffect } from 'react';
import {
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  TriggerType,
  ConditionLogic,
  ConditionField,
  ConditionOperator,
  ConditionLogicOperator,
  ActionType,
  ConditionFormData,
  ActionFormData,
} from '../../types/Automation';
import { useAutomationMetadata } from '../../hooks/useAutomationMetadata';

interface AutomationRuleModalProps {
  rule?: AutomationRuleDetailDto;
  onClose: () => void;
  onSave: (rule: CreateAutomationRuleDto | UpdateAutomationRuleDto) => Promise<void>;
  themeColor: string;
}

export function AutomationRuleModal({
  rule,
  onClose,
  onSave,
  themeColor,
}: AutomationRuleModalProps) {
  const { triggerTypes, conditionFields, actionTypes, getOperatorsForField } =
    useAutomationMetadata();

  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [triggerType, setTriggerType] = useState<TriggerType | ''>(
    rule?.triggerType || ''
  );
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(
    rule?.triggerConfig || {}
  );
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>(
    rule?.conditionLogic || ConditionLogic.AND
  );
  const [conditions, setConditions] = useState<ConditionFormData[]>([]);
  const [actions, setActions] = useState<ActionFormData[]>([]);
  const [isEnabled, setIsEnabled] = useState(rule?.isEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize conditions and actions from rule
  useEffect(() => {
    if (rule?.conditions) {
      setConditions(
        rule.conditions.map((c, i) => ({
          tempId: `cond-${i}`,
          field: c.field,
          operator: c.operator,
          value: c.value,
          groupId: c.groupId || undefined,
          logicOperator: c.logicOperator,
          order: c.order,
        }))
      );
    } else {
      // Start with one empty condition
      setConditions([
        {
          tempId: `cond-${Date.now()}`,
          field: null,
          operator: null,
          value: '',
          logicOperator: ConditionLogicOperator.AND,
          order: 0,
        },
      ]);
    }

    if (rule?.actions) {
      setActions(
        rule.actions.map((a, i) => ({
          tempId: `action-${i}`,
          actionType: a.actionType,
          actionConfig: a.actionConfig,
          order: a.order,
        }))
      );
    } else {
      // Start with one empty action
      setActions([
        {
          tempId: `action-${Date.now()}`,
          actionType: null,
          actionConfig: {},
          order: 0,
        },
      ]);
    }
  }, [rule]);

  // Add condition
  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        tempId: `cond-${Date.now()}`,
        field: null,
        operator: null,
        value: '',
        logicOperator: ConditionLogicOperator.AND,
        order: conditions.length,
      },
    ]);
  };

  // Remove condition
  const handleRemoveCondition = (tempId: string) => {
    setConditions(conditions.filter((c) => c.tempId !== tempId));
  };

  // Update condition
  const handleUpdateCondition = (
    tempId: string,
    updates: Partial<ConditionFormData>
  ) => {
    setConditions(
      conditions.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c))
    );
  };

  // Add action
  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        tempId: `action-${Date.now()}`,
        actionType: null,
        actionConfig: {},
        order: actions.length,
      },
    ]);
  };

  // Remove action
  const handleRemoveAction = (tempId: string) => {
    setActions(actions.filter((a) => a.tempId !== tempId));
  };

  // Update action
  const handleUpdateAction = (tempId: string, updates: Partial<ActionFormData>) => {
    setActions(
      actions.map((a) => (a.tempId === tempId ? { ...a, ...updates } : a))
    );
  };

  // Handle save
  const handleSave = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    if (!triggerType) {
      setError('Please select a trigger type');
      return;
    }

    // Validate conditions
    const validConditions = conditions.filter(
      (c) => c.field && c.operator && (c.value || !requiresValue(c.operator))
    );

    if (validConditions.length === 0) {
      setError('At least one valid condition is required');
      return;
    }

    // Validate actions
    const validActions = actions.filter((a) => a.actionType);
    if (validActions.length === 0) {
      setError('At least one action is required');
      return;
    }

    setIsSaving(true);

    try {
      const ruleData: CreateAutomationRuleDto | UpdateAutomationRuleDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        ...(rule ? {} : { triggerType: triggerType as TriggerType }),
        triggerConfig:
          Object.keys(triggerConfig).length > 0 ? triggerConfig : undefined,
        isEnabled,
        conditionLogic,
        conditions: validConditions.map((c) => ({
          field: c.field!,
          operator: c.operator!,
          value: c.value,
          groupId: c.groupId,
          logicOperator: c.logicOperator,
          order: c.order,
        })),
        actions: validActions.map((a) => ({
          actionType: a.actionType!,
          actionConfig: a.actionConfig,
          order: a.order,
        })),
      };

      await onSave(ruleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if operator requires a value
  const requiresValue = (operator: ConditionOperator | null): boolean => {
    if (!operator) return true;
    return ![
      ConditionOperator.IS_EMPTY,
      ConditionOperator.IS_NOT_EMPTY,
      ConditionOperator.IS_TRUE,
      ConditionOperator.IS_FALSE,
    ].includes(operator);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Color work meetings blue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={1000}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
                Enable this rule immediately
              </label>
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Trigger</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When should this rule run? *
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                disabled={!!rule}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select trigger...</option>
                {triggerTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label} - {t.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Trigger Config (simplified) */}
            {triggerType === TriggerType.EVENT_STARTS_IN && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minutes before event starts
                </label>
                <input
                  type="number"
                  value={triggerConfig.minutes || 30}
                  onChange={(e) =>
                    setTriggerConfig({ minutes: parseInt(e.target.value) || 30 })
                  }
                  min={1}
                  max={10080}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
              <select
                value={conditionLogic}
                onChange={(e) => setConditionLogic(e.target.value as ConditionLogic)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={ConditionLogic.AND}>All conditions must match (AND)</option>
                <option value={ConditionLogic.OR}>Any condition can match (OR)</option>
              </select>
            </div>

            {conditions.map((condition, index) => (
              <div
                key={condition.tempId}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Field */}
                    <select
                      value={condition.field || ''}
                      onChange={(e) =>
                        handleUpdateCondition(condition.tempId, {
                          field: e.target.value as ConditionField,
                          operator: null,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field...</option>
                      {conditionFields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={condition.operator || ''}
                      onChange={(e) =>
                        handleUpdateCondition(condition.tempId, {
                          operator: e.target.value as ConditionOperator,
                        })
                      }
                      disabled={!condition.field}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select operator...</option>
                      {condition.field &&
                        getOperatorsForField(condition.field).map((op) => (
                          <option key={op} value={op}>
                            {op.replace(/_/g, ' ')}
                          </option>
                        ))}
                    </select>

                    {/* Value */}
                    {condition.operator && requiresValue(condition.operator) && (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) =>
                          handleUpdateCondition(condition.tempId, {
                            value: e.target.value,
                          })
                        }
                        placeholder="Value..."
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Remove button */}
                  {conditions.length > 1 && (
                    <button
                      onClick={() => handleRemoveCondition(condition.tempId)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove condition"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={handleAddCondition}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Condition
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions</h3>

            {actions.map((action, index) => (
              <div
                key={action.tempId}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    {/* Action Type */}
                    <select
                      value={action.actionType || ''}
                      onChange={(e) =>
                        handleUpdateAction(action.tempId, {
                          actionType: e.target.value as ActionType,
                          actionConfig: {},
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select action...</option>
                      {actionTypes.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.icon} {a.label}
                        </option>
                      ))}
                    </select>

                    {/* Action Config (simplified - just for SET_EVENT_COLOR) */}
                    {action.actionType === ActionType.SET_EVENT_COLOR && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="color"
                          value={action.actionConfig.color || '#3b82f6'}
                          onChange={(e) =>
                            handleUpdateAction(action.tempId, {
                              actionConfig: { color: e.target.value },
                            })
                          }
                          className="w-full h-10 border border-gray-300 rounded"
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  {actions.length > 1 && (
                    <button
                      onClick={() => handleRemoveAction(action.tempId)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove action"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={handleAddAction}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Action
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}
