import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  isOriginAllowed,
  resolveAllowedOrigins,
} from '../security/security.config';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class StrictOriginMiddleware implements NestMiddleware {
  private readonly logger = new Logger(StrictOriginMiddleware.name);
  private readonly allowedOrigins = resolveAllowedOrigins();

  use(req: Request, _res: Response, next: NextFunction): void {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const originHeader = req.headers.origin;
    if (!originHeader) {
      next();
      return;
    }

    if (
      !isOriginAllowed(
        Array.isArray(originHeader) ? originHeader[0] : originHeader,
        this.allowedOrigins,
      )
    ) {
      this.logger.warn(
        `Blocked mutating request from disallowed origin ${originHeader} (${req.method} ${req.originalUrl ?? req.url})`,
      );
      next(new ForbiddenException('Origin not allowed'));
      return;
    }

    next();
  }
}

