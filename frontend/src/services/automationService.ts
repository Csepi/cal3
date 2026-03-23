import type {
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  PaginatedAutomationRulesDto,
  AuditLogDto,
  AuditLogQueryDto,
  AuditLogStatsDto,
  PaginationState,
} from '../types/Automation';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from './authErrorHandler';
import { sessionManager } from './sessionManager';

type ConditionFieldMode = 'unknown' | 'canonical' | 'legacy';

const canonicalToLegacyConditionFieldMap: Record<string, string> = {
  'event.is_all_day': 'event.isAllDay',
  'event.calendar.id': 'event.calendarId',
  'event.calendar.name': 'event.calendarName',
};

const legacyToCanonicalConditionFieldMap: Record<string, string> = Object.entries(
  canonicalToLegacyConditionFieldMap,
).reduce<Record<string, string>>((accumulator, [canonical, legacy]) => {
  accumulator[legacy] = canonical;
  return accumulator;
}, {});

const canonicalConditionFields = new Set<string>(
  Object.keys(canonicalToLegacyConditionFieldMap),
);
const legacyConditionFields = new Set<string>(
  Object.values(canonicalToLegacyConditionFieldMap),
);

let conditionFieldMode: ConditionFieldMode = 'unknown';

type ApiFetchOptions = RequestInit & { timeoutMs?: number };

