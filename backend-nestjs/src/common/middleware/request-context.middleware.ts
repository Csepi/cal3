import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestIdHeader = (req.headers['x-request-id'] ||
      req.headers['x-requestid']) as string | undefined;
    const requestId = (requestIdHeader ?? randomUUID()).trim();

    res.setHeader('x-request-id', requestId);
    (req as any).requestId = requestId;

    this.requestContext.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl ?? req.url,
        ip: req.ip,
      },
      () => {
        res.on('finish', () => {
          if (res.statusCode >= 500) {
            this.logger.warn(
              `Request ${requestId} failed with status ${res.statusCode} for ${req.method} ${req.originalUrl}`,
            );
          }
        });
        next();
      },
    );
  }
}
