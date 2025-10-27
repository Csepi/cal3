import React from 'react';
import {
  ConditionField,
  ConditionOperator,
} from '../../../types/Automation';
import type { ConditionFormData } from '../../../types/Automation';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';

interface ConditionRowProps {
  condition: ConditionFormData;
  onUpdate: (updates: Partial<ConditionFormData>) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const ConditionRow: React.FC<ConditionRowProps> = ({
  condition,
  onUpdate,
  onDelete,
  canDelete,
}) => {
  const { conditionFields, getOperatorsForField } = useAutomationMetadata();

  const selectedField = conditionFields.find((f) => f.value === condition.field);
  const availableOperators = condition.field ? getOperatorsForField(condition.field) : [];

  const requiresValue = (operator: ConditionOperator | null): boolean => {
    if (!operator) return true;
    return ![
      ConditionOperator.IS_EMPTY,
      ConditionOperator.IS_NOT_EMPTY,
      ConditionOperator.IS_TRUE,
      ConditionOperator.IS_FALSE,
    ].includes(operator);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value as ConditionField;
    onUpdate({ field: newField, operator: null, value: '' });
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as ConditionOperator;
    onUpdate({ operator: newOperator });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdate({ value: e.target.value });
  };

  const getValueInputType = (): 'text' | 'number' | 'color' => {
    if (!selectedField) return 'text';
    if (selectedField.dataType === 'number') return 'number';
    if (condition.field === ConditionField.EVENT_COLOR) return 'color';
    return 'text';
  };

  const getPlaceholderText = (): string => {
    if (!condition.field) return 'Select a field first...';
    if (!condition.operator) return 'Select an operator...';

    if (condition.field === ConditionField.WEBHOOK_DATA) {
      return 'e.g., webhook.data.customer_id or webhook.data.order.status';
    }

    switch (selectedField?.dataType) {
      case 'number':
        return 'e.g., 60';
      case 'boolean':
        return 'true or false';
      case 'array':
        return 'Comma-separated values';
      default:
        if (condition.field === ConditionField.EVENT_COLOR) {
          return '#3b82f6';
        }
        return 'Enter value...';
    }
  };

  return (
    <div className="flex items-start gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Field Selector */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
        <select
          value={condition.field || ''}
          onChange={handleFieldChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Select field...</option>
          {conditionFields.map((field) => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>
        {selectedField && (
          <p className="mt-1 text-xs text-gray-500">Type: {selectedField.dataType}</p>
        )}
      </div>

      {/* Operator Selector */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
        <select
          value={condition.operator || ''}
          onChange={handleOperatorChange}
          disabled={!condition.field}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        >
          <option value="">Select operator...</option>
          {availableOperators.map((op) => (
            <option key={op} value={op}>
              {op.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      {condition.operator && requiresValue(condition.operator) && (
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
          {selectedField?.dataType === 'string' &&
          condition.value.length > 50 ? (
            <textarea
              value={condition.value}
              onChange={handleValueChange}
              placeholder={getPlaceholderText()}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          ) : (
            <input
              type={getValueInputType()}
              value={condition.value}
              onChange={handleValueChange}
              placeholder={getPlaceholderText()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
          {condition.field === ConditionField.EVENT_DURATION && (
            <p className="mt-1 text-xs text-gray-500">Duration in minutes</p>
          )}
          {condition.field === ConditionField.WEBHOOK_DATA && (
            <p className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              💡 Use dot notation to access nested JSON fields (e.g., webhook.data.customer_id, webhook.data.metadata.priority)
            </p>
          )}
          {condition.operator === ConditionOperator.IN_LIST && (
            <p className="mt-1 text-xs text-gray-500">Separate multiple values with commas</p>
          )}
        </div>
      )}

      {/* Delete Button */}
      {canDelete && (
        <div className="flex-shrink-0 pt-6">
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Remove condition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