const apiFetch = async (url: string, init: ApiFetchOptions = {}): Promise<Response> => {
  const headers = new Headers(init.headers ?? {});
  if (
    init.body &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return secureFetch(url, {
    ...init,
    headers,
  });
};

const extractFieldValidationMessage = (details: unknown): string | null => {
  if (!details || typeof details !== 'object') {
    return null;
  }

  const fields = (details as Record<string, unknown>).fields;
  if (!Array.isArray(fields)) {
    return null;
  }

  for (const fieldEntry of fields) {
    if (!fieldEntry || typeof fieldEntry !== 'object') {
      continue;
    }
    const fieldRecord = fieldEntry as Record<string, unknown>;
    const reasons = fieldRecord.reasons;
    if (!Array.isArray(reasons)) {
      continue;
    }
    const reason = reasons.find(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim().length > 0,
    );
    if (!reason) {
      continue;
    }

    const fieldName =
      typeof fieldRecord.field === 'string' ? fieldRecord.field.trim() : '';
    return fieldName.length > 0 ? `${fieldName}: ${reason}` : reason;
  }

  return null;
};

const extractApiErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const body = payload as Record<string, unknown>;
  const topLevelValidationMessage = extractFieldValidationMessage(body.details);
  if (topLevelValidationMessage) {
    return topLevelValidationMessage;
  }

  const nestedError = body.error;
  if (nestedError && typeof nestedError === 'object') {
    const nestedValidationMessage = extractFieldValidationMessage(
      (nestedError as Record<string, unknown>).details,
    );
    if (nestedValidationMessage) {
      return nestedValidationMessage;
    }
  }

  const message = body.message;
  if (Array.isArray(message) && message.length > 0) {
    const first = message.find(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    if (first) {
      return first;
    }
  }
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  if (nestedError && typeof nestedError === 'object') {
    const nestedMessage = (nestedError as Record<string, unknown>).message;
    if (typeof nestedMessage === 'string' && nestedMessage.length > 0) {
      return nestedMessage;
    }
  }

  if (typeof body.error === 'string' && body.error.length > 0) {
    return body.error;
  }

  return fallback;
};

const readErrorPayload = async (response: Response): Promise<unknown> => {
  const jsonPayload = await response.clone().json().catch(() => null);
  if (jsonPayload !== null) {
    return jsonPayload;
  }

  const textPayload = await response.text().catch(() => '');
  if (typeof textPayload === 'string' && textPayload.trim().length > 0) {
    return textPayload;
  }

  return null;
};

const updateConditionFieldModeFromField = (field: unknown): void => {
  if (typeof field !== 'string') {
    return;
  }

  if (legacyConditionFields.has(field)) {
    conditionFieldMode = 'legacy';
    return;
  }

  if (canonicalConditionFields.has(field) && conditionFieldMode === 'unknown') {
    conditionFieldMode = 'canonical';
  }
};

const normalizeConditionFieldFromServer = (field: unknown): unknown => {
  updateConditionFieldModeFromField(field);
  if (typeof field !== 'string') {
    return field;
  }
  return legacyToCanonicalConditionFieldMap[field] ?? field;
};

const normalizeAutomationRuleDetail = (
  rule: AutomationRuleDetailDto,
): AutomationRuleDetailDto => {
  if (!Array.isArray(rule.conditions)) {
    return rule;
  }

  return {
    ...rule,
    conditions: rule.conditions.map((condition) => ({
      ...condition,
      field: normalizeConditionFieldFromServer(
        condition.field,
      ) as typeof condition.field,
    })),
  };
};

const mapPayloadConditionFieldsForMode = <
  T extends CreateAutomationRuleDto | UpdateAutomationRuleDto,
>(
  payload: T,
  mode: ConditionFieldMode,
): T => {
  if (mode !== 'legacy' || !Array.isArray(payload.conditions)) {
    return payload;
  }

  return {
    ...payload,
    conditions: payload.conditions.map((condition) => ({
      ...condition,
      field:
        typeof condition.field === 'string'
          ? canonicalToLegacyConditionFieldMap[condition.field] ?? condition.field
          : condition.field,
    })),
  };
};

const shouldRetryRuleSaveWithLegacyFields = (
  payload: unknown,
): boolean => {
  const serialized =
    typeof payload === 'string'
      ? payload
      : JSON.stringify(payload ?? {});
  const lower = serialized.toLowerCase();

  const hasConditionFieldError =
    lower.includes('conditions') &&
    lower.includes('field');
  const hasEnumValidationMessage = lower.includes(
    'must be one of the following values',
  );
  const hasLegacyHint =
    serialized.includes('event.isAllDay') ||
    serialized.includes('event.calendarId') ||
    serialized.includes('event.calendarName');

  return (
    hasConditionFieldError &&
    (hasLegacyHint || hasEnumValidationMessage)
  );
};

const saveRuleWithCompatibility = async (
  url: string,
  method: 'POST' | 'PUT',
  payload: CreateAutomationRuleDto | UpdateAutomationRuleDto,
): Promise<AutomationRuleDetailDto> => {
  const preferredMode: ConditionFieldMode =
    conditionFieldMode === 'legacy' ? 'legacy' : 'canonical';
  const primaryPayload = mapPayloadConditionFieldsForMode(payload, preferredMode);

  let response = await apiFetch(url, {
    method,
    body: JSON.stringify(primaryPayload),
  });

  if (response.ok) {
    const body = (await response.json()) as AutomationRuleDetailDto;
    return normalizeAutomationRuleDetail(body);
  }

  const primaryErrorPayload = await readErrorPayload(response);
  const canRetryLegacy =
    response.status === 400 &&
    preferredMode !== 'legacy' &&
    Array.isArray(payload.conditions) &&
    payload.conditions.length > 0 &&
    shouldRetryRuleSaveWithLegacyFields(primaryErrorPayload);

  if (canRetryLegacy) {
    conditionFieldMode = 'legacy';
    const legacyPayload = mapPayloadConditionFieldsForMode(payload, 'legacy');
    response = await apiFetch(url, {
      method,
      body: JSON.stringify(legacyPayload),
    });

    if (response.ok) {
      const body = (await response.json()) as AutomationRuleDetailDto;
      return normalizeAutomationRuleDetail(body);
    }

    const retryErrorPayload = await readErrorPayload(response);
    throw new Error(
      extractApiErrorMessage(retryErrorPayload, `HTTP ${response.status}`),
    );
  }

  throw new Error(
    extractApiErrorMessage(primaryErrorPayload, `HTTP ${response.status}`),
  );
};

const toCreateConditionDto = (
  source: AutomationRuleDetailDto['conditions'][number],
): CreateAutomationRuleDto['conditions'][number] => ({
  field: source.field,
  operator: source.operator,
  value: source.value,
  ...(source.groupId ? { groupId: source.groupId } : {}),
  logicOperator: source.logicOperator,
  order: source.order,
});

const toCreateActionDto = (
  source: AutomationRuleDetailDto['actions'][number],
): CreateAutomationRuleDto['actions'][number] => ({
  actionType: source.actionType,
  actionConfig: source.actionConfig,
  order: source.order,
});

const buildCreatePayloadFromUpdate = (
  existingRule: AutomationRuleDetailDto,
  updateData: UpdateAutomationRuleDto,
): CreateAutomationRuleDto => {
  const conditions =
    updateData.conditions ??
    existingRule.conditions.map((condition) => toCreateConditionDto(condition));
  const actions =
    updateData.actions ??
    existingRule.actions.map((action) => toCreateActionDto(action));

  return {
    name: updateData.name ?? existingRule.name,
    ...(updateData.description !== undefined
      ? { description: updateData.description }
      : existingRule.description !== null
        ? { description: existingRule.description }
        : {}),
    triggerType: existingRule.triggerType,
    ...(updateData.triggerConfig !== undefined
      ? { triggerConfig: updateData.triggerConfig }
      : existingRule.triggerConfig
        ? { triggerConfig: existingRule.triggerConfig }
        : {}),
    isEnabled: updateData.isEnabled ?? existingRule.isEnabled,
    conditionLogic: updateData.conditionLogic ?? existingRule.conditionLogic,
    conditions,
    actions,
  };
};

const shouldFallbackToRuleRecreate = (
  updateData: UpdateAutomationRuleDto,
  error: unknown,
): boolean => {
  if (!updateData.conditions && !updateData.actions) {
    return false;
  }

  const message =
    error instanceof Error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';

  return (
    message.includes('400') ||
    message.includes('validation') ||
    message.includes('should not exist') ||
    message.includes('must be one of the following values') ||
    message.length === 0
  );
};

const updateRuleWithLegacyFallback = async (
  ruleId: number,
  updateData: UpdateAutomationRuleDto,
): Promise<AutomationRuleDetailDto> => {
  const existingRule = await getAutomationRule(ruleId);
  const createPayload = buildCreatePayloadFromUpdate(existingRule, updateData);

  const desiredName = createPayload.name;
  const shouldUseTemporaryName = desiredName === existingRule.name;
  const tempSuffix = ` [m${Date.now().toString(36)}]`;
  const maxBaseLength = Math.max(1, 200 - tempSuffix.length);
  const temporaryName = `${desiredName.slice(0, maxBaseLength)}${tempSuffix}`;

  const recreatedRule = await createAutomationRule({
    ...createPayload,
    name: shouldUseTemporaryName ? temporaryName : desiredName,
  });
  await deleteAutomationRule(ruleId);

  if (shouldUseTemporaryName) {
    return saveRuleWithCompatibility(
      `${BASE_URL}/api/automation/rules/${recreatedRule.id}`,
      'PUT',
      { name: desiredName },
    );
  }

  return recreatedRule;
};

/**
 * Handle API response and throw errors for non-2xx responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await readErrorPayload(response);
    throw new Error(
      extractApiErrorMessage(errorData, `HTTP ${response.status}`),
    );
  }
  return response.json();
}

// ===== Automation Rule CRUD Operations =====

/**
 * Get all automation rules for the current user with pagination
 */
export async function getAutomationRules(
  page: number = 1,
  limit: number = 20,
  enabled?: boolean
): Promise<PaginatedAutomationRulesDto> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (enabled !== undefined) {
    params.append('enabled', enabled.toString());
  }

  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules?${params.toString()}`,
    {
      method: 'GET',
    }
  );

  return handleResponse<PaginatedAutomationRulesDto>(response);
}

/**
 * Get a single automation rule by ID with full details
 */
export async function getAutomationRule(
  ruleId: number
): Promise<AutomationRuleDetailDto> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}`,
    {
      method: 'GET',
    }
  );

  const rule = await handleResponse<AutomationRuleDetailDto>(response);
  return normalizeAutomationRuleDetail(rule);
}

