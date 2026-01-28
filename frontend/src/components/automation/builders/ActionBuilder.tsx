import React, { useState } from 'react';
import { TriggerType } from '../../../types/Automation';
import type { ActionFormData } from '../../../types/Automation';
import { ActionRow } from './ActionRow';

interface ActionBuilderProps {
  actions: ActionFormData[];
  onActionsChange: (actions: ActionFormData[]) => void;
  triggerType?: TriggerType | null;
}

export const ActionBuilder: React.FC<ActionBuilderProps> = ({ actions, onActionsChange, triggerType }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddAction = () => {
    const newAction: ActionFormData = {
      tempId: `action-${Date.now()}-${Math.random()}`,
      actionType: null,
      actionConfig: {},
      order: actions.length,
    };
    onActionsChange([...actions, newAction]);
  };

  const handleUpdateAction = (index: number, updates: Partial<ActionFormData>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    onActionsChange(updated);
  };

  const handleDeleteAction = (index: number) => {
    const updated = actions.filter((_, i) => i !== index);
    // Update order values
    const reordered = updated.map((action, i) => ({ ...action, order: i }));
    onActionsChange(reordered);
  };

  // Simple drag-and-drop handlers (without external library)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...actions];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update order values
    const reordered = updated.map((action, i) => ({ ...action, order: i }));
    onActionsChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
        <span className="text-sm text-gray-600">
          {actions.length} of 5 max
        </span>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          ⚡ Actions are executed in order when conditions are met. Drag to reorder.
        </p>
      </div>

      {/* Action Rows */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={action.tempId}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex items-start gap-2">
              {/* Order Indicator & Drag Handle */}
              <div className="flex-shrink-0 flex flex-col items-center pt-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 mb-1">
                  {index + 1}
                </div>
                <div
                  className="cursor-move text-gray-400 hover:text-gray-600 p-1"
                  title="Drag to reorder"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3C9 2.44772 9.44772 2 10 2C10.5523 2 11 2.44772 11 3V21C11 21.5523 10.5523 22 10 22C9.44772 22 9 21.5523 9 21V3ZM13 3C13 2.44772 13.4477 2 14 2C14.5523 2 15 2.44772 15 3V21C15 21.5523 14.5523 22 14 22C13.4477 22 13 21.5523 13 21V3Z" />
                  </svg>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex-1">
                <ActionRow
                  action={action}
                  onUpdate={(updates) => handleUpdateAction(index, updates)}
                  onDelete={() => handleDeleteAction(index)}
                  canDelete={actions.length > 1}
                  triggerType={triggerType}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Action Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleAddAction}
          disabled={actions.length >= 5}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Action
        </button>
      </div>

      {/* Validation Warning */}
      {actions.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ At least one action is required.</p>
        </div>
      )}

      {actions.length >= 5 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Maximum of 5 actions reached. Remove an action to add more.
          </p>
        </div>
      )}

      {/* Helper Text */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Actions are executed sequentially. If one action fails, the
          remaining actions will still be attempted. Check the audit log to see execution results.
        </p>
      </div>

      {/* Coming Soon Actions Info */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs font-medium text-gray-700 mb-2">
          Additional actions coming soon:
        </p>
        <ul className="text-xs text-gray-600 space-y-1 ml-4">
          <li>• Move to Calendar - Transfer events between calendars</li>
          <li>• Cancel Event - Mark events as cancelled</li>
          <li>• Create Task - Generate related tasks</li>
          <li>• Send Email - Email notifications</li>
          <li>• Webhook - Trigger external integrations</li>
        </ul>
      </div>
    </div>
  );
};
