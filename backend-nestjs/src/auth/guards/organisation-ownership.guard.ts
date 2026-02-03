import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPermissionsService } from '../../common/services/user-permissions.service';
import { OrganisationRoleType } from '../../entities/organisation-user.entity';
import {
  OrganisationScopeOptions,
  ORGANISATION_SCOPE_KEY,
} from '../../common/decorators/organisation-scope.decorator';
import { RequestWithUser } from '../../common/types/request-with-user';

type ScopedRequest = RequestWithUser & {
  organisationId?: number;
};

@Injectable()
export class OrganisationOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope = this.reflector.getAllAndOverride<OrganisationScopeOptions>(
      ORGANISATION_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!scope) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const organisationId = this.resolveOrganisationId(request, scope);

    if (!organisationId) {
      throw new BadRequestException('Organisation identifier is required.');
    }

    const hasAccess =
      scope.minimumRole === OrganisationRoleType.ADMIN
        ? await this.userPermissionsService.canUserAdminOrganization(
            user.id,
            organisationId,
          )
        : await this.userPermissionsService.canUserAccessOrganization(
            user.id,
            organisationId,
          );

    if (!hasAccess) {
      throw new ForbiddenException('Organisation access denied.');
    }

    request.organisationId = organisationId;
    return true;
  }

  private resolveOrganisationId(
    request: ScopedRequest,
    scope: OrganisationScopeOptions,
  ): number | null {
    const source = scope.source ?? 'params';
    const field = scope.field ?? 'id';

    if (source === 'header') {
      const headerValue =
        request.headers[field.toLowerCase()] ||
        request.headers[`x-${field.toLowerCase()}`];
      return headerValue ? Number(headerValue) : null;
    }

    const container =
      source === 'body'
        ? request.body
        : source === 'query'
          ? request.query
          : request.params;

    const value = container?.[field] ?? request.headers?.['x-organisation-id'];
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
