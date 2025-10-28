// TypeScript interfaces for Automation feature
// Corresponds to backend DTOs in automation-rule.dto.ts and automation-audit-log.dto.ts

// ===== Enums =====

export enum TriggerType {
  EVENT_CREATED = 'event.created',
  EVENT_UPDATED = 'event.updated',
  EVENT_DELETED = 'event.deleted',
  EVENT_STARTS_IN = 'event.starts_in',
  EVENT_ENDS_IN = 'event.ends_in',
  CALENDAR_IMPORTED = 'calendar.imported',
  SCHEDULED_TIME = 'scheduled.time',
  WEBHOOK_INCOMING = 'webhook.incoming',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

export enum ConditionField {
  EVENT_TITLE = 'event.title',
  EVENT_DESCRIPTION = 'event.description',
  EVENT_LOCATION = 'event.location',
  EVENT_IS_ALL_DAY = 'event.isAllDay',
  EVENT_COLOR = 'event.color',
  EVENT_DURATION = 'event.duration',
  EVENT_RECURRENCE_RULE = 'event.recurrenceRule',
  EVENT_CALENDAR_ID = 'event.calendarId',
  EVENT_CALENDAR_NAME = 'event.calendarName',
  EVENT_TAGS = 'event.tags',
  EVENT_PARTICIPANTS = 'event.participants',
  WEBHOOK_DATA = 'webhook.data',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
  IN_LIST = 'in_list',
}

export enum ConditionLogicOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum ActionType {
  SET_EVENT_COLOR = 'set_event_color',
  ADD_EVENT_TAG = 'add_event_tag',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_EVENT_TITLE = 'update_event_title',
  UPDATE_EVENT_DESCRIPTION = 'update_event_description',
  MOVE_TO_CALENDAR = 'move_to_calendar',
  CANCEL_EVENT = 'cancel_event',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
}

export enum AuditLogStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
}

// ===== Condition Interfaces =====

export interface CreateConditionDto {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  groupId?: string;
  logicOperator: ConditionLogicOperator;
  order?: number;
}

export interface ConditionDto {
  id: number;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  groupId: string | null;
  logicOperator: ConditionLogicOperator;
  order: number;
}

// ===== Action Interfaces =====

export interface CreateActionDto {
  actionType: ActionType;
  actionConfig: Record<string, any>;
  order?: number;
}

export interface ActionDto {
  id: number;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  order: number;
}

// ===== Rule Interfaces =====

export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  isEnabled?: boolean;
  conditionLogic?: ConditionLogic;
  conditions: CreateConditionDto[];
  actions: CreateActionDto[];
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  triggerConfig?: Record<string, any>;
  conditionLogic?: ConditionLogic;
  conditions?: CreateConditionDto[];
  actions?: CreateActionDto[];
}

export interface AutomationRuleDto {
  id: number;
  name: string;
  description: string | null;
  triggerType: TriggerType;
  triggerConfig: Record<string, any> | null;
  isEnabled: boolean;
  conditionLogic: ConditionLogic;
  lastExecutedAt: Date | null;
  executionCount: number;
  webhookToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRuleDetailDto extends AutomationRuleDto {
  conditions: ConditionDto[];
  actions: ActionDto[];
}

export interface PaginatedAutomationRulesDto {
  data: AutomationRuleDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== Audit Log Interfaces =====

export interface ConditionEvaluationDto {
  conditionId: number;
  field: string;
  operator: string;
  expectedValue: string;
  actualValue: any;
  passed: boolean;
}

export interface ConditionsResultDto {
  passed: boolean;
  evaluations: ConditionEvaluationDto[];
  logicExpression: string;
}

export interface ActionResultDto {
  actionId: number;
  actionType: string;
  success: boolean;
  error?: string;
  data?: Record<string, any>;
  executedAt: Date;
}

export interface AuditLogDto {
  id: number;
  ruleId: number;
  ruleName: string;
  eventId: number | null;
  eventTitle: string | null;
  triggerType: TriggerType;
  triggerContext: Record<string, any> | null;
  conditionsResult: ConditionsResultDto;
  actionResults: ActionResultDto[] | null;
  status: AuditLogStatus;
  errorMessage: string | null;
  executionTimeMs: number;
  executedByUserId: number | null;
  executedByUsername: string | null;
  executedAt: Date;
}

export interface AuditLogQueryDto {
  ruleId?: number;
  status?: AuditLogStatus;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogStatsDto {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  avgExecutionTimeMs: number;
  lastExecutedAt: Date | null;
}

// ===== Frontend-Specific Interfaces =====

export interface RuleFormState {
  name: string;
  description: string;
  triggerType: TriggerType | null;
  triggerConfig: Record<string, any>;
  conditionLogic: ConditionLogic;
  conditions: ConditionFormData[];
  actions: ActionFormData[];
  isEnabled: boolean;
  runRetroactively: boolean;
}

export interface ConditionFormData {
  tempId: string; // for React key management
  field: ConditionField | null;
  operator: ConditionOperator | null;
  value: string;
  groupId?: string;
  logicOperator: ConditionLogicOperator;
  order: number;
}

export interface ActionFormData {
  tempId: string; // for React key management
  actionType: ActionType | null;
  actionConfig: Record<string, any>;
  order: number;
}

export interface AutomationFilters {
  search: string;
  statusFilter: 'all' | 'enabled' | 'disabled';
  triggerTypeFilter: TriggerType | 'all';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===== Metadata Interfaces (for dropdowns and UI) =====

export interface TriggerTypeMetadata {
  value: TriggerType;
  label: string;
  description: string;
  icon: string;
  requiresConfig: boolean;
  configSchema?: Record<string, any>;
}

export interface ConditionFieldMetadata {
  value: ConditionField;
  label: string;
  category: 'text' | 'boolean' | 'number' | 'array';
  dataType: 'string' | 'boolean' | 'number' | 'array';
  supportedOperators: ConditionOperator[];
}

export interface ActionTypeMetadata {
  value: ActionType;
  label: string;
  description: string;
  icon: string;
  configFields: ActionConfigField[];
  available: boolean;
}

export interface ActionConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'textarea' | 'calendar-select' | 'checkbox' | 'json';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface OperatorMetadata {
  value: ConditionOperator;
  label: string;
  category: 'comparison' | 'string' | 'boolean' | 'array';
  requiresValue: boolean;
}
