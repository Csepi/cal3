import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation } from '../entities/organisation.entity';
import { User, UsagePlan } from '../entities/user.entity';
import {
  OrganisationUser,
  OrganisationRoleType,
} from '../entities/organisation-user.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
} from '../dto/organisation.dto';
import { AssignOrganisationUserDto } from '../dto/organisation-user.dto';
import { CascadeDeletionService } from '../common/services/cascade-deletion.service';
import { NotificationsService } from '../notifications/notifications.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);

  constructor(
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganisationUser)
    private organisationUserRepository: Repository<OrganisationUser>,
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
    private cascadeDeletionService: CascadeDeletionService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateOrganisationDto): Promise<Organisation> {
    const organisation = this.organisationRepository.create(createDto);
    return await this.organisationRepository.save(organisation);
  }

  /**
   * Create organization and automatically add creator as ORG_ADMIN
   */
  async createWithCreator(
    createDto: CreateOrganisationDto,
    creatorId: number,
  ): Promise<Organisation> {
    // Create the organization
    const organisation = this.organisationRepository.create(createDto);
    const savedOrg = await this.organisationRepository.save(organisation);

    // Get the creator user
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });
    if (!creator) {
      throw new NotFoundException(`Creator user #${creatorId} not found`);
    }

    // Automatically add creator as ORG_ADMIN in organisation_users table
    const orgUser = this.organisationUserRepository.create({
      organisationId: savedOrg.id,
      userId: creatorId,
      role: OrganisationRoleType.ADMIN,
      assignedById: creatorId, // Self-assigned
    });
    await this.organisationUserRepository.save(orgUser);

    console.log(
      `✅ Created organization #${savedOrg.id} and automatically added creator #${creatorId} as ORG_ADMIN`,
    );

    return savedOrg;
  }

  async findAll(): Promise<Organisation[]> {
    return await this.organisationRepository.find({
      relations: ['users', 'resourceTypes'],
    });
  }

  async findOne(id: number): Promise<Organisation> {
    const organisation = await this.organisationRepository.findOne({
      where: { id },
      relations: ['users', 'resourceTypes'],
    });
    if (!organisation) {
      throw new NotFoundException(`Organisation #${id} not found`);
    }
    return organisation;
  }

  async update(
    id: number,
    updateDto: UpdateOrganisationDto,
  ): Promise<Organisation> {
    const organisation = await this.findOne(id);
    Object.assign(organisation, updateDto);
    return await this.organisationRepository.save(organisation);
  }

  async remove(id: number): Promise<void> {
    const organisation = await this.findOne(id);
    await this.organisationRepository.remove(organisation);
  }

  async assignUser(
    organisationId: number,
    userId: number,
    assignedById?: number,
  ): Promise<Organisation> {
    const organisation = await this.findOne(organisationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    if (!organisation.users) {
      organisation.users = [];
    }

    if (!organisation.users.find((u) => u.id === userId)) {
      organisation.users.push(user);
      const savedOrganisation =
        await this.organisationRepository.save(organisation);

      await this.notifyOrganisationMembershipChange(
        savedOrganisation,
        user,
        userId,
        assignedById,
        'assigned',
      );

      return savedOrganisation;
    }

    return organisation;
  }

  async removeUser(
    organisationId: number,
    userId: number,
    removedById?: number,
  ): Promise<Organisation> {
    const organisation = await this.findOne(organisationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (organisation.users) {
      organisation.users = organisation.users.filter((u) => u.id !== userId);
      const updatedOrganisation =
        await this.organisationRepository.save(organisation);

      await this.notifyOrganisationMembershipChange(
        updatedOrganisation,
        user ?? null,
        userId,
        removedById,
        'removed',
      );

      return updatedOrganisation;
    }

    return organisation;
  }

  async findByUser(userId: number): Promise<Organisation[]> {
    return await this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoin('organisation.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }

  /**
   * Assign a user to an organization with a specific role
   * Validates that user has Store or Enterprise plan
   */
  async assignUserWithRole(
    organisationId: number,
    assignDto: AssignOrganisationUserDto,
    assignedById: number,
  ): Promise<OrganisationUser> {
    // Verify organization exists
    const organisation = await this.findOne(organisationId);

    // Verify user exists and has required plans
    const user = await this.userRepository.findOne({
      where: { id: assignDto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User #${assignDto.userId} not found`);
    }

    // Check user has Store or Enterprise plan
    if (!user.usagePlans || !Array.isArray(user.usagePlans)) {
      throw new BadRequestException(
        'User does not have required usage plans for organization access',
      );
    }

    const hasRequiredPlan = user.usagePlans.some(
      (plan) => plan === UsagePlan.STORE || plan === UsagePlan.ENTERPRISE,
    );

    if (!hasRequiredPlan) {
      throw new BadRequestException(
        'User must have Store or Enterprise plan to be assigned to an organization',
      );
    }

    // Check if user already assigned
    const existing = await this.organisationUserRepository.findOne({
      where: { organisationId, userId: assignDto.userId },
    });

    let savedAssignment: OrganisationUser;
    let action: 'assigned' | 'role-updated';

    if (existing) {
      // Update role if already exists
      existing.role = assignDto.role;
      existing.assignedById = assignedById;
      savedAssignment = await this.organisationUserRepository.save(existing);
      action = 'role-updated';
    } else {
      // Create new assignment
      const orgUser = this.organisationUserRepository.create({
        organisationId,
        userId: assignDto.userId,
        role: assignDto.role,
        assignedById,
      });
      savedAssignment = await this.organisationUserRepository.save(orgUser);
      action = 'assigned';
    }

    await this.notifyOrganisationMembershipChange(
      organisation,
      user,
      assignDto.userId,
      assignedById,
      action,
      assignDto.role,
    );

    return savedAssignment;
  }

  /**
   * Remove a user from an organization
   * Cleans up all related permissions
   */
  async removeUserFromOrganization(
    organisationId: number,
    userId: number,
    removedById?: number,
  ): Promise<void> {
    // Verify organization exists
    const organisation = await this.findOne(organisationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // Remove from OrganisationUser table
    await this.organisationUserRepository.delete({ organisationId, userId });

    // Note: OrganisationAdmin entries are handled separately
    // Granular permissions are CASCADE deleted via entity relationships

    await this.notifyOrganisationMembershipChange(
      organisation,
      user ?? null,
      userId,
      removedById,
      'removed',
    );
  }

  private async getOrganisationAdminUserIds(
    organisationId: number,
  ): Promise<number[]> {
    const adminIds = new Set<number>();

    const orgAdmins = await this.organisationAdminRepository.find({
      where: { organisationId },
    });
    orgAdmins.forEach((admin) => adminIds.add(admin.userId));

    const roleAdmins = await this.organisationUserRepository.find({
      where: { organisationId, role: OrganisationRoleType.ADMIN },
    });
    roleAdmins.forEach((admin) => adminIds.add(admin.userId));

    return Array.from(adminIds);
  }

  private async notifyOrganisationMembershipChange(
    organisation: Organisation,
    user: User | null,
    targetUserId: number,
    actorId: number | undefined,
    action: 'assigned' | 'removed' | 'role-updated',
    role?: OrganisationRoleType,
  ): Promise<void> {
    try {
      const recipients = new Set<number>();
      recipients.add(targetUserId);
      const adminIds = await this.getOrganisationAdminUserIds(organisation.id);
      adminIds.forEach((adminId) => recipients.add(adminId));

      if (actorId) {
        recipients.delete(actorId);
      }

      const recipientIds = Array.from(recipients);
      if (recipientIds.length === 0) {
        return;
      }

      const userDisplay = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.username ||
          user.email ||
          `User #${targetUserId}`
        : `User #${targetUserId}`;

      let title: string;
      let body: string;
      let eventType: string;

      switch (action) {
        case 'assigned':
          eventType = 'organisation.member.assigned';
          title = `${organisation.name}: Member Added`;
          body = `${userDisplay} was added to organisation "${organisation.name}"${role ? ` as ${role}` : ''}.`;
          break;
        case 'removed':
          eventType = 'organisation.member.removed';
          title = `${organisation.name}: Member Removed`;
          body = `${userDisplay} no longer has access to organisation "${organisation.name}".`;
          break;
        case 'role-updated':
        default:
          eventType = 'organisation.member.role-updated';
          title = `${organisation.name}: Role Updated`;
          body = `${userDisplay}'s role is now ${role ?? 'updated'}.`;
          break;
      }

      await this.notificationsService.publish({
        eventType,
        actorId: actorId ?? null,
        recipients: recipientIds,
        title,
        body,
        data: {
          organisationId: organisation.id,
          userId: targetUserId,
          role,
        },
        context: {
          threadKey: `organisation:${organisation.id}`,
          contextType: 'organisation',
          contextId: String(organisation.id),
        },
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'organisations.service' }));
      this.logger.error(
        `Failed to send organisation membership notification for organisation ${organisation.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Delete organization with cascade (all resource types, resources, reservations)
   */
  async deleteOrganizationCascade(organisationId: number, userId: number) {
    return await this.cascadeDeletionService.deleteOrganization(
      organisationId,
      userId,
    );
  }

  /**
   * Preview what will be deleted when deleting an organization
   */
  async previewOrganizationDeletion(organisationId: number) {
    return await this.cascadeDeletionService.previewOrganizationDeletion(
      organisationId,
    );
  }

  /**
   * Get all users assigned to an organization with their roles
   * IMPORTANT: This includes BOTH organisation_users and organisation_admins
   */
  async getOrganizationUsers(
    organisationId: number,
  ): Promise<OrganisationUser[]> {
    console.log(`🔍 getOrganizationUsers called for org #${organisationId}`);

    // Get users from organisation_users table
    const orgUsers = await this.organisationUserRepository.find({
      where: { organisationId },
      relations: ['user'],
    });
    console.log(
      `📋 Found ${orgUsers.length} users in organisation_users table:`,
      orgUsers.map((u) => `${u.userId}:${u.role}`),
    );

    // Get users from organisation_admins table
    const orgAdmins = await this.organisationAdminRepository.find({
      where: { organisationId },
      relations: ['user'],
    });
    console.log(
      `👑 Found ${orgAdmins.length} admins in organisation_admins table:`,
      orgAdmins.map((a) => a.userId),
    );

    // Convert OrganisationAdmin records to OrganisationUser format with ADMIN role
    const adminUsersAsOrgUsers: OrganisationUser[] = orgAdmins.map((admin) => {
      const orgUser = new OrganisationUser();
      orgUser.id = admin.id;
      orgUser.organisationId = admin.organisationId;
      orgUser.userId = admin.userId;
      orgUser.user = admin.user;
      orgUser.role = OrganisationRoleType.ADMIN; // Mark as ADMIN
      orgUser.assignedAt = admin.assignedAt;
      console.log(
        `✨ Converting admin user #${admin.userId} to OrganisationUser with ADMIN role`,
      );
      return orgUser;
    });

    // Combine both lists, removing duplicates (prefer ADMIN role if user is in both tables)
    const userMap = new Map<number, OrganisationUser>();

    // First add regular org users
    orgUsers.forEach((ou) => userMap.set(ou.userId, ou));

    // Then add/override with org admins (ADMIN takes precedence)
    adminUsersAsOrgUsers.forEach((ou) => userMap.set(ou.userId, ou));

    const result = Array.from(userMap.values());
    console.log(
      `📊 Final result: ${result.length} users total:`,
      result.map((u) => `${u.userId}:${u.role}`),
    );

    return result;
  }

  /**
   * Update a user's role in an organization
   */
  async updateUserRole(
    organisationId: number,
    userId: number,
    newRole: OrganisationRoleType,
    updatedById?: number,
  ): Promise<OrganisationUser> {
    const orgUser = await this.organisationUserRepository.findOne({
      where: { organisationId, userId },
    });

    if (!orgUser) {
      throw new NotFoundException(
        `User #${userId} not found in organisation #${organisationId}`,
      );
    }

    const organisation = await this.findOne(organisationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    orgUser.role = newRole;
    const saved = await this.organisationUserRepository.save(orgUser);

    await this.notifyOrganisationMembershipChange(
      organisation,
      user ?? null,
      userId,
      updatedById,
      'role-updated',
      newRole,
    );

    return saved;
  }

  /**
   * Update organization color
   * Optionally cascade the color to all resource types
   */
  async updateColor(
    organizationId: number,
    color: string,
    cascadeToResourceTypes = false,
  ): Promise<Organisation> {
    const organisation = await this.organisationRepository.findOne({
      where: { id: organizationId },
      relations: ['resourceTypes'],
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation #${organizationId} not found`);
    }

    organisation.color = color;
    const updated = await this.organisationRepository.save(organisation);

    // If cascade is enabled, update all resource types
    if (cascadeToResourceTypes && organisation.resourceTypes) {
      for (const resourceType of organisation.resourceTypes) {
        resourceType.color = color;
      }
      // Save all resource types with the new color
      await this.organisationRepository.manager.save(
        organisation.resourceTypes,
      );
    }

    return updated;
  }
}
