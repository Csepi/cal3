import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { sanitizeInput } from '../validation/input-sanitizer';

@Injectable()
export class RequestSanitizationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    req.body = sanitizeInput(req.body);
    this.sanitizeQueryInPlace(req);
    req.params = sanitizeInput(req.params) as typeof req.params;
    next();
  }

  private sanitizeQueryInPlace(req: Request): void {
    const sanitized = sanitizeInput(req.query);
    if (
      req.query &&
      typeof req.query === 'object' &&
      sanitized &&
      typeof sanitized === 'object' &&
      !Array.isArray(sanitized)
    ) {
      const queryObject = req.query as Record<string, unknown>;
      Object.keys(queryObject).forEach((key) => {
        delete queryObject[key];
      });
      Object.assign(queryObject, sanitized as Record<string, unknown>);
    }
  }
}
