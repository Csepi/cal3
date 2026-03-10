import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from './authErrorHandler';
import type {
  PersonalAuditFeedResponse,
  PersonalAuditQuery,
  PersonalAuditSummary,
} from '../types/PersonalAudit';

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
  );
  return handle<PersonalAuditFeedResponse>(response);
}

export async function getPersonalAuditSummary(
  query: PersonalAuditQuery = {},
): Promise<PersonalAuditSummary> {
  const response = await secureFetch(
    `${BASE_URL}/api/users/me/audit/summary${toQueryString(query)}`,
  );
  const payload = await handle<{ summary: PersonalAuditSummary }>(response);
  return payload.summary;
}
