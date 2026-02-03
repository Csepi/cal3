import React, { useEffect, useState } from 'react';
import { ActionType, TriggerType } from '../../../types/Automation';
import type { ActionFormData } from '../../../types/Automation';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';
import { SetEventColorForm } from './SetEventColorForm';
import { SmartValuePicker } from '../SmartValuePicker';
import { calendarApi } from '../../../services/calendarApi';
import type { Calendar } from '../../../types/Calendar';

interface ActionRowProps {
  action: ActionFormData;
  onUpdate: (updates: Partial<ActionFormData>) => void;
  onDelete: () => void;
  canDelete: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  triggerType?: TriggerType | null;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  action,
  onUpdate,
  onDelete,
  canDelete,
  dragHandleProps,
  triggerType,
}) => {
  const { actionTypes } = useAutomationMetadata();
  const selectedAction = actionTypes.find((a) => a.value === action.actionType);
  const isSelectedActionAvailable = selectedAction?.available ?? false;

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    if (action.actionType === ActionType.MOVE_TO_CALENDAR && calendars.length === 0 && !calendarsLoading) {
      fetchCalendars();
    }
  }, [action.actionType, calendars.length, calendarsLoading]);

  const fetchCalendars = async () => {
    setCalendarsLoading(true);
    setCalendarError(null);
    try {
      const list = await calendarApi.getCalendars();
      setCalendars(list);
    } catch (error) {
      console.error('Failed to load calendars for automation action:', error);
      setCalendarError('Unable to load calendars. Please try again later.');
    } finally {
      setCalendarsLoading(false);
    }
  };

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as ActionType | '';

    if (!newValue) {
      onUpdate({ actionType: null, actionConfig: {} });
      return;
    }

    const metadata = actionTypes.find((type) => type.value === newValue);
    if (!metadata || !metadata.available) {
      onUpdate({ actionType: null, actionConfig: {} });
      return;
    }

    let initialConfig: Record<string, unknown> = {};
    if (newValue === ActionType.SET_EVENT_COLOR) {
      initialConfig = { color: '#3b82f6' };
    }

    onUpdate({ actionType: newValue, actionConfig: initialConfig });
  };

  const handleConfigChange = (updates: Record<string, unknown>) => {
    const currentConfig = { ...(action.actionConfig || {}) };

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        delete currentConfig[key];
      } else {
        currentConfig[key] = value;
      }
    });

    onUpdate({ actionConfig: currentConfig });
  };

  const appendSmartValue = (key: string, smartValue: string, separator: string = ' ') => {
    const current = typeof action.actionConfig?.[key] === 'string' ? action.actionConfig[key] : '';
    const value = current ? `${current}${separator}${smartValue}` : smartValue;
    handleConfigChange({ [key]: value });
  };

  const renderAddEventTagForm = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Tag(s) *
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="text"
          value={action.actionConfig?.tag || ''}
          onChange={(e) => handleConfigChange({ tag: e.target.value })}
          placeholder="e.g., important, client"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <SmartValuePicker
          triggerType={triggerType ?? null}
          onInsert={(value) => appendSmartValue('tag', value)}
        />
      </div>
      <p className="text-xs text-gray-500">
        Separate multiple tags with commas. Smart values are supported.
      </p>
    </div>
  );

  const renderSendNotificationForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('title', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.title || ''}
          onChange={(e) => handleConfigChange({ title: e.target.value })}
          placeholder="Reminder"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Message *</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('message', value)}
          />
        </div>
        <textarea
          value={action.actionConfig?.message || ''}
          onChange={(e) => handleConfigChange({ message: e.target.value })}
          placeholder="Don't forget to review the agenda before the meeting."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select
          value={action.actionConfig?.priority || 'normal'}
          onChange={(e) => handleConfigChange({ priority: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  );

  const renderUpdateTitleForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">New Title *</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('newTitle', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.newTitle || ''}
          onChange={(e) => handleConfigChange({ newTitle: e.target.value })}
          placeholder="[WORK] {{event.title}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          value={action.actionConfig?.mode || 'replace'}
          onChange={(e) => handleConfigChange({ mode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="replace">Replace</option>
          <option value="append">Append</option>
          <option value="prepend">Prepend</option>
        </select>
      </div>
    </div>
  );

  const renderUpdateDescriptionForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">New Description *</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('newDescription', value, '\n')}
          />
        </div>
        <textarea
          value={action.actionConfig?.newDescription || ''}
          onChange={(e) => handleConfigChange({ newDescription: e.target.value })}
          placeholder="Add additional details here..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          value={action.actionConfig?.mode || 'replace'}
          onChange={(e) => handleConfigChange({ mode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="replace">Replace</option>
          <option value="append">Append (adds below existing text)</option>
          <option value="prepend">Prepend (adds above existing text)</option>
        </select>
      </div>
    </div>
  );

  const renderMoveToCalendarForm = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Target Calendar *</label>
      {calendarsLoading ? (
        <p className="text-sm text-gray-500">Loading calendars...</p>
      ) : calendarError ? (
        <p className="text-sm text-red-600">{calendarError}</p>
      ) : calendars.length === 0 ? (
        <p className="text-sm text-gray-500">No calendars available.</p>
      ) : (
        <select
          value={action.actionConfig?.targetCalendarId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              handleConfigChange({ targetCalendarId: undefined });
            } else {
              const numericValue = Number(value);
              handleConfigChange({
                targetCalendarId: Number.isNaN(numericValue) ? undefined : numericValue,
              });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select calendar...</option>
          {calendars.map((calendar) => (
            <option key={calendar.id} value={calendar.id}>
              {calendar.name}
            </option>
          ))}
        </select>
      )}
      <p className="text-xs text-gray-500">
        Events are moved immediately to the selected calendar.
      </p>
    </div>
  );

  const renderCancelEventForm = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
        <SmartValuePicker
          triggerType={triggerType ?? null}
          onInsert={(value) => appendSmartValue('reason', value)}
        />
      </div>
      <textarea
        value={action.actionConfig?.reason || ''}
        onChange={(e) => handleConfigChange({ reason: e.target.value })}
        placeholder="Provide additional context for the cancellation"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500">
        The reason will be stored with the event notes for audit purposes.
      </p>
    </div>
  );

  const renderCreateTaskForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Task Title *</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('taskTitle', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.taskTitle || ''}
          onChange={(e) => handleConfigChange({ taskTitle: e.target.value })}
          placeholder="Prepare slides for {{event.title}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Task Description</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('taskDescription', value, '\n')}
          />
        </div>
        <textarea
          value={action.actionConfig?.taskDescription || ''}
          onChange={(e) => handleConfigChange({ taskDescription: e.target.value })}
          placeholder="List agenda topics, attach documents, etc."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due (minutes before event)
        </label>
        <input
          type="number"
          min={0}
          value={
            action.actionConfig?.dueMinutesBefore === undefined
              ? ''
              : action.actionConfig?.dueMinutesBefore
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              handleConfigChange({ dueMinutesBefore: undefined });
              return;
            }

            const numericValue = Number(value);
            handleConfigChange({
              dueMinutesBefore: Number.isNaN(numericValue) ? undefined : numericValue,
            });
          }}
          placeholder="60"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500">
          Leave blank to skip a due time. Tasks are stored with the event for quick reference.
        </p>
      </div>
    </div>
  );

  const renderWebhookForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL *
        </label>
        <input
          type="url"
          value={action.actionConfig?.url || ''}
          onChange={(e) => handleConfigChange({ url: e.target.value })}
          placeholder="https://example.com/webhook"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">The HTTP/HTTPS endpoint to call.</p>
      </div>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={`includeEventData-${action.tempId}`}
          checked={action.actionConfig?.includeEventData || false}
          onChange={(e) => handleConfigChange({ includeEventData: e.target.checked })}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={`includeEventData-${action.tempId}`} className="text-sm text-gray-700 cursor-pointer">
          <div className="font-medium">Include Event Data</div>
          <div className="text-xs text-gray-500">
            Send event details (title, time, description, etc.) in the webhook payload.
          </div>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Headers (JSON, optional)
        </label>
        <textarea
          value={
            typeof action.actionConfig?.headers === 'object'
              ? JSON.stringify(action.actionConfig.headers, null, 2)
              : action.actionConfig?.headers || ''
          }
          onChange={(e) => {
            const value = e.target.value;
            try {
              const parsed = value.trim() ? JSON.parse(value) : undefined;
              handleConfigChange({ headers: parsed });
            } catch {
              handleConfigChange({ headers: value });
            }
          }}
          placeholder='{"Authorization": "Bearer token"}'
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional custom HTTP headers as a JSON object.
        </p>
      </div>
    </div>
  );

  const renderActionForm = () => {
    if (!action.actionType) {
      return null;
    }

    if (!isSelectedActionAvailable) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          This action is currently unavailable. Please choose another action type.
        </div>
      );
    }

    switch (action.actionType) {
      case ActionType.SET_EVENT_COLOR:
        return (
          <SetEventColorForm
            config={action.actionConfig || {}}
            onChange={handleConfigChange}
            triggerType={triggerType ?? null}
          />
        );
      case ActionType.ADD_EVENT_TAG:
        return renderAddEventTagForm();
      case ActionType.SEND_NOTIFICATION:
        return renderSendNotificationForm();
      case ActionType.UPDATE_EVENT_TITLE:
        return renderUpdateTitleForm();
      case ActionType.UPDATE_EVENT_DESCRIPTION:
        return renderUpdateDescriptionForm();
      case ActionType.MOVE_TO_CALENDAR:
        return renderMoveToCalendarForm();
      case ActionType.CANCEL_EVENT:
        return renderCancelEventForm();
      case ActionType.CREATE_TASK:
        return renderCreateTaskForm();
      case ActionType.WEBHOOK:
        return renderWebhookForm();
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            This action type is not recognized.
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
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

        <div className="flex-1">
          <select
            value={action.actionType || ''}
            onChange={handleActionTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            <option value="">Select action...</option>
            {actionTypes.map((actionType) => (
              <option
                key={actionType.value}
                value={actionType.value}
                disabled={!actionType.available}
              >
                {actionType.icon} {actionType.label}
              </option>
            ))}
          </select>
          {selectedAction && (
            <p className="mt-1 text-xs text-gray-600">{selectedAction.description}</p>
          )}
        </div>

        {canDelete && (
          <button
            onClick={onDelete}
            className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Remove action"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {action.actionType ? (
        <div className="p-4 space-y-4">{renderActionForm()}</div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center">Select an action type above</p>
        </div>
      )}

      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          Actions run sequentially. If an action updates the event, later actions will use the updated values.
        </p>
      </div>
    </div>
  );
};


