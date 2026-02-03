import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from '../services/request-context.service';
import type { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class RequestContextUserInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    if (req?.user?.id) {
      this.requestContext.attachUser(req.user.id);
    }
    return next.handle().pipe(
      tap(() => {
        if (req?.user?.id) {
          this.requestContext.attachUser(req.user.id);
        }
      }),
    );
  }
}
