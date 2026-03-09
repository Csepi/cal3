import { Injectable, Logger } from '@nestjs/common';

interface TraceSpan {
  name: string;
  startedAt: number;
  attributes: Record<string, unknown>;
}

@Injectable()
export class OpenTelemetryService {
  private readonly logger = new Logger(OpenTelemetryService.name);
  private readonly enabled =
    process.env.OTEL_ENABLED === 'true' ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

  beginSpan(name: string, attributes: Record<string, unknown> = {}): TraceSpan {
    return {
      name,
      startedAt: Date.now(),
      attributes,
    };
  }

  endSpan(span: TraceSpan, extra: Record<string, unknown> = {}): void {
    if (!this.enabled) return;
    this.logger.debug(
      JSON.stringify({
        type: 'otel-span',
        name: span.name,
        durationMs: Date.now() - span.startedAt,
        attributes: {
          ...span.attributes,
          ...extra,
        },
      }),
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
