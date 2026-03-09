import type { LogEntry } from './types';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

export interface ParsedLogEntry extends LogEntry {
  requestId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userId?: number;
  organisationId?: number;
  resourceType?: string;
  resourceId?: string;
  metadataText: string;
  latencyMs?: number;
  hasStack: boolean;
  isApiException: boolean;
  isAuthRelated: boolean;
}

export interface ClientLogFilters {
  methods: string[];
  requestId: string;
  pathContains: string;
  userId: string;
  organisationId: string;
  onlyWithStack: boolean;
  onlyErrors: boolean;
  onlyApiExceptions: boolean;
  onlyAuthRelated: boolean;
}

export interface RequestLogGroup {
  id: string;
  requestId: string | null;
  entries: ParsedLogEntry[];
  startedAt: string;
  endedAt: string;
  errorCount: number;
  methods: string[];
  paths: string[];
  contexts: string[];
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const extractString = (
  metadata: Record<string, unknown> | null,
  key: string,
): string | undefined => {
  const value = metadata?.[key];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const extractNumber = (
  metadata: Record<string, unknown> | null,
  key: string,
): number | undefined => {
  const value = metadata?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseMethodFromMessage = (message: string): string | undefined => {
  const match = message.match(/\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/i);
  if (!match) {
    return undefined;
  }
  const method = match[1].toUpperCase();
  return HTTP_METHODS.has(method) ? method : undefined;
};

const parsePathFromMessage = (message: string): string | undefined => {
  const match = message.match(
    /\b(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+([^\s]+)\s+->/i,
  );
  if (!match?.[1]) {
    return undefined;
  }
  return match[1];
};

const parseRequestIdFromMessage = (message: string): string | undefined => {
  const match = message.match(/\[([0-9a-f]{8}-[0-9a-f-]{27,})\]/i);
  return match?.[1];
};

const parseLatency = (message: string): number | undefined => {
  const match = message.match(/\((\d+)ms\)/);
  if (!match?.[1]) {
    return undefined;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseLogEntry = (entry: LogEntry): ParsedLogEntry => {
  const metadata = asRecord(entry.metadata ?? null);
  const message = entry.message ?? '';
  const method = (
    extractString(metadata, 'method') ?? parseMethodFromMessage(message)
  )?.toUpperCase();

  const parsedMethod = method && HTTP_METHODS.has(method) ? method : undefined;
  const path = extractString(metadata, 'path') ?? parsePathFromMessage(message);
  const requestId =
    extractString(metadata, 'requestId') ?? parseRequestIdFromMessage(message);

  const metadataText = metadata ? JSON.stringify(metadata).toLowerCase() : '';
  const messageLower = message.toLowerCase();
  const contextLower = (entry.context ?? '').toLowerCase();
  const pathLower = (path ?? '').toLowerCase();

  return {
    ...entry,
    requestId,
    method: parsedMethod,
    path,
    ip: extractString(metadata, 'ip'),
    userId: extractNumber(metadata, 'userId'),
    organisationId: extractNumber(metadata, 'organisationId'),
    resourceType: extractString(metadata, 'resourceType'),
    resourceId: extractString(metadata, 'resourceId'),
    metadataText,
    latencyMs: parseLatency(message),
    hasStack: Boolean(entry.stack && entry.stack.trim().length > 0),
    isApiException:
      contextLower.includes('allexceptionsfilter') ||
      messageLower.includes('api.exception'),
    isAuthRelated:
      contextLower.includes('auth') ||
      pathLower.includes('/auth') ||
      messageLower.includes('jwt') ||
      messageLower.includes('csrf'),
  };
};

const normalizeForSearch = (value: string): string => value.trim().toLowerCase();

export const applyClientLogFilters = (
  logs: ParsedLogEntry[],
  filters: ClientLogFilters,
): ParsedLogEntry[] => {
  const methodSet = new Set(filters.methods.map((method) => method.toUpperCase()));
  const requestIdFilter = normalizeForSearch(filters.requestId);
  const pathFilter = normalizeForSearch(filters.pathContains);

  const userIdFilter =
    filters.userId.trim().length > 0 ? Number(filters.userId.trim()) : null;
  const orgIdFilter =
    filters.organisationId.trim().length > 0
      ? Number(filters.organisationId.trim())
      : null;

  return logs.filter((log) => {
    if (methodSet.size > 0 && (!log.method || !methodSet.has(log.method))) {
      return false;
    }

    if (
      requestIdFilter &&
      !((log.requestId ?? '').toLowerCase().includes(requestIdFilter))
    ) {
      return false;
    }

    if (pathFilter && !((log.path ?? '').toLowerCase().includes(pathFilter))) {
      return false;
    }

    if (
      userIdFilter !== null &&
      (!Number.isFinite(userIdFilter) || log.userId !== userIdFilter)
    ) {
      return false;
    }

    if (
      orgIdFilter !== null &&
      (!Number.isFinite(orgIdFilter) || log.organisationId !== orgIdFilter)
    ) {
      return false;
    }

    if (filters.onlyWithStack && !log.hasStack) {
      return false;
    }

    if (filters.onlyErrors && log.level !== 'error') {
      return false;
    }

    if (filters.onlyApiExceptions && !log.isApiException) {
      return false;
    }

    if (filters.onlyAuthRelated && !log.isAuthRelated) {
      return false;
    }

    return true;
  });
};

export const sortParsedLogs = (
  logs: ParsedLogEntry[],
  direction: 'newest' | 'oldest',
): ParsedLogEntry[] => {
  const multiplier = direction === 'newest' ? -1 : 1;
  return [...logs].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return (leftTime - rightTime) * multiplier;
  });
};

export const buildRequestGroups = (logs: ParsedLogEntry[]): RequestLogGroup[] => {
  const grouped = new Map<string, ParsedLogEntry[]>();

  for (const log of logs) {
    const key = log.requestId ? `request:${log.requestId}` : `single:${log.id}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(log);
    } else {
      grouped.set(key, [log]);
    }
  }

  const groups: RequestLogGroup[] = [];
  grouped.forEach((entries, key) => {
    const sortedEntries = [...entries].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
    const startedAt = sortedEntries[0]?.createdAt ?? new Date().toISOString();
    const endedAt =
      sortedEntries[sortedEntries.length - 1]?.createdAt ?? startedAt;

    const methods = Array.from(
      new Set(sortedEntries.map((entry) => entry.method).filter(Boolean)),
    ) as string[];
    const paths = Array.from(
      new Set(sortedEntries.map((entry) => entry.path).filter(Boolean)),
    ) as string[];
    const contexts = Array.from(
      new Set(sortedEntries.map((entry) => entry.context).filter(Boolean)),
    ) as string[];

    groups.push({
      id: key,
      requestId: sortedEntries[0]?.requestId ?? null,
      entries: sortedEntries,
      startedAt,
      endedAt,
      errorCount: sortedEntries.filter((entry) => entry.level === 'error').length,
      methods,
      paths,
      contexts,
    });
  });

  return groups.sort(
    (left, right) =>
      new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
};

export const computePercentile = (
  values: number[],
  percentile: number,
): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const bounded = Math.min(100, Math.max(0, percentile));
  const rank = Math.ceil((bounded / 100) * sorted.length) - 1;
  return sorted[Math.max(0, rank)];
};

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
};

export const toCsv = (logs: ParsedLogEntry[]): string => {
  const headers = [
    'id',
    'createdAt',
    'level',
    'context',
    'requestId',
    'method',
    'path',
    'ip',
    'userId',
    'organisationId',
    'resourceType',
    'resourceId',
    'latencyMs',
    'message',
    'stack',
    'metadata',
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.createdAt,
      log.level,
      log.context ?? '',
      log.requestId ?? '',
      log.method ?? '',
      log.path ?? '',
      log.ip ?? '',
      log.userId ?? '',
      log.organisationId ?? '',
      log.resourceType ?? '',
      log.resourceId ?? '',
      log.latencyMs ?? '',
      log.message,
      log.stack ?? '',
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]
      .map(escapeCsvValue)
      .join(','),
  );

  return `${headers.join(',')}\n${rows.join('\n')}`;
};
