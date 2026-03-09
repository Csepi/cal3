import { SetMetadata } from '@nestjs/common';
import type {
  PermissionRequirement,
  Permission,
  RequiredRole,
} from './permission.types';

export const REQUIRE_PERMISSION_KEY = 'security:required_permissions';
export const REQUIRE_ROLE_KEY = 'security:required_roles';

export interface RequirePermissionOptions {
  organisationIdParam?: string;
  organisationIdHeader?: string;
}

export const RequirePermission = (
  permission: Permission,
  options: RequirePermissionOptions = {},
) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, [
    {
      permission,
      organisationIdParam: options.organisationIdParam,
      organisationIdHeader: options.organisationIdHeader,
    } satisfies PermissionRequirement,
  ]);

export const RequirePermissions = (
  requirements: PermissionRequirement[],
) => SetMetadata(REQUIRE_PERMISSION_KEY, requirements);

export const RequireRole = (...roles: RequiredRole[]) =>
  SetMetadata(REQUIRE_ROLE_KEY, roles);

