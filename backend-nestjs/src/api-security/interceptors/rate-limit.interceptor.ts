import {
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AdvancedRateLimitService } from '../services/advanced-rate-limit.service';

import { bStatic } from '../../i18n/runtime';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: AdvancedRateLimitService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const decision = await this.rateLimitService.evaluate(request);
    const policy = this.rateLimitService.buildRateLimitPolicy(decision);

    response.setHeader('X-RateLimit-Limit', String(decision.limit));
    response.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    response.setHeader('X-RateLimit-Reset', String(decision.resetAtEpochSeconds));
    response.setHeader('X-RateLimit-Policy', policy);

    if (!decision.allowed) {
      if (decision.retryAfterSeconds) {
        response.setHeader('Retry-After', String(decision.retryAfterSeconds));
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: bStatic('errors.auto.backend.kc4118fd24c92'),
          details: {
            tier: decision.tier,
            category: decision.category,
            retryAfterSeconds: decision.retryAfterSeconds,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
