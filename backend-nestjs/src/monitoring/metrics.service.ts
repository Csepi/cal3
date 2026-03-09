import { Injectable } from '@nestjs/common';

interface RequestSample {
  timestamp: number;
  durationMs: number;
  statusCode: number;
  method: string;
  route: string;
}

export interface MetricsSnapshot {
  totalRequests: number;
  totalErrors: number;
  errorRatePercent: number;
  p95DurationMs: number;
  routeStats: Array<{
    method: string;
    route: string;
    count: number;
    errors: number;
    avgDurationMs: number;
  }>;
}

@Injectable()
export class MetricsService {
  private readonly samples: RequestSample[] = [];
  private readonly maxSamples = 10000;

  recordRequest(sample: RequestSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
  }

  getSnapshot(windowMinutes = 15): MetricsSnapshot {
    const cutoff = Date.now() - Math.max(windowMinutes, 1) * 60 * 1000;
    const windowSamples = this.samples.filter((sample) => sample.timestamp >= cutoff);

    const totalRequests = windowSamples.length;
    const totalErrors = windowSamples.filter((sample) => sample.statusCode >= 500).length;
    const errorRatePercent =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const p95DurationMs = percentile(
      windowSamples.map((sample) => sample.durationMs),
      95,
    );

    const grouped = new Map<
      string,
      {
        method: string;
        route: string;
        count: number;
        errors: number;
        totalDuration: number;
      }
    >();

    for (const sample of windowSamples) {
      const key = `${sample.method}:${sample.route}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalDuration += sample.durationMs;
        if (sample.statusCode >= 500) {
          existing.errors += 1;
        }
      } else {
        grouped.set(key, {
          method: sample.method,
          route: sample.route,
          count: 1,
          errors: sample.statusCode >= 500 ? 1 : 0,
          totalDuration: sample.durationMs,
        });
      }
    }

    const routeStats = Array.from(grouped.values())
      .map((entry) => ({
        method: entry.method,
        route: entry.route,
        count: entry.count,
        errors: entry.errors,
        avgDurationMs: entry.count > 0 ? entry.totalDuration / entry.count : 0,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 50);

    return {
      totalRequests,
      totalErrors,
      errorRatePercent,
      p95DurationMs,
      routeStats,
    };
  }

  toPrometheus(windowMinutes = 15): string {
    const snapshot = this.getSnapshot(windowMinutes);
    const lines: string[] = [
      '# HELP cal3_http_requests_total HTTP requests in rolling window',
      '# TYPE cal3_http_requests_total gauge',
      `cal3_http_requests_total ${snapshot.totalRequests}`,
      '# HELP cal3_http_errors_total HTTP 5xx responses in rolling window',
      '# TYPE cal3_http_errors_total gauge',
      `cal3_http_errors_total ${snapshot.totalErrors}`,
      '# HELP cal3_http_error_rate_percent HTTP error rate percentage in rolling window',
      '# TYPE cal3_http_error_rate_percent gauge',
      `cal3_http_error_rate_percent ${snapshot.errorRatePercent.toFixed(4)}`,
      '# HELP cal3_http_duration_p95_ms p95 response duration in milliseconds',
      '# TYPE cal3_http_duration_p95_ms gauge',
      `cal3_http_duration_p95_ms ${snapshot.p95DurationMs.toFixed(2)}`,
    ];

    for (const route of snapshot.routeStats) {
      const labels = `method="${escapeLabel(route.method)}",route="${escapeLabel(route.route)}"`;
      lines.push(
        `cal3_http_route_requests_total{${labels}} ${route.count}`,
        `cal3_http_route_errors_total{${labels}} ${route.errors}`,
        `cal3_http_route_avg_duration_ms{${labels}} ${route.avgDurationMs.toFixed(2)}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }
}

const percentile = (values: number[], percentileValue: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
};

const escapeLabel = (value: string): string => {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};
