import React from 'react';
import {
  ConditionLogic,
  ConditionLogicOperator,
} from '../../../types/Automation';
import type { ConditionFormData } from '../../../types/Automation';
import { ConditionRow } from './ConditionRow';

interface ConditionBuilderProps {
  conditions: ConditionFormData[];
  conditionLogic: ConditionLogic;
  onConditionsChange: (conditions: ConditionFormData[]) => void;
  onLogicChange: (logic: ConditionLogic) => void;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  conditionLogic,
  onConditionsChange,
  onLogicChange,
}) => {
  const handleAddCondition = () => {
    const newCondition: ConditionFormData = {
      tempId: `cond-${Date.now()}-${Math.random()}`,
      field: null,
      operator: null,
      value: '',
      logicOperator: ConditionLogicOperator.AND,
      order: conditions.length,
    };
    onConditionsChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<ConditionFormData>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onConditionsChange(updated);
  };

  const handleDeleteCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    onConditionsChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header with Logic Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Match:</label>
          <select
            value={conditionLogic}
            onChange={(e) => onLogicChange(e.target.value as ConditionLogic)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={ConditionLogic.AND}>All conditions (AND)</option>
            <option value={ConditionLogic.OR}>Any condition (OR)</option>
          </select>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          {conditions.length === 0 ? (
            <>
              ℹ️ <strong>No conditions</strong> - the rule will trigger for all events matching the trigger.
            </>
          ) : conditionLogic === ConditionLogic.AND ? (
            <>
              ✓ <strong>All conditions</strong> must be true for the rule to trigger actions.
            </>
          ) : (
            <>
              ✓ <strong>At least one condition</strong> must be true for the rule to trigger
              actions.
            </>
          )}
        </p>
      </div>

      {/* Condition Rows */}
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={condition.tempId}>
            <ConditionRow
              condition={condition}
              onUpdate={(updates) => handleUpdateCondition(index, updates)}
              onDelete={() => handleDeleteCondition(index)}
              canDelete={conditions.length > 1}
            />

            {/* Logic Operator Between Conditions */}
            {index < conditions.length - 1 && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm font-medium text-gray-700">
                  {conditionLogic === ConditionLogic.AND ? 'AND' : 'OR'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleAddCondition}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors flex items-center gap-2"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Condition
        </button>
      </div>

      {/* Validation Warning */}
      {conditions.length > 10 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Maximum of 10 conditions allowed. Please remove some conditions.
          </p>
        </div>
      )}

      {/* Helper Text */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Conditions are optional. If no conditions are specified, the rule will apply to all events that match the trigger. Add conditions to filter specific events.
        </p>
      </div>
    </div>
  );
};
