import { useMemo } from 'react';
import {
  TriggerType,
  ConditionField,
  ConditionOperator,
  ActionType,
} from '../types/Automation';
import type {
  TriggerTypeMetadata,
  ConditionFieldMetadata,
  OperatorMetadata,
  ActionTypeMetadata,
} from '../types/Automation';

interface UseAutomationMetadataReturn {
  triggerTypes: TriggerTypeMetadata[];
  conditionFields: ConditionFieldMetadata[];
  operators: OperatorMetadata[];
  actionTypes: ActionTypeMetadata[];

  // Helper functions
  getTriggerTypeLabel: (type: TriggerType) => string;
  getConditionFieldLabel: (field: ConditionField) => string;
  getOperatorLabel: (operator: ConditionOperator) => string;
  getActionTypeLabel: (type: ActionType) => string;
  getOperatorsForField: (field: ConditionField) => ConditionOperator[];
}

export function useAutomationMetadata(): UseAutomationMetadataReturn {
  const triggerTypes: TriggerTypeMetadata[] = useMemo(
    () => [
      {
        value: TriggerType.EVENT_CREATED,
        label: 'Event Created',
        description: 'When a new event is created',
        icon: '📅',
        requiresConfig: false,
      },
      {
        value: TriggerType.EVENT_UPDATED,
        label: 'Event Updated',
        description: 'When an existing event is modified',
        icon: '✏️',
        requiresConfig: false,
      },
      {
        value: TriggerType.EVENT_DELETED,
        label: 'Event Deleted',
        description: 'When an event is deleted',
        icon: '🗑️',
        requiresConfig: false,
      },
      {
        value: TriggerType.EVENT_STARTS_IN,
        label: 'Event Starts In',
        description: 'Before an event starts (e.g., 30 minutes before)',
        icon: '⏰',
        requiresConfig: true,
        configSchema: {
          minutes: {
            type: 'number',
            label: 'Minutes before',
            min: 1,
            max: 10080, // 1 week
            default: 30,
          },
        },
      },
      {
        value: TriggerType.EVENT_ENDS_IN,
        label: 'Event Ends In',
        description: 'Before an event ends',
        icon: '⏱️',
        requiresConfig: true,
        configSchema: {
          minutes: {
            type: 'number',
            label: 'Minutes before end',
            min: 1,
            max: 10080,
            default: 15,
          },
        },
      },
      {
        value: TriggerType.CALENDAR_IMPORTED,
        label: 'Calendar Imported',
        description: 'When an event is synced from external calendar',
        icon: '🔄',
        requiresConfig: false,
      },
      {
        value: TriggerType.SCHEDULED_TIME,
        label: 'Scheduled Time',
        description: 'At a specific time (cron schedule)',
        icon: '⏲️',
        requiresConfig: true,
        configSchema: {
          cronExpression: {
            type: 'text',
            label: 'Cron expression',
            placeholder: '0 9 * * 1-5',
            default: '0 9 * * *',
          },
        },
      },
      {
        value: TriggerType.WEBHOOK_INCOMING,
        label: 'Incoming Webhook',
        description: 'When data is received via webhook URL',
        icon: '🌐',
        requiresConfig: false,
      },
    ],
    []
  );

  const conditionFields: ConditionFieldMetadata[] = useMemo(
    () => [
      {
        value: ConditionField.EVENT_TITLE,
        label: 'Event Title',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.STARTS_WITH,
          ConditionOperator.ENDS_WITH,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
        ],
      },
      {
        value: ConditionField.EVENT_DESCRIPTION,
        label: 'Event Description',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
        ],
      },
      {
        value: ConditionField.EVENT_LOCATION,
        label: 'Event Location',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
        ],
      },
      {
        value: ConditionField.EVENT_IS_ALL_DAY,
        label: 'Is All-Day Event',
        category: 'boolean',
        dataType: 'boolean',
        supportedOperators: [ConditionOperator.IS_TRUE, ConditionOperator.IS_FALSE],
      },
      {
        value: ConditionField.EVENT_COLOR,
        label: 'Event Color',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IN_LIST,
        ],
      },
      {
        value: ConditionField.EVENT_DURATION,
        label: 'Event Duration (minutes)',
        category: 'number',
        dataType: 'number',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.GREATER_THAN,
          ConditionOperator.LESS_THAN,
          ConditionOperator.GREATER_THAN_OR_EQUAL,
          ConditionOperator.LESS_THAN_OR_EQUAL,
        ],
      },
      {
        value: ConditionField.EVENT_RECURRENCE_RULE,
        label: 'Recurrence Rule',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.CONTAINS,
        ],
      },
      {
        value: ConditionField.EVENT_CALENDAR_ID,
        label: 'Calendar ID',
        category: 'number',
        dataType: 'number',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IN_LIST,
        ],
      },
      {
        value: ConditionField.EVENT_CALENDAR_NAME,
        label: 'Calendar Name',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.IN_LIST,
        ],
      },
      {
        value: ConditionField.EVENT_TAGS,
        label: 'Event Tags',
        category: 'array',
        dataType: 'array',
        supportedOperators: [
          ConditionOperator.CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
        ],
      },
      {
        value: ConditionField.EVENT_PARTICIPANTS,
        label: 'Event Participants',
        category: 'array',
        dataType: 'array',
        supportedOperators: [
          ConditionOperator.CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
        ],
      },
      {
        value: ConditionField.WEBHOOK_DATA,
        label: 'Webhook Data',
        category: 'text',
        dataType: 'string',
        supportedOperators: [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.STARTS_WITH,
          ConditionOperator.ENDS_WITH,
          ConditionOperator.GREATER_THAN,
          ConditionOperator.LESS_THAN,
          ConditionOperator.GREATER_THAN_OR_EQUAL,
          ConditionOperator.LESS_THAN_OR_EQUAL,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.IN_LIST,
        ],
      },
    ],
    []
  );

  const operators: OperatorMetadata[] = useMemo(
    () => [
      {
        value: ConditionOperator.EQUALS,
        label: 'equals',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.NOT_EQUALS,
        label: 'does not equal',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.CONTAINS,
        label: 'contains',
        category: 'string',
        requiresValue: true,
      },
      {
        value: ConditionOperator.NOT_CONTAINS,
        label: 'does not contain',
        category: 'string',
        requiresValue: true,
      },
      {
        value: ConditionOperator.STARTS_WITH,
        label: 'starts with',
        category: 'string',
        requiresValue: true,
      },
      {
        value: ConditionOperator.ENDS_WITH,
        label: 'ends with',
        category: 'string',
        requiresValue: true,
      },
      {
        value: ConditionOperator.GREATER_THAN,
        label: 'greater than',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.LESS_THAN,
        label: 'less than',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.GREATER_THAN_OR_EQUAL,
        label: 'greater than or equal to',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.LESS_THAN_OR_EQUAL,
        label: 'less than or equal to',
        category: 'comparison',
        requiresValue: true,
      },
      {
        value: ConditionOperator.IS_EMPTY,
        label: 'is empty',
        category: 'comparison',
        requiresValue: false,
      },
      {
        value: ConditionOperator.IS_NOT_EMPTY,
        label: 'is not empty',
        category: 'comparison',
        requiresValue: false,
      },
      {
        value: ConditionOperator.IS_TRUE,
        label: 'is true',
        category: 'boolean',
        requiresValue: false,
      },
      {
        value: ConditionOperator.IS_FALSE,
        label: 'is false',
        category: 'boolean',
        requiresValue: false,
      },
      {
        value: ConditionOperator.IN_LIST,
        label: 'is in list',
        category: 'array',
        requiresValue: true,
      },
    ],
    []
  );

  const actionTypes: ActionTypeMetadata[] = useMemo(
    () => [
      {
        value: ActionType.SET_EVENT_COLOR,
        label: 'Set Event Color',
        description: 'Change the color of the event',
        icon: '🎨',
        available: true,
        configFields: [
          {
            name: 'color',
            label: 'Color',
            type: 'color',
            required: true,
            placeholder: '#3b82f6',
          },
        ],
      },
      {
        value: ActionType.ADD_EVENT_TAG,
        label: 'Add Event Tag',
        description: 'Add a tag to the event',
        icon: '🏷️',
        available: true,
        configFields: [
          {
            name: 'tag',
            label: 'Tag',
            type: 'text',
            required: true,
            placeholder: 'important',
          },
        ],
      },
      {
        value: ActionType.SEND_NOTIFICATION,
        label: 'Send Notification',
        description: 'Send a notification to the user',
        icon: '🔔',
        available: true,
        configFields: [
          {
            name: 'message',
            label: 'Message',
            type: 'textarea',
            required: true,
            placeholder: 'Meeting starts in 30 minutes',
          },
          {
            name: 'title',
            label: 'Title (optional)',
            type: 'text',
            required: false,
            placeholder: 'Reminder',
          },
        ],
      },
      {
        value: ActionType.UPDATE_EVENT_TITLE,
        label: 'Update Event Title',
        description: 'Change the title of the event',
        icon: '📝',
        available: true,
        configFields: [
          {
            name: 'newTitle',
            label: 'New Title',
            type: 'text',
            required: true,
            placeholder: '[WORK] {{originalTitle}}',
          },
        ],
      },
      {
        value: ActionType.UPDATE_EVENT_DESCRIPTION,
        label: 'Update Event Description',
        description: 'Change or append to event description',
        icon: '📄',
        available: true,
        configFields: [
          {
            name: 'newDescription',
            label: 'New Description',
            type: 'textarea',
            required: true,
            placeholder: 'Automated description update',
          },
          {
            name: 'mode',
            label: 'Mode',
            type: 'select',
            required: true,
            options: [
              { value: 'replace', label: 'Replace' },
              { value: 'append', label: 'Append' },
              { value: 'prepend', label: 'Prepend' },
            ],
          },
        ],
      },
      {
        value: ActionType.MOVE_TO_CALENDAR,
        label: 'Move to Calendar',
        description: 'Move the event to a different calendar',
        icon: '📁',
        available: true,
        configFields: [
          {
            name: 'targetCalendarId',
            label: 'Target Calendar',
            type: 'calendar-select',
            required: true,
            placeholder: 'Select calendar',
          },
        ],
      },
      {
        value: ActionType.CANCEL_EVENT,
        label: 'Cancel Event',
        description: 'Mark the event as cancelled',
        icon: '❌',
        available: true,
        configFields: [
          {
            name: 'reason',
            label: 'Cancellation Reason (optional)',
            type: 'textarea',
            required: false,
            placeholder: 'Event cancelled automatically',
          },
        ],
      },
      {
        value: ActionType.CREATE_TASK,
        label: 'Create Task',
        description: 'Create a task related to the event',
        icon: '✅',
        available: true,
        configFields: [
          {
            name: 'taskTitle',
            label: 'Task Title',
            type: 'text',
            required: true,
            placeholder: 'Prepare for {{eventTitle}}',
          },
          {
            name: 'taskDescription',
            label: 'Task Description',
            type: 'textarea',
            required: false,
            placeholder: 'Task details',
          },
          {
            name: 'dueMinutesBefore',
            label: 'Due (minutes before event)',
            type: 'number',
            required: false,
            placeholder: '60',
            validation: {
              min: 0,
              max: 10080,
            },
          },
        ],
      },
      {
        value: ActionType.WEBHOOK,
        label: 'Call Webhook',
        description: 'Send HTTP POST request to a webhook URL',
        icon: '🔗',
        available: true,
        configFields: [
          {
            name: 'url',
            label: 'Webhook URL',
            type: 'text',
            required: true,
            placeholder: 'https://example.com/webhook',
            helpText: 'The HTTP/HTTPS endpoint to call',
          },
          {
            name: 'includeEventData',
            label: 'Include Event Data',
            type: 'checkbox',
            required: false,
            helpText: 'Send event details in the webhook payload',
          },
          {
            name: 'headers',
            label: 'Custom Headers (JSON)',
            type: 'json',
            required: false,
            placeholder: '{"Authorization": "Bearer token"}',
            helpText: 'Optional custom HTTP headers as JSON object',
          },
        ],
      },
    ],
    []
  );

  // Helper functions
  const getTriggerTypeLabel = (type: TriggerType): string => {
    return triggerTypes.find((t) => t.value === type)?.label || type;
  };

  const getConditionFieldLabel = (field: ConditionField): string => {
    return conditionFields.find((f) => f.value === field)?.label || field;
  };

  const getOperatorLabel = (operator: ConditionOperator): string => {
    return operators.find((o) => o.value === operator)?.label || operator;
  };

  const getActionTypeLabel = (type: ActionType): string => {
    return actionTypes.find((a) => a.value === type)?.label || type;
  };

  const getOperatorsForField = (field: ConditionField): ConditionOperator[] => {
    return (
      conditionFields.find((f) => f.value === field)?.supportedOperators || []
    );
  };

  return {
    triggerTypes,
    conditionFields,
    operators,
    actionTypes,
    getTriggerTypeLabel,
    getConditionFieldLabel,
    getOperatorLabel,
    getActionTypeLabel,
    getOperatorsForField,
  };
}
