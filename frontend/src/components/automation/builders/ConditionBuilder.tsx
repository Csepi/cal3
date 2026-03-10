import React from 'react';
import {
  ConditionLogic,
  ConditionLogicOperator,
} from '../../../types/Automation';
import type { ConditionFormData } from '../../../types/Automation';
import { ConditionRow } from './ConditionRow';

import { tStatic } from '../../../i18n';

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
        <h3 className="text-lg font-semibold text-gray-900">{tStatic('common:auto.frontend.k5506eb6161a0')}</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{tStatic('common:auto.frontend.kad796922dcad')}</label>
          <select
            value={conditionLogic}
            onChange={(e) => onLogicChange(e.target.value as ConditionLogic)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={ConditionLogic.AND}>{tStatic('common:auto.frontend.k3b8b09c597b0')}</option>
            <option value={ConditionLogic.OR}>{tStatic('common:auto.frontend.k901f8783a407')}</option>
          </select>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          {conditions.length === 0 ? (
            <>
              ℹ️ <strong>{tStatic('common:auto.frontend.k4e5dea9d96de')}</strong> {tStatic('common:auto.frontend.ke68dd07119f2')}</>
          ) : conditionLogic === ConditionLogic.AND ? (
            <>
              ✓ <strong>{tStatic('common:auto.frontend.k771ea079b86f')}</strong> {tStatic('common:auto.frontend.kf721e9c23734')}</>
          ) : (
            <>
              ✓ <strong>{tStatic('common:auto.frontend.k67944f44550c')}</strong> {tStatic('common:auto.frontend.kf721e9c23734')}</>
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
          {tStatic('common:auto.frontend.k4803c2377e28')}</button>
      </div>

      {/* Validation Warning */}
      {conditions.length > 10 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {tStatic('common:auto.frontend.k1caea110af88')}</p>
        </div>
      )}

      {/* Helper Text */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>{tStatic('common:auto.frontend.k2ee750e04190')}</strong> {tStatic('common:auto.frontend.kf1db58300e47')}</p>
      </div>
    </div>
  );
};
