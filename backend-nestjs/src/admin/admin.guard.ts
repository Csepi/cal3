import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../entities/user.entity';

import { bStatic } from '../i18n/runtime';

interface AuthenticatedRequest extends Request {
  user?: {
    role?: UserRole;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(bStatic('errors.auto.backend.kdc8648114cf5'));
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(bStatic('errors.auto.backend.k737b16b6a8b5'));
    }

    return true;
  }
}
