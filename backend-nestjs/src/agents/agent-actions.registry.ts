export enum AgentActionKey {
  CALENDAR_LIST = 'calendar.list',
  CALENDAR_EVENTS_READ = 'calendar.events.read',
  CALENDAR_EVENTS_CREATE = 'calendar.events.create',
  CALENDAR_EVENTS_UPDATE = 'calendar.events.update',
  CALENDAR_EVENTS_DELETE = 'calendar.events.delete',
  AUTOMATION_RULES_LIST = 'automation.rules.list',
  AUTOMATION_RULES_TRIGGER = 'automation.rules.trigger',
  USER_PROFILE_READ = 'user.profile.read',
  TASKS_LIST = 'tasks.list',
  TASKS_CREATE = 'tasks.create',
  TASKS_UPDATE = 'tasks.update',
  TASKS_DELETE = 'tasks.delete',
  TASK_LABELS_LIST = 'task-labels.list',
  TASK_LABELS_CREATE = 'task-labels.create',
  TASK_LABELS_UPDATE = 'task-labels.update',
  TASK_LABELS_DELETE = 'task-labels.delete',
}

export type AgentActionCategory =
  | 'calendars'
  | 'automation'
  | 'profile'
  | 'tasks';

export interface AgentActionDefinition {
  key: AgentActionKey;
  category: AgentActionCategory;
  label: string;
  description: string;
  risk: 'read' | 'write' | 'execute';
  scopeConfig?: {
    type: 'calendar' | 'automation-rule';
    label: string;
    required: boolean;
    allowsMultiple: boolean;
    emptyHint?: string;
  };
}

const ACTION_DEFINITIONS: AgentActionDefinition[] = [
  {
    key: AgentActionKey.CALENDAR_LIST,
    category: 'calendars',
    label: 'List Calendars',
    description:
      'Allow the agent to enumerate specific calendars the user has shared with it.',
    risk: 'read',
    scopeConfig: {
      type: 'calendar',
      label: 'Calendars available for listing',
      required: true,
      allowsMultiple: true,
      emptyHint:
        'Select one or more calendars the agent may describe to external tools.',
    },
  },
  {
    key: AgentActionKey.CALENDAR_EVENTS_READ,
    category: 'calendars',
    label: 'Read Calendar Events',
    description:
      'Allow the agent to read events (titles, times, details) from specified calendars.',
    risk: 'read',
    scopeConfig: {
      type: 'calendar',
      label: 'Calendars available for reading events',
      required: true,
      allowsMultiple: true,
      emptyHint: 'Choose calendars whose events the agent may inspect.',
    },
  },
  {
    key: AgentActionKey.CALENDAR_EVENTS_CREATE,
    category: 'calendars',
    label: 'Create Calendar Events',
    description:
      'Allow the agent to create new events in the calendars you select.',
    risk: 'write',
    scopeConfig: {
      type: 'calendar',
      label: 'Calendars where the agent may create events',
      required: true,
      allowsMultiple: true,
      emptyHint:
        'Grant create access only to calendars you trust the agent to populate.',
    },
  },
  {
    key: AgentActionKey.CALENDAR_EVENTS_UPDATE,
    category: 'calendars',
    label: 'Update Calendar Events',
    description:
      'Allow the agent to make changes to existing events in selected calendars.',
    risk: 'write',
    scopeConfig: {
      type: 'calendar',
      label: 'Calendars where the agent may update events',
      required: true,
      allowsMultiple: true,
      emptyHint:
        'Choose calendars whose events the agent may modify after they are created.',
    },
  },
  {
    key: AgentActionKey.CALENDAR_EVENTS_DELETE,
    category: 'calendars',
    label: 'Delete Calendar Events',
    description:
      'Allow the agent to delete events from the calendars you share.',
    risk: 'write',
    scopeConfig: {
      type: 'calendar',
      label: 'Calendars where the agent may delete events',
      required: true,
      allowsMultiple: true,
      emptyHint:
        'Only include calendars where you are comfortable with the agent removing events.',
    },
  },
  {
    key: AgentActionKey.AUTOMATION_RULES_LIST,
    category: 'automation',
    label: 'List Automation Rules',
    description:
      'Allow the agent to list automation rules it may reference or summarise.',
    risk: 'read',
    scopeConfig: {
      type: 'automation-rule',
      label: 'Automation rules visible to the agent',
      required: false,
      allowsMultiple: true,
      emptyHint: 'Select rules or leave empty to expose all rules you own.',
    },
  },
  {
    key: AgentActionKey.AUTOMATION_RULES_TRIGGER,
    category: 'automation',
    label: 'Trigger Automation Rules',
    description: 'Allow the agent to execute automation rules on demand.',
    risk: 'execute',
    scopeConfig: {
      type: 'automation-rule',
      label: 'Automation rules the agent may trigger',
      required: true,
      allowsMultiple: true,
      emptyHint:
        'Trigger access should be given sparingly and to safe automations only.',
    },
  },
  {
    key: AgentActionKey.USER_PROFILE_READ,
    category: 'profile',
    label: 'Read Profile Basics',
    description:
      'Allow the agent to read your display name, email and theme preferences.',
    risk: 'read',
  },
  {
    key: AgentActionKey.TASKS_LIST,
    category: 'tasks',
    label: 'List Tasks',
    description:
      'Allow the agent to list your Tasks workspace items (owner-scoped).',
    risk: 'read',
  },
  {
    key: AgentActionKey.TASKS_CREATE,
    category: 'tasks',
    label: 'Create Tasks',
    description:
      'Allow the agent to create tasks in your Tasks workspace and mirror them into the default Tasks calendar. Although due date/time or label is optional, confirm it with the user before calling this action.',
    risk: 'write',
  },
  {
    key: AgentActionKey.TASKS_UPDATE,
    category: 'tasks',
    label: 'Update Tasks',
    description:
      'Allow the agent to update task fields such as status, priority, due date, and body.',
    risk: 'write',
  },
  {
    key: AgentActionKey.TASKS_DELETE,
    category: 'tasks',
    label: 'Delete Tasks',
    description: 'Allow the agent to delete tasks you own.',
    risk: 'write',
  },
  {
    key: AgentActionKey.TASK_LABELS_LIST,
    category: 'tasks',
    label: 'List Task Labels',
    description:
      'Allow the agent to read the task labels you have defined for Tasks.',
    risk: 'read',
  },
  {
    key: AgentActionKey.TASK_LABELS_CREATE,
    category: 'tasks',
    label: 'Create Task Labels',
    description: 'Allow the agent to create new task labels on your behalf.',
    risk: 'write',
  },
  {
    key: AgentActionKey.TASK_LABELS_UPDATE,
    category: 'tasks',
    label: 'Rename Task Labels',
    description: 'Allow the agent to update existing task labels.',
    risk: 'write',
  },
  {
    key: AgentActionKey.TASK_LABELS_DELETE,
    category: 'tasks',
    label: 'Delete Task Labels',
    description: 'Allow the agent to delete task labels you no longer use.',
    risk: 'write',
  },
];

const ACTION_MAP = new Map<AgentActionKey, AgentActionDefinition>(
  ACTION_DEFINITIONS.map((def) => [def.key, def]),
);

export function listAgentActionDefinitions(): AgentActionDefinition[] {
  return ACTION_DEFINITIONS.slice();
}

export function getAgentActionDefinition(
  key: AgentActionKey,
): AgentActionDefinition | undefined {
  return ACTION_MAP.get(key);
}