/**
 * Create a new automation rule
 */
export async function createAutomationRule(
  ruleData: CreateAutomationRuleDto
): Promise<AutomationRuleDetailDto> {
  return saveRuleWithCompatibility(
    `${BASE_URL}/api/automation/rules`,
    'POST',
    ruleData,
  );
}

/**
 * Update an existing automation rule
 */
export async function updateAutomationRule(
  ruleId: number,
  updateData: UpdateAutomationRuleDto
): Promise<AutomationRuleDetailDto> {
  try {
    return await saveRuleWithCompatibility(
      `${BASE_URL}/api/automation/rules/${ruleId}`,
      'PUT',
      updateData,
    );
  } catch (error) {
    if (shouldFallbackToRuleRecreate(updateData, error)) {
      return updateRuleWithLegacyFallback(ruleId, updateData);
    }
    throw error;
  }
}

/**
 * Delete an automation rule
 */
export async function deleteAutomationRule(ruleId: number): Promise<void> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to delete rule',
    }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
}

/**
 * Toggle a rule's enabled status
 */
export async function toggleAutomationRule(
  ruleId: number,
  enabled: boolean
): Promise<AutomationRuleDetailDto> {
  return updateAutomationRule(ruleId, { isEnabled: enabled });
}

/**
 * Regenerate webhook token for a rule
 */
