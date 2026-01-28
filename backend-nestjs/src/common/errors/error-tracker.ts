/**
 * Error metric tracked in-memory for quick diagnostics.
 */
export interface ErrorMetric {
  code: string;
  count: number;
  lastSeen: string;
}

const errorCounts = new Map<string, ErrorMetric>();

/**
 * Record an error occurrence for aggregation.
 */
export const recordError = (payload: { code?: string }): void => {
  const code = payload.code || 'UNKNOWN';
  const existing = errorCounts.get(code);
  const now = new Date().toISOString();

  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
  } else {
    errorCounts.set(code, {
      code,
      count: 1,
      lastSeen: now,
    });
  }
};

/**
 * Return a snapshot of error counts by code.
 */
export const getErrorCounts = (): Record<string, number> => {
  const output: Record<string, number> = {};
  errorCounts.forEach((metric, code) => {
    output[code] = metric.count;
  });
  return output;
};

/**
 * Return detailed error metrics including last-seen timestamps.
 */
export const getErrorMetrics = (): ErrorMetric[] => {
  return Array.from(errorCounts.values());
};

/**
 * Reset all tracked error metrics.
 */
export const resetErrorMetrics = (): void => {
  errorCounts.clear();
};
