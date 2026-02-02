import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionResolverService } from '../services/permission-resolver.service';

export type OrganizationAccessAction = 'view' | 'admin' | 'editSettings';

export interface OrganizationAccessPolicy {
  canAdminOrganization(userId: number, orgId: number): Promise<boolean>;
  canViewOrganization(userId: number, orgId: number): Promise<boolean>;
  canEditOrganizationSettings(userId: number, orgId: number): Promise<boolean>;
}

export const ORGANIZATION_ACCESS_ACTION_KEY = 'organizationAccessAction';
export const ORGANIZATION_ACCESS_MESSAGE_KEY = 'organizationAccessMessage';

@Injectable()
export class OrganizationAccessGuard
  implements CanActivate, OrganizationAccessPolicy
{
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action =
      this.reflector.get<OrganizationAccessAction>(
        ORGANIZATION_ACCESS_ACTION_KEY,
        context.getHandler(),
      ) || 'view';
    const customMessage =
      this.reflector.get<string>(
        ORGANIZATION_ACCESS_MESSAGE_KEY,
        context.getHandler(),
      ) || undefined;

    const request = context.switchToHttp().getRequest();
    const orgId = Number(request?.params?.id ?? request?.params?.orgId);
    const userId = Number(request?.user?.id);

    if (!orgId || !userId) {
      throw new NotFoundException('Organisation not found or access denied');
    }

    if (action === 'admin') {
      return this.assertAccess(
        this.canAdminOrganization(userId, orgId),
        new ForbiddenException(
          customMessage ??
            'You do not have permission to administer this organisation',
        ),
      );
    }

    if (action === 'editSettings') {
      return this.assertAccess(
        this.canEditOrganizationSettings(userId, orgId),
        new ForbiddenException(
          customMessage ??
            'You do not have permission to update this organisation',
        ),
      );
    }

    return this.assertAccess(
      this.canViewOrganization(userId, orgId),
      new NotFoundException(
        customMessage ?? 'Organisation not found or access denied',
      ),
    );
  }

  async canAdminOrganization(userId: number, orgId: number): Promise<boolean> {
    return this.permissionResolver.canUserAdminOrganization(userId, orgId);
  }

  async canViewOrganization(userId: number, orgId: number): Promise<boolean> {
    return this.permissionResolver.canUserAccessOrganization(userId, orgId);
  }

  async canEditOrganizationSettings(
    userId: number,
    orgId: number,
  ): Promise<boolean> {
    return this.permissionResolver.canUserModifyOrganizationSettings(
      userId,
      orgId,
    );
  }

  private async assertAccess(
    accessPromise: Promise<boolean>,
    error: Error,
  ): Promise<boolean> {
    const canAccess = await accessPromise;
    if (!canAccess) {
      throw error;
    }
    return true;
  }
}
