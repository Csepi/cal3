import React from 'react';
import { ActionType } from '../../../types/Automation';
import type { ActionFormData } from '../../../types/Automation';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';
import { SetEventColorForm } from './SetEventColorForm';

interface ActionRowProps {
  action: ActionFormData;
  onUpdate: (updates: Partial<ActionFormData>) => void;
  onDelete: () => void;
  canDelete: boolean;
  dragHandleProps?: any;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  action,
  onUpdate,
  onDelete,
  canDelete,
  dragHandleProps,
}) => {
  const { actionTypes } = useAutomationMetadata();

  const selectedAction = actionTypes.find((a) => a.value === action.actionType);

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ActionType;
    onUpdate({ actionType: newType, actionConfig: {} });
  };

  const handleConfigChange = (newConfig: Record<string, any>) => {
    onUpdate({ actionConfig: newConfig });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Action Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3C9 2.44772 9.44772 2 10 2C10.5523 2 11 2.44772 11 3V21C11 21.5523 10.5523 22 10 22C9.44772 22 9 21.5523 9 21V3ZM13 3C13 2.44772 13.4477 2 14 2C14.5523 2 15 2.44772 15 3V21C15 21.5523 14.5523 22 14 22C13.4477 22 13 21.5523 13 21V3Z" />
            </svg>
          </div>
        )}

        {/* Action Type Selector */}
        <div className="flex-1">
          <select
            value={action.actionType || ''}
            onChange={handleActionTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            <option value="">Select action...</option>
            {actionTypes.map((actionType) => (
              <option key={actionType.value} value={actionType.value}>
                {actionType.icon} {actionType.label}
              </option>
            ))}
          </select>
          {selectedAction && (
            <p className="mt-1 text-xs text-gray-600">{selectedAction.description}</p>
          )}
        </div>

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Remove action"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Action Configuration */}
      {action.actionType && (
        <div className="p-4">
          {action.actionType === ActionType.SET_EVENT_COLOR && (
            <SetEventColorForm config={action.actionConfig} onChange={handleConfigChange} />
          )}

          {action.actionType === ActionType.ADD_EVENT_TAG && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag *</label>
              <input
                type="text"
                value={action.actionConfig.tag || ''}
                onChange={(e) => handleConfigChange({ tag: e.target.value })}
                placeholder="e.g., important, work, personal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                This tag will be added to matching events
              </p>
            </div>
          )}

          {action.actionType === ActionType.SEND_NOTIFICATION && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={action.actionConfig.title || ''}
                  onChange={(e) =>
                    handleConfigChange({ ...action.actionConfig, title: e.target.value })
                  }
                  placeholder="e.g., Reminder"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  value={action.actionConfig.message || ''}
                  onChange={(e) =>
                    handleConfigChange({ ...action.actionConfig, message: e.target.value })
                  }
                  placeholder="e.g., Meeting starts in 30 minutes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {action.actionType === ActionType.UPDATE_EVENT_TITLE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Title *</label>
              <input
                type="text"
                value={action.actionConfig.newTitle || ''}
                onChange={(e) => handleConfigChange({ newTitle: e.target.value })}
                placeholder="e.g., [WORK] {{originalTitle}}"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                Use {'{{originalTitle}}'} to include the current title
              </p>
            </div>
          )}

          {action.actionType === ActionType.UPDATE_EVENT_DESCRIPTION && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Description *
                </label>
                <textarea
                  value={action.actionConfig.newDescription || ''}
                  onChange={(e) =>
                    handleConfigChange({ ...action.actionConfig, newDescription: e.target.value })
                  }
                  placeholder="Enter new description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode *</label>
                <select
                  value={action.actionConfig.mode || 'replace'}
                  onChange={(e) =>
                    handleConfigChange({ ...action.actionConfig, mode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="replace">Replace</option>
                  <option value="append">Append</option>
                  <option value="prepend">Prepend</option>
                </select>
              </div>
            </div>
          )}

          {/* Webhook Form */}
          {action.actionType === ActionType.WEBHOOK && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={action.actionConfig.url || ''}
                  onChange={(e) =>
                    handleConfigChange({ ...action.actionConfig, url: e.target.value })
                  }
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">The HTTP/HTTPS endpoint to call</p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id={`includeEventData-${action.tempId}`}
                  checked={action.actionConfig.includeEventData || false}
                  onChange={(e) =>
                    handleConfigChange({
                      ...action.actionConfig,
                      includeEventData: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor={`includeEventData-${action.tempId}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  <div className="font-medium">Include Event Data</div>
                  <div className="text-xs text-gray-500">
                    Send event details (title, time, description, etc.) in the webhook payload
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Headers (JSON, optional)
                </label>
                <textarea
                  value={
                    typeof action.actionConfig.headers === 'object'
                      ? JSON.stringify(action.actionConfig.headers, null, 2)
                      : action.actionConfig.headers || ''
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    try {
                      // Try to parse as JSON if not empty
                      const parsed = value.trim() ? JSON.parse(value) : undefined;
                      handleConfigChange({ ...action.actionConfig, headers: parsed });
                    } catch {
                      // If invalid JSON, store as string (will show validation error on save)
                      handleConfigChange({ ...action.actionConfig, headers: value });
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional custom HTTP headers as JSON object
                </p>
              </div>
            </div>
          )}

          {/* Coming Soon Actions */}
          {(action.actionType === ActionType.MOVE_TO_CALENDAR ||
            action.actionType === ActionType.CANCEL_EVENT ||
            action.actionType === ActionType.CREATE_TASK) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🚧 <strong>Coming Soon:</strong> This action type is not yet implemented in the
                backend. The configuration form will be available in a future update.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Action Selected */}
      {!action.actionType && (
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center">Select an action type above</p>
        </div>
      )}
    </div>
  );
};
