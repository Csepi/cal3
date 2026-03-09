import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganisationAdmin } from '../../entities/organisation-admin.entity';
import {
  OrganisationRoleType,
  OrganisationUser,
} from '../../entities/organisation-user.entity';
import { User, UserRole } from '../../entities/user.entity';
import type {
  Permission,
  PermissionRequirement,
  PermissionContext,
  RequiredRole,
  ResourceAction,
} from './permission.types';
import { GLOBAL_ROLE_LEVEL, ORGANISATION_ROLE_LEVEL } from './permission.types';

const ORG_SCOPED_RESOURCES = new Set([
  'organisation',
  'reservation',
  'resource',
  'resource_type',
  'reservation_calendar',
  'calendar',
]);

const ACTION_LEVEL: Record<ResourceAction, number> = {
  read: 10,
  write: 20,
  delete: 30,
  admin: 40,
};

type Matrix = Record<string, Permission[]>;

@Injectable()
export class RbacPermissionService {
  private readonly globalRolePermissions: Matrix = {
    [UserRole.OBSERVER]: [],
    [UserRole.USER]: [],
    [UserRole.ADMIN]: ['organisation:admin'],
  };

  private readonly organisationRolePermissions: Matrix = {
    [OrganisationRoleType.USER]: [
      'organisation:read',
      'reservation:read',
      'resource:read',
      'resource_type:read',
      'reservation_calendar:read',
      'calendar:read',
    ],
    [OrganisationRoleType.EDITOR]: [
      'organisation:read',
      'reservation:write',
      'resource:write',
      'resource_type:write',
      'reservation_calendar:write',
      'calendar:write',
    ],
    [OrganisationRoleType.ADMIN]: [
      'organisation:admin',
      'reservation:admin',
      'resource:admin',
      'resource_type:admin',
      'reservation_calendar:admin',
      'calendar:admin',
    ],
  };

  constructor(
    @InjectRepository(OrganisationUser)
    private readonly organisationUserRepository: Repository<OrganisationUser>,
    @InjectRepository(OrganisationAdmin)
    private readonly organisationAdminRepository: Repository<OrganisationAdmin>,
  ) {}

  async hasRequiredRole(
    user: User,
    requiredRole: RequiredRole,
    context: PermissionContext = {},
  ): Promise<boolean> {
    if (this.isGlobalRole(requiredRole)) {
      return (
        GLOBAL_ROLE_LEVEL[user.role] >= GLOBAL_ROLE_LEVEL[requiredRole]
      );
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (!context.organisationId) {
      return false;
    }

    const effectiveRole = await this.getEffectiveOrganisationRole(
      user.id,
      context.organisationId,
    );
    if (!effectiveRole) {
      return false;
    }
    return (
      ORGANISATION_ROLE_LEVEL[effectiveRole] >=
      ORGANISATION_ROLE_LEVEL[requiredRole]
    );
  }

  async hasPermission(
    user: User,
    requirement: PermissionRequirement,
    context: PermissionContext = {},
  ): Promise<boolean> {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const [resource] = this.splitPermission(requirement.permission);
    if (ORG_SCOPED_RESOURCES.has(resource) && !context.organisationId) {
      return false;
    }

    const grantedPermissions = new Set<Permission>(
      this.globalRolePermissions[user.role] ?? [],
    );

    if (context.organisationId) {
      const organisationRole = await this.getEffectiveOrganisationRole(
        user.id,
        context.organisationId,
      );
      if (organisationRole) {
        for (const permission of this.organisationRolePermissions[
          organisationRole
        ] ?? []) {
          grantedPermissions.add(permission);
        }
      }
    }

    for (const granted of grantedPermissions) {
      if (this.permissionSatisfies(granted, requirement.permission)) {
        return true;
      }
    }
    return false;
  }

  async getEffectiveOrganisationRole(
    userId: number,
    organisationId: number,
  ): Promise<OrganisationRoleType | null> {
    const orgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId },
      select: ['id'],
    });
    if (orgAdmin) {
      return OrganisationRoleType.ADMIN;
    }

    const orgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId },
      select: ['role'],
    });
    return orgUser?.role ?? null;
  }

  private permissionSatisfies(granted: Permission, required: Permission): boolean {
    const [grantedResource, grantedAction] = this.splitPermission(granted);
    const [requiredResource, requiredAction] = this.splitPermission(required);
    if (grantedResource !== requiredResource) {
      return false;
    }
    return ACTION_LEVEL[grantedAction] >= ACTION_LEVEL[requiredAction];
  }

  private splitPermission(permission: Permission): [string, ResourceAction] {
    const [resource, action] = permission.split(':') as [string, ResourceAction];
    return [resource, action];
  }

  private isGlobalRole(role: RequiredRole): role is UserRole {
    return role === UserRole.ADMIN || role === UserRole.USER || role === UserRole.OBSERVER;
  }
}

