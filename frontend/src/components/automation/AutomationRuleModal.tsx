import React, { useState, useEffect } from 'react';
import {
  TriggerType,
  ConditionLogic,
  ConditionLogicOperator,
} from '../../types/Automation';
import type {
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  ConditionFormData,
  ActionFormData,
} from '../../types/Automation';
import { TriggerSelector } from './builders/TriggerSelector';
import { ConditionBuilder } from './builders/ConditionBuilder';
import { ActionBuilder } from './builders/ActionBuilder';
import { WebhookConfiguration } from './WebhookConfiguration';
import { automationService } from '../../services/automationService';

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
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [triggerType, setTriggerType] = useState<TriggerType | null>(
    rule?.triggerType || null
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
  const [webhookToken, setWebhookToken] = useState<string | null>(rule?.webhookToken || null);

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
      // Start with no conditions (they're optional)
      setConditions([]);
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

  // Validate form
  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Rule name is required';
    }

    if (!triggerType) {
      return 'Please select a trigger type';
    }

    // Validate conditions (now optional)
    const validConditions = conditions.filter(
      (c) => c.field && c.operator && (c.value || !requiresValue(c.operator))
    );

    if (conditions.length > 10) {
      return 'Maximum of 10 conditions allowed';
    }

    // Validate actions
    const validActions = actions.filter((a) => a.actionType);
    if (validActions.length === 0) {
      return 'At least one action is required';
    }

    if (actions.length > 5) {
      return 'Maximum of 5 actions allowed';
    }

    return null;
  };

  // Check if operator requires a value
  const requiresValue = (operator: any): boolean => {
    const noValueOperators = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];
    return !noValueOperators.includes(operator);
  };

  // Handle webhook token regeneration
  const handleRegenerateWebhookToken = async (): Promise<string> => {
    if (!rule?.id) {
      throw new Error('Cannot regenerate token for unsaved rule');
    }

    try {
      const response = await automationService.regenerateWebhookToken(rule.id);
      setWebhookToken(response.webhookToken);
      return response.webhookToken;
    } catch (error) {
      console.error('Failed to regenerate webhook token:', error);
      throw error;
    }
  };

  // Handle save
  const handleSave = async () => {
    setError(null);

    console.log('=== handleSave called ===');
    console.log('Editing rule:', rule ? `ID ${rule.id}` : 'NEW');

    const validationError = validate();
    if (validationError) {
      console.log('Validation error:', validationError);
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const validConditions = conditions.filter(
        (c) => c.field && c.operator && (c.value || !requiresValue(c.operator))
      );

      const validActions = actions.filter((a) => a.actionType);

      const ruleData: CreateAutomationRuleDto | UpdateAutomationRuleDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        ...(rule ? {} : { triggerType: triggerType as TriggerType }),
        triggerConfig:
          Object.keys(triggerConfig).length > 0 ? triggerConfig : undefined,
        isEnabled,
        conditionLogic,
        ...(validConditions.length > 0 ? {
          conditions: validConditions.map((c) => ({
            field: c.field!,
            operator: c.operator!,
            value: c.value,
            groupId: c.groupId,
            logicOperator: c.logicOperator,
            order: c.order,
          }))
        } : {}),
        actions: validActions.map((a) => ({
          actionType: a.actionType!,
          actionConfig: a.actionConfig,
          order: a.order,
        })),
      };

      console.log('Rule data to save:', JSON.stringify(ruleData, null, 2));
      await onSave(ruleData);
      console.log('Save successful!');
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info Section */}
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
              <p className="mt-1 text-xs text-gray-500">{name.length}/200 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this rule does"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500">{description.length}/1000 characters</p>
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

          {/* Trigger Section */}
          <div className="border-t border-gray-200 pt-6">
            <TriggerSelector
              selectedTrigger={triggerType}
              triggerConfig={triggerConfig}
              onTriggerChange={setTriggerType}
              onConfigChange={setTriggerConfig}
              disabled={!!rule}
            />

            {/* Webhook Configuration (shows only for webhook triggers) */}
            <WebhookConfiguration
              ruleId={rule?.id || null}
              triggerType={triggerType}
              webhookToken={webhookToken}
              onRegenerateToken={handleRegenerateWebhookToken}
            />
          </div>

          {/* Conditions Section */}
          <div className="border-t border-gray-200 pt-6">
            <ConditionBuilder
              conditions={conditions}
              conditionLogic={conditionLogic}
              onConditionsChange={setConditions}
              onLogicChange={setConditionLogic}
            />
          </div>

          {/* Actions Section */}
          <div className="border-t border-gray-200 pt-6">
            <ActionBuilder actions={actions} onActionsChange={setActions} triggerType={triggerType} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {rule ? (
              <>Created: {new Date(rule.createdAt).toLocaleDateString()}</>
            ) : (
              <>* Required fields</>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
