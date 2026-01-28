import type {
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  PaginatedAutomationRulesDto,
  AuditLogDto,
  AuditLogQueryDto,
  AuditLogStatsDto,
} from '../types/Automation';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from './authErrorHandler';
import { sessionManager } from './sessionManager';

const apiFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
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

/**
 * Handle API response and throw errors for non-2xx responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
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

  return handleResponse<AutomationRuleDetailDto>(response);
}

/**
 * Create a new automation rule
 */
export async function createAutomationRule(
  ruleData: CreateAutomationRuleDto
): Promise<AutomationRuleDetailDto> {
  const response = await apiFetch(`${BASE_URL}/api/automation/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData),
  });

  return handleResponse<AutomationRuleDetailDto>(response);
}

/**
 * Update an existing automation rule
 */
export async function updateAutomationRule(
  ruleId: number,
  updateData: UpdateAutomationRuleDto
): Promise<AutomationRuleDetailDto> {
  const response = await apiFetch(
    `${BASE_URL}/api/automation/rules/${ruleId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }
  );

  return handleResponse<AutomationRuleDetailDto>(response);
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

  const paginatedResponse = await handleResponse<{ data: AuditLogDto[]; pagination: any }>(response);
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
