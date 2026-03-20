import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from './authErrorHandler';
import type {
  PersonalAuditFeedResponse,
  PersonalAuditQuery,
  PersonalAuditSummary,
} from '../types/PersonalAudit';
import type {
  DataSubjectRequestListResponse,
  PersonalDataExport,
  PrivacyAccessReport,
  PrivacyConsentRecord,
} from '../types/PrivacyCompliance';

const AUDIT_REQUEST_OPTIONS = {
  timeoutMs: 90_000,
  networkRetries: 1,
} as const;

const toQueryString = (query: PersonalAuditQuery = {}): string => {
  const params = new URLSearchParams();
  query.categories?.forEach((value) => params.append('categories', value));
  query.outcomes?.forEach((value) => params.append('outcomes', value));
  query.severities?.forEach((value) => params.append('severities', value));
  query.actions?.forEach((value) => params.append('actions', value));
  if (query.search) params.append('search', query.search);
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (typeof query.limit === 'number') params.append('limit', String(query.limit));
  if (typeof query.offset === 'number')
    params.append('offset', String(query.offset));
  if (typeof query.includeAutomation === 'boolean') {
    params.append('includeAutomation', String(query.includeAutomation));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
};

const handle = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export async function getPersonalAuditFeed(
  query: PersonalAuditQuery = {},
): Promise<PersonalAuditFeedResponse> {
  const response = await secureFetch(
    `${BASE_URL}/api/users/me/audit${toQueryString(query)}`,
    AUDIT_REQUEST_OPTIONS,
  );
  return handle<PersonalAuditFeedResponse>(response);
}

export async function getPersonalAuditSummary(
  query: PersonalAuditQuery = {},
): Promise<PersonalAuditSummary> {
  const response = await secureFetch(
    `${BASE_URL}/api/users/me/audit/summary${toQueryString(query)}`,
    AUDIT_REQUEST_OPTIONS,
  );
  const payload = await handle<{ summary: PersonalAuditSummary }>(response);
  return payload.summary;
}

export async function getPrivacyAccessReport(): Promise<PrivacyAccessReport> {
  const response = await secureFetch(`${BASE_URL}/api/compliance/me/privacy/access`);
  return handle<PrivacyAccessReport>(response);
}

export async function exportPersonalData(): Promise<PersonalDataExport> {
  const response = await secureFetch(`${BASE_URL}/api/compliance/me/privacy/export`);
  return handle<PersonalDataExport>(response);
}

export async function getPrivacyConsents(): Promise<PrivacyConsentRecord[]> {
  const response = await secureFetch(`${BASE_URL}/api/compliance/me/privacy/consents`);
  return handle<PrivacyConsentRecord[]>(response);
}

export async function upsertPrivacyConsent(
  consentType:
    | 'privacy_policy'
    | 'terms_of_service'
    | 'marketing_email'
    | 'data_processing'
    | 'cookie_analytics',
  payload: {
    decision: 'accepted' | 'revoked';
    policyVersion: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<PrivacyConsentRecord> {
  const response = await secureFetch(
    `${BASE_URL}/api/compliance/me/privacy/consents/${consentType}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  return handle<PrivacyConsentRecord>(response);
}

export async function acceptPrivacyPolicy(version: string): Promise<{
  acceptedAt: string;
  version: string;
  consent: PrivacyConsentRecord;
}> {
  const response = await secureFetch(
    `${BASE_URL}/api/compliance/me/privacy/policy-acceptance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version }),
    },
  );
  return handle<{
    acceptedAt: string;
    version: string;
    consent: PrivacyConsentRecord;
  }>(response);
}

export async function createDataSubjectRequest(payload: {
  requestType: 'access' | 'export' | 'delete';
  reason?: string;
  confirmEmail?: string;
}): Promise<Record<string, unknown>> {
  const response = await secureFetch(`${BASE_URL}/api/compliance/me/privacy/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handle<Record<string, unknown>>(response);
}

export async function listDataSubjectRequests(params?: {
  statuses?: string[];
  requestTypes?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<DataSubjectRequestListResponse> {
  const query = new URLSearchParams();
  params?.statuses?.forEach((value) => query.append('statuses', value));
  params?.requestTypes?.forEach((value) => query.append('requestTypes', value));
  if (params?.search) query.append('search', params.search);
  if (typeof params?.limit === 'number') query.append('limit', String(params.limit));
  if (typeof params?.offset === 'number') query.append('offset', String(params.offset));

  const suffix = query.toString();
  const response = await secureFetch(
    `${BASE_URL}/api/compliance/me/privacy/requests${suffix ? `?${suffix}` : ''}`,
  );
  return handle<DataSubjectRequestListResponse>(response);
}
