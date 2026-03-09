import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('computes snapshot counters and p95', () => {
    const service = new MetricsService();

    service.recordRequest({
      timestamp: Date.now(),
      durationMs: 100,
      statusCode: 200,
      method: 'GET',
      route: '/api/health',
    });
    service.recordRequest({
      timestamp: Date.now(),
      durationMs: 450,
      statusCode: 500,
      method: 'POST',
      route: '/api/events',
    });
    service.recordRequest({
      timestamp: Date.now(),
      durationMs: 50,
      statusCode: 200,
      method: 'POST',
      route: '/api/events',
    });

    const snapshot = service.getSnapshot(15);
    expect(snapshot.totalRequests).toBe(3);
    expect(snapshot.totalErrors).toBe(1);
    expect(snapshot.errorRatePercent).toBeCloseTo(33.333, 2);
    expect(snapshot.p95DurationMs).toBe(450);
  });

  it('emits Prometheus-compatible text output', () => {
    const service = new MetricsService();
    service.recordRequest({
      timestamp: Date.now(),
      durationMs: 85,
      statusCode: 200,
      method: 'GET',
      route: '/api/tasks',
    });

    const output = service.toPrometheus(15);
    expect(output).toContain('cal3_http_requests_total');
    expect(output).toContain('cal3_http_route_requests_total');
    expect(output).toContain('route="/api/tasks"');
  });
});
