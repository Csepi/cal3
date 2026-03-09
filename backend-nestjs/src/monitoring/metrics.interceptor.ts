import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = Date.now();
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();
    const route = request.route?.path ?? request.path ?? request.url;
    const method = request.method;

    return next.handle().pipe(
      finalize(() => {
        this.metrics.recordRequest({
          timestamp: Date.now(),
          durationMs: Date.now() - startedAt,
          statusCode: response.statusCode,
          method,
          route,
        });
      }),
    );
  }
}
