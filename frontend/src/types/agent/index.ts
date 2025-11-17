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
  label: string;
  description: string;
  category: AgentActionCategory;
  risk: 'read' | 'write' | 'execute';
  scopeConfig?: {
    type: 'calendar' | 'automation-rule';
    label: string;
    required: boolean;
    allowsMultiple: boolean;
    emptyHint?: string;
  };
}

export interface AgentCatalogResources {
  calendars: CalendarResource[];
  automationRules: AutomationRuleResource[];
}

export interface AgentCatalogResponse {
  actions: AgentActionDefinition[];
  resources: AgentCatalogResources;
}

export interface CalendarResource {
  id: number;
  name: string;
  color?: string | null;
  timezone?: string | null;
  ownerId: number;
  description?: string | null;
}

export interface AutomationRuleResource {
  id: number;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  triggerType: string;
}

export type AgentStatus = 'active' | 'disabled';

export interface AgentSummary {
  id: number;
  name: string;
  description?: string | null;
  status: AgentStatus;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  actionKeys: AgentActionKey[];
  apiKeyCount: number;
}

export interface AgentPermission {
  id: number;
  actionKey: AgentActionKey;
  scope?: {
    calendarIds?: number[];
    ruleIds?: number[];
  } | null;
}

export interface AgentDetail extends AgentSummary {
  permissions: AgentPermission[];
}

export interface AgentKey {
  id: number;
  name: string;
  tokenId: string;
  lastFour: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

export interface CreatedAgentKey {
  key: AgentKey;
  plaintextToken: string;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
}

export interface UpdateAgentPayload {
  name?: string;
  description?: string;
  status?: AgentStatus;
}

export interface AgentPermissionUpdate {
  actionKey: AgentActionKey;
  scope?: {
    calendarIds?: number[];
    ruleIds?: number[];
  } | null;
}

export interface UpdateAgentPermissionsPayload {
  permissions: AgentPermissionUpdate[];
}
