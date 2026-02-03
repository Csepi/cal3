import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { AppLoggerService } from './app-logger.service';
import { RequestContextService } from '../common/services/request-context.service';
import type { Request, Response } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const startedAt = Date.now();

    const contextData = this.requestContext.getContext();
    const requestId =
      contextData?.requestId ??
      (request.headers['x-request-id'] as string | undefined) ??
      'n/a';

    this.logger.debug(
      `[HTTP INBOUND] [${requestId}] ${method} ${url}`,
      'HttpRequest',
    );

    return next.handle().pipe(
      tap({
        error: (err: unknown) => {
          const duration = Date.now() - startedAt;
          const status = response.statusCode;
          const message =
            err instanceof Error ? err.message : JSON.stringify(err);
          this.logger.error(
            `[HTTP ERROR] [${requestId}] ${method} ${url} -> ${status} (${duration}ms) :: ${message}`,
            err instanceof Error ? err.stack : undefined,
            'HttpRequest',
          );
        },
      }),
      finalize(() => {
        const duration = Date.now() - startedAt;
        const status = response.statusCode;
        this.logger.log(
          `[HTTP COMPLETE] [${requestId}] ${method} ${url} -> ${status} (${duration}ms)`,
          'HttpRequest',
        );
      }),
    );
  }
}
