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

    const orgHeader = req.headers['x-org-id'] ?? req.headers['x-organisation-id'];
    const orgIdRaw = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader;
    const parsedOrgId = Number(orgIdRaw);
    const organisationId = Number.isFinite(parsedOrgId) ? parsedOrgId : undefined;

    const resourceTypeHeader = req.headers['x-resource-type'];
    const resourceTypeRaw = Array.isArray(resourceTypeHeader)
      ? resourceTypeHeader[0]
      : resourceTypeHeader;
    const resourceIdHeader = req.headers['x-resource-id'];
    const resourceIdRaw = Array.isArray(resourceIdHeader)
      ? resourceIdHeader[0]
      : resourceIdHeader;

    const pathResourceId =
      typeof req.params?.id === 'string' ? req.params.id : undefined;

    res.setHeader('x-request-id', requestId);
    (req as Request & { requestId: string }).requestId = requestId;

    this.requestContext.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl ?? req.url,
        ip: req.ip,
        organisationId,
        resourceType:
          typeof resourceTypeRaw === 'string' ? resourceTypeRaw : undefined,
        resourceId:
          typeof resourceIdRaw === 'string'
            ? resourceIdRaw
            : pathResourceId,
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
