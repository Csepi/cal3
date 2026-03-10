import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AbusePreventionService } from '../services/abuse-prevention.service';

@Injectable()
export class IpBlockMiddleware implements NestMiddleware {
  constructor(private readonly abusePrevention: AbusePreventionService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await this.abusePrevention.assertIpAllowed(req.ip);
      next();
    } catch (error) {
      next(error);
    }
  }
}
