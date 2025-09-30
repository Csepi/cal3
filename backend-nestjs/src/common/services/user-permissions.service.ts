import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole, UsagePlan } from '../../entities/user.entity';
import { Organisation } from '../../entities/organisation.entity';
import { OrganisationAdmin } from '../../entities/organisation-admin.entity';
import { OrganisationUser, OrganisationRoleType } from '../../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../../entities/organisation-calendar-permission.entity';
import { ReservationCalendarRole, ReservationCalendarRoleType } from '../../entities/reservation-calendar-role.entity';
import { ReservationCalendar } from '../../entities/reservation-calendar.entity';
import { ResourceType } from '../../entities/resource-type.entity';

export interface UserPermissions {
  canAccessReservations: boolean;
  canViewOrganization: (organizationId: number) => boolean;
  canAdminOrganization: (organizationId: number) => boolean;
  canEditReservationCalendar: (reservationCalendarId: number) => boolean;
  canViewReservationCalendar: (reservationCalendarId: number) => boolean;
  accessibleOrganizationIds: number[];
  adminOrganizationIds: number[];
  editableReservationCalendarIds: number[];
  viewableReservationCalendarIds: number[];
}

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
    @InjectRepository(OrganisationUser)
    private organisationUserRepository: Repository<OrganisationUser>,
    @InjectRepository(OrganisationResourceTypePermission)
    private organisationResourceTypePermissionRepository: Repository<OrganisationResourceTypePermission>,
    @InjectRepository(OrganisationCalendarPermission)
    private organisationCalendarPermissionRepository: Repository<OrganisationCalendarPermission>,
    @InjectRepository(ReservationCalendarRole)
    private reservationCalendarRoleRepository: Repository<ReservationCalendarRole>,
    @InjectRepository(ReservationCalendar)
    private reservationCalendarRepository: Repository<ReservationCalendar>,
    @InjectRepository(ResourceType)
    private resourceTypeRepository: Repository<ResourceType>,
  ) {}

  /**
   * Check if user has reservation access based on their usage plans
   */
  hasReservationAccess(user: User): boolean {
    if (!user.usagePlans || !Array.isArray(user.usagePlans)) {
      return false;
    }

    return user.usagePlans.some(plan =>
      plan === UsagePlan.STORE || plan === UsagePlan.ENTERPRISE
    );
  }

  /**
   * Check if user is a super admin (can see all organizations)
   */
  isSuperAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Get comprehensive user permissions
   */
  async getUserPermissions(userId: number): Promise<UserPermissions> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organisations', 'organisationAdminRoles', 'reservationCalendarRoles']
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('👤 User details:', {
      id: user.id,
      username: user.username,
      role: user.role,
      usagePlans: user.usagePlans
    });

    const canAccessReservations = this.hasReservationAccess(user);
    const isSuperAdmin = this.isSuperAdmin(user);

    console.log('🔍 User access checks:', {
      canAccessReservations,
      isSuperAdmin,
      userRole: user.role
    });

    // Get organization access
    let accessibleOrganizationIds: number[] = [];
    let adminOrganizationIds: number[] = [];

    if (isSuperAdmin) {
      console.log('🌟 User is super admin - granting access to all organizations');
      // Super admin can see all organizations
      const allOrganizations = await this.organisationRepository.find();
      accessibleOrganizationIds = allOrganizations.map(org => org.id);
      adminOrganizationIds = accessibleOrganizationIds; // Super admin can admin all
      console.log('📋 All organizations for super admin:', allOrganizations.map(org => `${org.id}:${org.name}`));
    } else {
      console.log('👤 Regular user - checking specific permissions');

      // Regular member organizations (many-to-many relation)
      const memberOrgIds = user.organisations?.map(org => org.id) || [];
      console.log('📋 Member organizations:', memberOrgIds);

      // Admin organizations (Cal3-level org admins)
      const adminOrgIds = user.organisationAdminRoles?.map(role => role.organisationId) || [];
      console.log('📋 Admin organizations (Cal3-level):', adminOrgIds);

      // Organizations where user has roles via OrganisationUser table (admin/editor/user)
      const organisationUserRoles = await this.organisationUserRepository.find({
        where: { userId },
      });
      const roleBasedOrgIds = organisationUserRoles.map(role => role.organisationId);
      console.log('📋 Role-based organizations:', roleBasedOrgIds, 'with roles:', organisationUserRoles.map(r => `${r.organisationId}:${r.role}`));

      // Combine and deduplicate all accessible organizations
      accessibleOrganizationIds = [...new Set([...memberOrgIds, ...adminOrgIds, ...roleBasedOrgIds])];

      // Admin organizations include both Cal3-admins and OrganisationUser admins
      const orgUserAdminIds = organisationUserRoles
        .filter(role => role.role === 'admin')
        .map(role => role.organisationId);
      adminOrganizationIds = [...new Set([...adminOrgIds, ...orgUserAdminIds])];

      console.log('📋 Final accessible organization IDs:', accessibleOrganizationIds);
      console.log('📋 Final admin organization IDs:', adminOrganizationIds);
    }

    // Get reservation calendar access
    let editableReservationCalendarIds: number[] = [];
    let viewableReservationCalendarIds: number[] = [];

    if (canAccessReservations) {
      if (isSuperAdmin) {
        // Super admin can access all reservation calendars
        const allReservationCalendars = await this.reservationCalendarRepository.find();
        editableReservationCalendarIds = allReservationCalendars.map(cal => cal.id);
        viewableReservationCalendarIds = editableReservationCalendarIds;
      } else {
        // Get reservation calendars from admin organizations (auto-editor access)
        const adminOrgReservationCalendars = await this.reservationCalendarRepository.find({
          where: { organisationId: In(adminOrganizationIds) }
        });

        // Get explicitly assigned reservation calendar roles
        const explicitRoles = user.reservationCalendarRoles || [];
        const explicitEditableIds = explicitRoles
          .filter(role => role.role === ReservationCalendarRoleType.EDITOR)
          .map(role => role.reservationCalendarId);
        const explicitViewableIds = explicitRoles
          .map(role => role.reservationCalendarId);

        // Combine access
        editableReservationCalendarIds = [
          ...adminOrgReservationCalendars.map(cal => cal.id),
          ...explicitEditableIds
        ];
        viewableReservationCalendarIds = [
          ...editableReservationCalendarIds,
          ...explicitViewableIds
        ];

        // Remove duplicates
        editableReservationCalendarIds = [...new Set(editableReservationCalendarIds)];
        viewableReservationCalendarIds = [...new Set(viewableReservationCalendarIds)];
      }
    }

    return {
      canAccessReservations,
      canViewOrganization: (orgId: number) => isSuperAdmin || accessibleOrganizationIds.includes(orgId),
      canAdminOrganization: (orgId: number) => isSuperAdmin || adminOrganizationIds.includes(orgId),
      canEditReservationCalendar: (calId: number) => canAccessReservations && editableReservationCalendarIds.includes(calId),
      canViewReservationCalendar: (calId: number) => canAccessReservations && viewableReservationCalendarIds.includes(calId),
      accessibleOrganizationIds,
      adminOrganizationIds,
      editableReservationCalendarIds,
      viewableReservationCalendarIds,
    };
  }

  /**
   * Get organizations that a user can access
   */
  async getUserAccessibleOrganizations(userId: number): Promise<Organisation[]> {
    console.log('🔍 getUserAccessibleOrganizations called for user:', userId);
    const permissions = await this.getUserPermissions(userId);
    console.log('📋 User permissions:', {
      accessibleOrganizationIds: permissions.accessibleOrganizationIds,
      adminOrganizationIds: permissions.adminOrganizationIds,
      canAccessReservations: permissions.canAccessReservations
    });

    if (permissions.accessibleOrganizationIds.length === 0) {
      console.log('⚠️  No accessible organizations found for user');
      return [];
    }

    const organizations = await this.organisationRepository.find({
      where: { id: In(permissions.accessibleOrganizationIds) },
      relations: ['users', 'organisationAdmins', 'reservationCalendars']
    });

    console.log('📋 Found organizations:', organizations.map(org => `${org.id}:${org.name}`));
    return organizations;
  }

  /**
   * Get reservation calendars that a user can access
   */
  async getUserAccessibleReservationCalendars(userId: number): Promise<ReservationCalendar[]> {
    const permissions = await this.getUserPermissions(userId);

    if (!permissions.canAccessReservations || permissions.viewableReservationCalendarIds.length === 0) {
      return [];
    }

    return await this.reservationCalendarRepository.find({
      where: { id: In(permissions.viewableReservationCalendarIds) },
      relations: ['calendar', 'organisation', 'createdBy', 'roles']
    });
  }

  /**
   * Check if user can access a specific organization
   */
  async canUserAccessOrganization(userId: number, organizationId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canViewOrganization(organizationId);
  }

  /**
   * Check if user can admin a specific organization
   */
  async canUserAdminOrganization(userId: number, organizationId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canAdminOrganization(organizationId);
  }

  /**
   * Check if user can access a specific reservation calendar
   */
  async canUserAccessReservationCalendar(userId: number, reservationCalendarId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canViewReservationCalendar(reservationCalendarId);
  }

  /**
   * Check if user can edit a specific reservation calendar
   */
  async canUserEditReservationCalendar(userId: number, reservationCalendarId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canEditReservationCalendar(reservationCalendarId);
  }

  /**
   * Get user's role in a specific organization
   */
  async getUserOrganizationRole(userId: number, organizationId: number): Promise<'admin' | 'member' | 'none'> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organisations', 'organisationAdminRoles']
    });

    if (!user) {
      return 'none';
    }

    // Check if super admin
    if (user.role === UserRole.ADMIN) {
      return 'admin';
    }

    // Check if organization admin
    const isOrgAdmin = user.organisationAdminRoles?.some(role => role.organisationId === organizationId);
    if (isOrgAdmin) {
      return 'admin';
    }

    // Check if organization member
    const isMember = user.organisations?.some(org => org.id === organizationId);
    if (isMember) {
      return 'member';
    }

    return 'none';
  }

  /**
   * Get user's role in a specific reservation calendar
   */
  async getUserReservationCalendarRole(userId: number, reservationCalendarId: number): Promise<'editor' | 'reviewer' | 'none'> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['reservationCalendarRoles', 'organisationAdminRoles']
    });

    if (!user) {
      return 'none';
    }

    // Check if super admin
    if (user.role === UserRole.ADMIN) {
      return 'editor';
    }

    // Get the reservation calendar to check organization
    const reservationCalendar = await this.reservationCalendarRepository.findOne({
      where: { id: reservationCalendarId }
    });

    if (!reservationCalendar) {
      return 'none';
    }

    // Check if organization admin (auto-editor)
    const isOrgAdmin = user.organisationAdminRoles?.some(role => role.organisationId === reservationCalendar.organisationId);
    if (isOrgAdmin) {
      return 'editor';
    }

    // Check explicit role assignment
    const explicitRole = user.reservationCalendarRoles?.find(role => role.reservationCalendarId === reservationCalendarId);
    if (explicitRole) {
      return explicitRole.role as 'editor' | 'reviewer';
    }

    return 'none';
  }

  /**
   * Check if user has Store or Enterprise plan (required for organization roles)
   */
  hasRequiredPlansForOrganizationRole(user: User): boolean {
    if (!user.usagePlans || !Array.isArray(user.usagePlans)) {
      return false;
    }

    return user.usagePlans.some(plan =>
      plan === UsagePlan.STORE || plan === UsagePlan.ENTERPRISE
    );
  }

  /**
   * Get user's organization role (Admin/Editor/User)
   */
  async getUserOrganizationUserRole(userId: number, organizationId: number): Promise<OrganisationRoleType | null> {
    const orgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId }
    });

    return orgUser?.role || null;
  }

  /**
   * Check if user can edit a specific resource type
   */
  async canUserEditResourceType(userId: number, resourceTypeId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Super admin can edit everything
    if (user.role === UserRole.ADMIN) return true;

    // Check if user has reservation access
    if (!this.hasReservationAccess(user)) return false;

    // Get resource type to find organization
    const resourceType = await this.resourceTypeRepository.findOne({
      where: { id: resourceTypeId },
      relations: ['organisation']
    });

    if (!resourceType) return false;

    const organizationId = resourceType.organisationId;

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });
    if (isOrgAdmin) return true;

    // Get organization settings
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) return false;

    if (organization.useGranularResourcePermissions) {
      // Check granular permission
      const permission = await this.organisationResourceTypePermissionRepository.findOne({
        where: { userId, organisationId: organizationId, resourceTypeId, canEdit: true }
      });
      return !!permission;
    } else {
      // Check organization role
      const orgUser = await this.organisationUserRepository.findOne({
        where: { userId, organisationId: organizationId }
      });
      return orgUser?.role === OrganisationRoleType.ADMIN || orgUser?.role === OrganisationRoleType.EDITOR;
    }
  }

  /**
   * Check if user can view a specific reservation calendar
   */
  async canUserViewReservationCalendarGranular(userId: number, reservationCalendarId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Super admin can view everything
    if (user.role === UserRole.ADMIN) return true;

    // Check if user has reservation access
    if (!this.hasReservationAccess(user)) return false;

    // Get calendar to find organization
    const calendar = await this.reservationCalendarRepository.findOne({
      where: { id: reservationCalendarId },
      relations: ['organisation']
    });

    if (!calendar) return false;

    const organizationId = calendar.organisationId;

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });
    if (isOrgAdmin) return true;

    // Get organization settings
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) return false;

    if (organization.useGranularCalendarPermissions) {
      // Check granular permission
      const permission = await this.organisationCalendarPermissionRepository.findOne({
        where: { userId, organisationId: organizationId, reservationCalendarId, canView: true }
      });
      return !!permission;
    } else {
      // Check organization membership
      const orgUser = await this.organisationUserRepository.findOne({
        where: { userId, organisationId: organizationId }
      });
      return !!orgUser; // Any organization member can view when granular is disabled
    }
  }

  /**
   * Check if user can edit a specific reservation calendar
   */
  async canUserEditReservationCalendarGranular(userId: number, reservationCalendarId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Super admin can edit everything
    if (user.role === UserRole.ADMIN) return true;

    // Check if user has reservation access
    if (!this.hasReservationAccess(user)) return false;

    // Get calendar to find organization
    const calendar = await this.reservationCalendarRepository.findOne({
      where: { id: reservationCalendarId },
      relations: ['organisation']
    });

    if (!calendar) return false;

    const organizationId = calendar.organisationId;

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });
    if (isOrgAdmin) return true;

    // Get organization settings
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) return false;

    if (organization.useGranularCalendarPermissions) {
      // Check granular permission
      const permission = await this.organisationCalendarPermissionRepository.findOne({
        where: { userId, organisationId: organizationId, reservationCalendarId, canEdit: true }
      });
      return !!permission;
    } else {
      // Check organization role
      const orgUser = await this.organisationUserRepository.findOne({
        where: { userId, organisationId: organizationId }
      });
      return orgUser?.role === OrganisationRoleType.ADMIN || orgUser?.role === OrganisationRoleType.EDITOR;
    }
  }

  /**
   * Silent cleanup of user permissions when plans are downgraded
   */
  async cleanupUserPermissionsOnPlanChange(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    // If user no longer has required plans, remove all organization roles
    if (!this.hasRequiredPlansForOrganizationRole(user)) {
      // Remove all organization user roles
      await this.organisationUserRepository.delete({ userId });

      // Remove all organization admin roles
      await this.organisationAdminRepository.delete({ userId });

      // Remove all granular permissions
      await this.organisationResourceTypePermissionRepository.delete({ userId });
      await this.organisationCalendarPermissionRepository.delete({ userId });

      // Remove all reservation calendar roles
      await this.reservationCalendarRoleRepository.delete({ userId });
    }
  }

  /**
   * Get users with Store or Enterprise plans (for admin user selection)
   */
  async getUsersWithRequiredPlans(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users.filter(user => this.hasRequiredPlansForOrganizationRole(user));
  }

  /**
   * Check if user can modify organization settings (granular permission toggles)
   */
  async canUserModifyOrganizationSettings(userId: number, organizationId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Super admin can modify everything
    if (user.role === UserRole.ADMIN) return true;

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });

    return !!isOrgAdmin;
  }

  /**
   * Get all resource types user can edit in an organization
   */
  async getUserEditableResourceTypes(userId: number, organizationId: number): Promise<number[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    // Super admin can edit everything
    if (user.role === UserRole.ADMIN) {
      const resourceTypes = await this.resourceTypeRepository.find({
        where: { organisationId: organizationId }
      });
      return resourceTypes.map(rt => rt.id);
    }

    // Check if user has reservation access
    if (!this.hasReservationAccess(user)) return [];

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });

    if (isOrgAdmin) {
      const resourceTypes = await this.resourceTypeRepository.find({
        where: { organisationId: organizationId }
      });
      return resourceTypes.map(rt => rt.id);
    }

    // Get organization settings
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) return [];

    if (organization.useGranularResourcePermissions) {
      // Get granular permissions
      const permissions = await this.organisationResourceTypePermissionRepository.find({
        where: { userId, organisationId: organizationId, canEdit: true }
      });
      return permissions.map(p => p.resourceTypeId);
    } else {
      // Check organization role
      const orgUser = await this.organisationUserRepository.findOne({
        where: { userId, organisationId: organizationId }
      });

      if (orgUser?.role === OrganisationRoleType.ADMIN || orgUser?.role === OrganisationRoleType.EDITOR) {
        const resourceTypes = await this.resourceTypeRepository.find({
          where: { organisationId: organizationId }
        });
        return resourceTypes.map(rt => rt.id);
      }
    }

    return [];
  }

  /**
   * Get all reservation calendars user can access in an organization
   */
  async getUserAccessibleCalendarsInOrganization(userId: number, organizationId: number): Promise<{ viewable: number[], editable: number[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { viewable: [], editable: [] };

    // Super admin can access everything
    if (user.role === UserRole.ADMIN) {
      const calendars = await this.reservationCalendarRepository.find({
        where: { organisationId: organizationId }
      });
      const calendarIds = calendars.map(c => c.id);
      return { viewable: calendarIds, editable: calendarIds };
    }

    // Check if user has reservation access
    if (!this.hasReservationAccess(user)) return { viewable: [], editable: [] };

    // Check if organization admin
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId: organizationId }
    });

    if (isOrgAdmin) {
      const calendars = await this.reservationCalendarRepository.find({
        where: { organisationId: organizationId }
      });
      const calendarIds = calendars.map(c => c.id);
      return { viewable: calendarIds, editable: calendarIds };
    }

    // Get organization settings
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) return { viewable: [], editable: [] };

    if (organization.useGranularCalendarPermissions) {
      // Get granular permissions
      const permissions = await this.organisationCalendarPermissionRepository.find({
        where: { userId, organisationId: organizationId }
      });

      const viewable = permissions.filter(p => p.canView).map(p => p.reservationCalendarId);
      const editable = permissions.filter(p => p.canEdit).map(p => p.reservationCalendarId);

      return { viewable, editable };
    } else {
      // Check organization membership
      const orgUser = await this.organisationUserRepository.findOne({
        where: { userId, organisationId: organizationId }
      });

      if (orgUser) {
        const calendars = await this.reservationCalendarRepository.find({
          where: { organisationId: organizationId }
        });
        const calendarIds = calendars.map(c => c.id);

        if (orgUser.role === OrganisationRoleType.ADMIN || orgUser.role === OrganisationRoleType.EDITOR) {
          return { viewable: calendarIds, editable: calendarIds };
        } else {
          return { viewable: calendarIds, editable: [] };
        }
      }
    }

    return { viewable: [], editable: [] };
  }
}