import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

@Injectable()
export class OrganisationsService {
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
      await this.organisationRepository.save(organisation);
    }

    return organisation;
  }

  async removeUser(
    organisationId: number,
    userId: number,
  ): Promise<Organisation> {
    const organisation = await this.findOne(organisationId);

    if (organisation.users) {
      organisation.users = organisation.users.filter((u) => u.id !== userId);
      await this.organisationRepository.save(organisation);
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

    if (existing) {
      // Update role if already exists
      existing.role = assignDto.role;
      existing.assignedById = assignedById;
      return await this.organisationUserRepository.save(existing);
    }

    // Create new assignment
    const orgUser = this.organisationUserRepository.create({
      organisationId,
      userId: assignDto.userId,
      role: assignDto.role,
      assignedById,
    });

    return await this.organisationUserRepository.save(orgUser);
  }

  /**
   * Remove a user from an organization
   * Cleans up all related permissions
   */
  async removeUserFromOrganization(
    organisationId: number,
    userId: number,
  ): Promise<void> {
    // Verify organization exists
    await this.findOne(organisationId);

    // Remove from OrganisationUser table
    await this.organisationUserRepository.delete({ organisationId, userId });

    // Note: OrganisationAdmin entries are handled separately
    // Granular permissions are CASCADE deleted via entity relationships
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
  ): Promise<OrganisationUser> {
    const orgUser = await this.organisationUserRepository.findOne({
      where: { organisationId, userId },
    });

    if (!orgUser) {
      throw new NotFoundException(
        `User #${userId} not found in organisation #${organisationId}`,
      );
    }

    orgUser.role = newRole;
    return await this.organisationUserRepository.save(orgUser);
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
