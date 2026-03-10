export interface PersonalAuditEvent {
  id: number;
  createdAt: string;
  category: string;
  action: string;
  severity: 'info' | 'warn' | 'critical' | string;
  outcome: 'success' | 'failure' | 'denied' | string;
  requestId?: string | null;
  userId?: number | null;
  organisationId?: number | null;
  resourceType?: string | null;
  resourceId?: string | null;
  method?: string | null;
  path?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PersonalAutomationRun {
  id: number;
  ruleId: number;
  ruleName: string | null;
  status: string;
  triggerType: string;
  executionTimeMs: number;
  executedAt: string;
  executedByUserId: number | null;
}

export interface PersonalAuditSummary {
  totalEvents: number;
  loginSuccessCount: number;
  loginFailureCount: number;
  failedRequestCount: number;
  deniedRequestCount: number;
  apiKeyCallCount: number;
  mcpCallCount: number;
  automationRunCount: number;
}

export interface PersonalAuditFeedResponse {
  events: PersonalAuditEvent[];
  eventCount: number;
  automationRuns: PersonalAutomationRun[];
  summary: PersonalAuditSummary;
}

export interface PersonalAuditQuery {
  categories?: string[];
  outcomes?: string[];
  severities?: string[];
  actions?: string[];
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  includeAutomation?: boolean;
}
