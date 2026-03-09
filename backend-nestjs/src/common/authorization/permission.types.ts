import { OrganisationRoleType } from '../../entities/organisation-user.entity';
import { UserRole } from '../../entities/user.entity';

export const RESOURCE_ACTIONS = ['read', 'write', 'delete', 'admin'] as const;
export type ResourceAction = (typeof RESOURCE_ACTIONS)[number];

export const SECURITY_RESOURCES = [
  'organisation',
  'reservation',
  'resource',
  'resource_type',
  'reservation_calendar',
  'calendar',
  'task',
  'automation',
] as const;
export type SecurityResource = (typeof SECURITY_RESOURCES)[number];

export type Permission = `${SecurityResource}:${ResourceAction}`;

export interface PermissionRequirement {
  permission: Permission;
  organisationIdParam?: string;
  organisationIdHeader?: string;
}

export type RequiredRole = UserRole | OrganisationRoleType;

export interface PermissionContext {
  organisationId?: number;
}

export const ORGANISATION_PERMISSIONS = {
  READ: 'organisation:read',
  WRITE: 'organisation:write',
  DELETE: 'organisation:delete',
  ADMIN: 'organisation:admin',
} as const satisfies Record<string, Permission>;

export const RESERVATION_PERMISSIONS = {
  READ: 'reservation:read',
  WRITE: 'reservation:write',
  DELETE: 'reservation:delete',
  ADMIN: 'reservation:admin',
} as const satisfies Record<string, Permission>;

export const RESOURCE_PERMISSIONS = {
  READ: 'resource:read',
  WRITE: 'resource:write',
  DELETE: 'resource:delete',
  ADMIN: 'resource:admin',
} as const satisfies Record<string, Permission>;

export const RESOURCE_TYPE_PERMISSIONS = {
  READ: 'resource_type:read',
  WRITE: 'resource_type:write',
  DELETE: 'resource_type:delete',
  ADMIN: 'resource_type:admin',
} as const satisfies Record<string, Permission>;

export const RESERVATION_CALENDAR_PERMISSIONS = {
  READ: 'reservation_calendar:read',
  WRITE: 'reservation_calendar:write',
  DELETE: 'reservation_calendar:delete',
  ADMIN: 'reservation_calendar:admin',
} as const satisfies Record<string, Permission>;

export const ORGANISATION_ROLE_LEVEL: Record<OrganisationRoleType, number> = {
  [OrganisationRoleType.USER]: 10,
  [OrganisationRoleType.EDITOR]: 20,
  [OrganisationRoleType.ADMIN]: 30,
};

export const GLOBAL_ROLE_LEVEL: Record<UserRole, number> = {
  [UserRole.OBSERVER]: 10,
  [UserRole.USER]: 20,
  [UserRole.ADMIN]: 100,
};

