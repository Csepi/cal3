import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  REQUIRE_PERMISSION_KEY,
  REQUIRE_ROLE_KEY,
} from './permission.decorators';
import { RbacPermissionService } from './rbac-permission.service';
import type {
  PermissionRequirement,
  PermissionContext,
  RequiredRole,
} from './permission.types';
import type { RequestWithUser } from '../types/request-with-user';
import { UserRole } from '../../entities/user.entity';
import { AuditTrailService } from '../../logging/audit-trail.service';

@Injectable()
export class RbacAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: RbacPermissionService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]) ?? [];

    const requiredRoles =
      this.reflector.getAllAndOverride<RequiredRole[]>(REQUIRE_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (requiredRoles.length > 0) {
      const roleSatisfied = await this.hasAnyRequiredRole(req, requiredRoles);
      if (!roleSatisfied) {
        void this.auditTrailService.logPermissionCheck({
          action: 'rbac.role.requirement',
          allowed: false,
          userId: user.id,
          metadata: { requiredRoles },
        });
        throw new ForbiddenException('Required role is missing');
      }
    }

    for (const permission of requiredPermissions) {
      const contextData = this.resolvePermissionContext(req, permission);
      const allowed = await this.permissionService.hasPermission(
        user,
        permission,
        contextData,
      );
      if (!allowed) {
        void this.auditTrailService.logPermissionCheck({
          action: 'rbac.permission.requirement',
          allowed: false,
          userId: user.id,
          organisationId: contextData.organisationId,
          metadata: { permission: permission.permission },
        });
        throw new ForbiddenException('Required permission is missing');
      }
      void this.auditTrailService.logPermissionCheck({
        action: 'rbac.permission.requirement',
        allowed: true,
        userId: user.id,
        organisationId: contextData.organisationId,
        metadata: { permission: permission.permission },
      });
    }

    return true;
  }

  private async hasAnyRequiredRole(
    req: RequestWithUser,
    requiredRoles: RequiredRole[],
  ): Promise<boolean> {
    for (const role of requiredRoles) {
      const context = this.resolveRoleContext(req, role);
      const allowed = await this.permissionService.hasRequiredRole(
        req.user,
        role,
        context,
      );
      if (allowed) {
        return true;
      }
    }
    return false;
  }

  private resolveRoleContext(
    req: Request,
    role: RequiredRole,
  ): PermissionContext {
    if (
      role === UserRole.ADMIN ||
      role === UserRole.USER ||
      role === UserRole.OBSERVER
    ) {
      return {};
    }
    const organisationId = this.resolveOrganisationId(req);
    return { organisationId };
  }

  private resolvePermissionContext(
    req: Request,
    permission: PermissionRequirement,
  ): PermissionContext {
    const organisationId = this.resolveOrganisationId(
      req,
      permission.organisationIdParam,
      permission.organisationIdHeader,
    );
    return { organisationId };
  }

  private resolveOrganisationId(
    req: Request,
    paramName?: string,
    headerName = 'x-organisation-id',
  ): number | undefined {
    const params = req.params ?? {};
    const headers = req.headers ?? {};

    const paramValue =
      (paramName ? params[paramName] : undefined) ??
      params.organisationId ??
      params.organizationId ??
      params.id;

    const headerValue = headers[headerName];
    const rawValue =
      typeof paramValue === 'string'
        ? paramValue
        : typeof headerValue === 'string'
          ? headerValue
          : Array.isArray(headerValue) && typeof headerValue[0] === 'string'
            ? headerValue[0]
            : undefined;

    const parsed = Number(rawValue);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
    return undefined;
  }
}