export async function regenerateWebhookToken(
  ruleId: number
): Promise<{ webhookToken: string }> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}/webhook/regenerate`,
    {
      method: 'POST',
    }
  );

  return handleResponse<{ webhookToken: string }>(response);
}

// ===== Retroactive Execution =====

/**
 * Execute a rule retroactively on all user's events
 */
export async function executeRuleNow(
  ruleId: number
): Promise<{ message: string; executionCount: number }> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}/execute`,
    {
      method: 'POST',
      // Run-now can process many events and often exceeds default 15s timeout.
      timeoutMs: 180_000,
    }
  );

  return handleResponse<{ message: string; executionCount: number }>(response);
}

// ===== Audit Logs =====

/**
 * Get audit logs for a specific rule with filtering
 */
export async function getAuditLogs(
  ruleId: number,
  query?: AuditLogQueryDto
): Promise<AuditLogDto[]> {
  const params = new URLSearchParams();

  if (query?.status) params.append('status', query.status);
  if (query?.fromDate) params.append('fromDate', query.fromDate);
  if (query?.toDate) params.append('toDate', query.toDate);
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  const url = `${BASE_URL}/api/automation/rules/${ruleId}/audit-logs${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await apiFetch(url, {
    method: 'GET',
  });

  const paginatedResponse = await handleResponse<{ data: AuditLogDto[]; pagination: PaginationState }>(response);
  return paginatedResponse.data;
}

/**
 * Get audit log statistics for a rule
 */
export async function getAuditLogStats(
  ruleId: number
): Promise<AuditLogStatsDto> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}/stats`,
    {
      method: 'GET',
    }
  );

  return handleResponse<AuditLogStatsDto>(response);
}

/**
 * Get all audit logs for the user (across all rules)
 */
export async function getAllAuditLogs(
  query?: Omit<AuditLogQueryDto, 'ruleId'>
): Promise<AuditLogDto[]> {
  const params = new URLSearchParams();

  if (query?.status) params.append('status', query.status);
  if (query?.fromDate) params.append('fromDate', query.fromDate);
  if (query?.toDate) params.append('toDate', query.toDate);
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  const url = `${BASE_URL}/api/automation/audit-logs${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await apiFetch(url, {
    method: 'GET',
  });

  return handleResponse<AuditLogDto[]>(response);
}

// ===== Helper Functions =====

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return sessionManager.hasActiveSession();
}

/**
 * Format execution time in milliseconds to human-readable string
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffDay < 30)
    return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
  if (diffDay < 365)
    return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;

  return then.toLocaleDateString();
}

/**
 * Get status color for UI
 */
export function getStatusColor(
  status: string
): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'success':
      return 'green';
    case 'partial_success':
      return 'yellow';
    case 'failure':
      return 'red';
    case 'skipped':
      return 'gray';
    default:
      return 'gray';
  }
}

// ===== Default Export =====

export const automationService = {
  getAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  regenerateWebhookToken,
  executeRuleNow,
  getAuditLogs,
  getAuditLogStats,
  getAllAuditLogs,
};
