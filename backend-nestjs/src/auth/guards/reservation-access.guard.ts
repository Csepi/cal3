import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPermissionsService } from '../../common/services/user-permissions.service';
import { RequestWithUser } from '../../common/types/request-with-user';

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
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = this.userPermissionsService.hasReservationAccess(user);

    if (!hasAccess) {
      throw new ForbiddenException(
        'Reservation features require Store or Enterprise plan. Please upgrade your plan to access these features.',
      );
    }

    return true;
  }
}
