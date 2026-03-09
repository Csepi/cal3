import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { MetricsService } from './metrics.service';
import { FrontendErrorReportDto } from './dto/frontend-error-report.dto';
import { AuditTrailService } from '../logging/audit-trail.service';
import { AppLoggerService } from '../logging/app-logger.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly auditTrail: AuditTrailService,
    private readonly logger: AppLoggerService,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetricsText(): string {
    return this.metrics.toPrometheus(15);
  }

  @Get('metrics/json')
  getMetricsJson() {
    return {
      success: true,
      data: this.metrics.getSnapshot(15),
    };
  }

  @Post('frontend-errors')
  @HttpCode(202)
  async reportFrontendError(
    @Body() body: FrontendErrorReportDto,
    @Req() req: Request,
  ) {
    const severity = body.severity ?? 'error';
    await this.auditTrail.log({
      category: 'frontend_error',
      action: body.source,
      severity:
        severity === 'error'
          ? 'critical'
          : severity === 'warn'
            ? 'warn'
            : 'info',
      outcome: 'failure',
      errorMessage: body.message,
      metadata: {
        stack: body.stack,
        url: body.url,
        details: body.details ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
      path: body.url ?? req.originalUrl ?? req.url,
      ip: req.ip,
    });

    this.logger.warn(
      `Frontend error reported from ${body.source}: ${body.message}`,
      'FrontendErrorIngest',
    );

    return {
      success: true,
      data: { accepted: true },
    };
  }
}
