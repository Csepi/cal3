import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPermissionsService } from '../../common/services/user-permissions.service';
import { RequestWithUser } from '../../common/types/request-with-user';

import { bStatic } from '../../i18n/runtime';

/**
 * Guard that checks if a user has access to reservation features
 * based on their usage plans (Store or Enterprise)
 */
@Injectable()
export class ReservationAccessGuard implements CanActivate {
  constructor(private userPermissionsService: UserPermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(bStatic('errors.auto.backend.kdc8648114cf5'));
    }

    const hasAccess = this.userPermissionsService.hasReservationAccess(user);

    if (!hasAccess) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k0052f4061080'),
      );
    }

    return true;
  }
}
