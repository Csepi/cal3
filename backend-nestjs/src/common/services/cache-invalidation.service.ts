import { Injectable, Logger } from '@nestjs/common';

export type CacheInvalidationRequest = {
  scope: string;
  keys?: string[];
  metadata?: Record<string, any>;
};

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  invalidate(request: CacheInvalidationRequest): void {
    this.logger.debug(
      JSON.stringify({
        action: 'cache.invalidate',
        scope: request.scope,
        keys: request.keys ?? [],
        metadata: request.metadata ?? {},
        timestamp: new Date(),
      }),
    );
  }
}
