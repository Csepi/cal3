import React, { useEffect, useState } from 'react';
import { ActionType, TriggerType } from '../../../types/Automation';
import type { ActionFormData } from '../../../types/Automation';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';
import { SetEventColorForm } from './SetEventColorForm';
import { SmartValuePicker } from '../SmartValuePicker';
import { calendarApi } from '../../../services/calendarApi';
import type { Calendar } from '../../../types/Calendar';

import { tStatic } from '../../../i18n';

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
        {tStatic('common:auto.frontend.k0652198a6a3f')}</label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="text"
          value={action.actionConfig?.tag || ''}
          onChange={(e) => handleConfigChange({ tag: e.target.value })}
          placeholder={tStatic('common:auto.frontend.k8da1f3ac87ee')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <SmartValuePicker
          triggerType={triggerType ?? null}
          onInsert={(value) => appendSmartValue('tag', value)}
        />
      </div>
      <p className="text-xs text-gray-500">
        {tStatic('common:auto.frontend.k657267be1475')}</p>
    </div>
  );

  const renderSendNotificationForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.k768e0c1c6957')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('title', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.title || ''}
          onChange={(e) => handleConfigChange({ title: e.target.value })}
          placeholder={tStatic('common:auto.frontend.kb87a1929f78b')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.k8addb891254a')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('message', value)}
          />
        </div>
        <textarea
          value={action.actionConfig?.message || ''}
          onChange={(e) => handleConfigChange({ message: e.target.value })}
          placeholder={tStatic('common:auto.frontend.k0bee800bf92c')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{tStatic('common:auto.frontend.k886cbff9d9df')}</label>
        <select
          value={action.actionConfig?.priority || 'normal'}
          onChange={(e) => handleConfigChange({ priority: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">{tStatic('common:auto.frontend.ka124947cbd2d')}</option>
          <option value="normal">{tStatic('common:auto.frontend.k45e118d0563e')}</option>
          <option value="high">{tStatic('common:auto.frontend.kb1a5954a483f')}</option>
        </select>
      </div>
    </div>
  );

  const renderUpdateTitleForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kb7e8513f7ceb')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('newTitle', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.newTitle || ''}
          onChange={(e) => handleConfigChange({ newTitle: e.target.value })}
          placeholder={tStatic('common:auto.frontend.kab14207f1a32')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{tStatic('common:auto.frontend.ka7b93d2128e8')}</label>
        <select
          value={action.actionConfig?.mode || 'replace'}
          onChange={(e) => handleConfigChange({ mode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="replace">{tStatic('common:auto.frontend.ka7cf7b25a703')}</option>
          <option value="append">{tStatic('common:auto.frontend.k6b3a602280be')}</option>
          <option value="prepend">{tStatic('common:auto.frontend.k9d1c97452d9e')}</option>
        </select>
      </div>
    </div>
  );

  const renderUpdateDescriptionForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kba4221b15791')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('newDescription', value, '\n')}
          />
        </div>
        <textarea
          value={action.actionConfig?.newDescription || ''}
          onChange={(e) => handleConfigChange({ newDescription: e.target.value })}
          placeholder={tStatic('common:auto.frontend.kd53809162ea7')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{tStatic('common:auto.frontend.ka7b93d2128e8')}</label>
        <select
          value={action.actionConfig?.mode || 'replace'}
          onChange={(e) => handleConfigChange({ mode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="replace">{tStatic('common:auto.frontend.ka7cf7b25a703')}</option>
          <option value="append">{tStatic('common:auto.frontend.k535817c4a13f')}</option>
          <option value="prepend">{tStatic('common:auto.frontend.kec4218b7ddc7')}</option>
        </select>
      </div>
    </div>
  );

  const renderMoveToCalendarForm = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kdb51e805dbc2')}</label>
      {calendarsLoading ? (
        <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.kafbb957bc6ef')}</p>
      ) : calendarError ? (
        <p className="text-sm text-red-600">{calendarError}</p>
      ) : calendars.length === 0 ? (
        <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.kd177e41549a8')}</p>
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
          <option value="">{tStatic('common:auto.frontend.k40980074fc63')}</option>
          {calendars.map((calendar) => (
            <option key={calendar.id} value={calendar.id}>
              {calendar.name}
            </option>
          ))}
        </select>
      )}
      <p className="text-xs text-gray-500">
        {tStatic('common:auto.frontend.kcb8943ab6b72')}</p>
    </div>
  );

  const renderCancelEventForm = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kf6826f8fc9b4')}</label>
        <SmartValuePicker
          triggerType={triggerType ?? null}
          onInsert={(value) => appendSmartValue('reason', value)}
        />
      </div>
      <textarea
        value={action.actionConfig?.reason || ''}
        onChange={(e) => handleConfigChange({ reason: e.target.value })}
        placeholder={tStatic('common:auto.frontend.k8b7e8ea70ec6')}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500">
        {tStatic('common:auto.frontend.k4eb653bfeb01')}</p>
    </div>
  );

  const renderCreateTaskForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kcf7812873df1')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('taskTitle', value)}
          />
        </div>
        <input
          type="text"
          value={action.actionConfig?.taskTitle || ''}
          onChange={(e) => handleConfigChange({ taskTitle: e.target.value })}
          placeholder={tStatic('common:auto.frontend.k2754fb488bc3')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kb2386426a37d')}</label>
          <SmartValuePicker
            triggerType={triggerType ?? null}
            onInsert={(value) => appendSmartValue('taskDescription', value, '\n')}
          />
        </div>
        <textarea
          value={action.actionConfig?.taskDescription || ''}
          onChange={(e) => handleConfigChange({ taskDescription: e.target.value })}
          placeholder={tStatic('common:auto.frontend.k07e0b7e519b0')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {tStatic('common:auto.frontend.kd18f0f94d2e3')}</label>
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
          {tStatic('common:auto.frontend.k2663646b507b')}</p>
      </div>
    </div>
  );

  const renderWebhookForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {tStatic('common:auto.frontend.k87e72bd1d316')}</label>
        <input
          type="url"
          value={action.actionConfig?.url || ''}
          onChange={(e) => handleConfigChange({ url: e.target.value })}
          placeholder="https://example.com/webhook"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">{tStatic('common:auto.frontend.k670df386d3af')}</p>
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
          <div className="font-medium">{tStatic('common:auto.frontend.k0d9fd20dca2f')}</div>
          <div className="text-xs text-gray-500">
            {tStatic('common:auto.frontend.ka51e4d96e5f9')}</div>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {tStatic('common:auto.frontend.ka4dcc11e84e1')}</label>
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
          placeholder={tStatic('common:auto.frontend.k90b72e8a8ac1')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          {tStatic('common:auto.frontend.k7589d66bd0ec')}</p>
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
          {tStatic('common:auto.frontend.k3e61a75bbce0')}</div>
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
            {tStatic('common:auto.frontend.k6bd9babb0ca9')}</div>
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
            title={tStatic('common:auto.frontend.ke7541faf0a7e')}
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
            <option value="">{tStatic('common:auto.frontend.kcaa5e5b1c7cb')}</option>
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
            title={tStatic('common:auto.frontend.ke115f4aa51d4')}
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
          <p className="text-sm text-gray-500 text-center">{tStatic('common:auto.frontend.kc102d520ea02')}</p>
        </div>
      )}

      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          {tStatic('common:auto.frontend.k1502da18cfab')}</p>
      </div>
    </div>
  );
};


