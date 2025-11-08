import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

export interface RequestContext {
  requestId: string;
  method?: string;
  path?: string;
  ip?: string;
  userId?: number;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  attachUser(userId: number | null | undefined): void {
    const store = this.storage.getStore();
    if (store && typeof userId === 'number') {
      store.userId = userId;
    }
  }

  getRequestId(): string | null {
    return this.storage.getStore()?.requestId ?? null;
  }

  getContext(): RequestContext | null {
    return this.storage.getStore() ?? null;
  }
}
