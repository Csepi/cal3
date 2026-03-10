import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrganisationsService } from './organisations.service';
import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  AssignUserDto,
} from '../dto/organisation.dto';
import {
  AssignOrganisationUserDto,
  UpdateOrganisationUserRoleDto,
} from '../dto/organisation-user.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { OrganisationOwnershipGuard } from '../auth/guards/organisation-ownership.guard';
import { OrganisationScope } from '../common/decorators/organisation-scope.decorator';
import { OrganisationRoleType } from '../entities/organisation-user.entity';
import { RequireOrgAdmin } from '../common/decorators/require-org-admin.decorator';
import type { RequestWithUser } from '../common/types/request-with-user';
import { RbacAuthorizationGuard } from '../common/authorization/rbac-authorization.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { ORGANISATION_PERMISSIONS } from '../common/authorization/permission.types';
import { UserRole } from '../entities/user.entity';
import { UpdateOrganisationColorDto } from './dto/update-organisation-color.dto';

import { bStatic } from '../i18n/runtime';

@Controller('organisations')
@UseGuards(JwtAuthGuard, RbacAuthorizationGuard)
export class OrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  @UseGuards(AdminGuard) // Only super admins can create organizations
  @RequireRole(UserRole.ADMIN)
  async create(
    @Body() createDto: CreateOrganisationDto,
    @Req() req: RequestWithUser,
  ) {
    // Create the organization and automatically add the creator as ORG_ADMIN
    return await this.organisationsService.createWithCreator(
      createDto,
      req.user.id,
    );
  }

  @Get()
  @RequirePermission(ORGANISATION_PERMISSIONS.READ)
  async findAll(@Req() req: RequestWithUser) {
    // Return only organizations the user has access to
    console.log(
      '🔍 OrganisationsController.findAll called for user:',
      req.user.id,
      'role:',
      req.user.role,
      'username:',
      req.user.username,
    );
    const organizations =
      await this.userPermissionsService.getUserAccessibleOrganizations(
        req.user.id,
      );
    console.log(
      '📋 User accessible organizations count:',
      organizations.length,
    );
    console.log(
      '📋 Organization IDs returned:',
      organizations.map((org) => `${org.id}:${org.name}`),
    );
    console.log(
      '📋 Full organization data:',
      JSON.stringify(
        organizations.map((org) => ({ id: org.id, name: org.name })),
        null,
        2,
      ),
    );
    return organizations;
  }

  @Get(':id')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({ field: 'id', source: 'params' })
  @RequirePermission(ORGANISATION_PERMISSIONS.READ, { organisationIdParam: 'id' })
  async findOne(
    @Param('id', ParseIntPipe) organizationId: number,
    @Req() req: RequestWithUser,
  ) {
    // Check if user has access to this organization
    const canAccess =
      await this.userPermissionsService.canUserAccessOrganization(
        req.user.id,
        organizationId,
      );
    if (!canAccess) {
      throw new NotFoundException(bStatic('errors.auto.backend.kac01992866fd'));
    }

    return await this.organisationsService.findOne(organizationId);
  }

  @Patch(':id')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin('You do not have permission to update this organisation')
  @RequirePermission(ORGANISATION_PERMISSIONS.WRITE, {
    organisationIdParam: 'id',
  })
  async update(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() updateDto: UpdateOrganisationDto,
    @Req() _req: RequestWithUser,
  ) {
    return await this.organisationsService.update(organizationId, updateDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard) // Only super admins can delete organizations
  @RequireRole(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.organisationsService.remove(id);
    return { message: bStatic('errors.auto.backend.k416d6af3a5d5') };
  }

  @Post(':id/users')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to assign users to this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async assignUser(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() assignDto: AssignUserDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.organisationsService.assignUser(
      organizationId,
      assignDto.userId,
      req.user.id,
    );
  }

  @Delete(':id/users/:userId')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to remove users from this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async removeUser(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    return await this.organisationsService.removeUser(
      organizationId,
      userId,
      req.user.id,
    );
  }

  // === New endpoints for Phase 2 ===

  /**
   * Assign a user to organization with a specific role
   * POST /api/organisations/:id/users/assign
   * Body: { userId: number, role: OrganisationRoleType }
   */
  @Post(':id/users/assign')
  @RequireOrgAdmin(
    'You do not have permission to assign users to this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async assignUserWithRole(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() assignDto: AssignOrganisationUserDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.organisationsService.assignUserWithRole(
      organizationId,
      assignDto,
      req.user.id,
    );
  }

  /**
   * Get all users assigned to an organization with their roles
   * GET /api/organisations/:id/users/list
   */
  @Get(':id/users/list')
  @RequirePermission(ORGANISATION_PERMISSIONS.READ, { organisationIdParam: 'id' })
  async getOrganizationUsers(
    @Param('id', ParseIntPipe) organizationId: number,
    @Req() req: RequestWithUser,
  ) {
    // Check if user has access to this organization
    const canAccess =
      await this.userPermissionsService.canUserAccessOrganization(
        req.user.id,
        organizationId,
      );
    if (!canAccess) {
      throw new NotFoundException(bStatic('errors.auto.backend.kac01992866fd'));
    }

    return await this.organisationsService.getOrganizationUsers(organizationId);
  }

  /**
   * Update a user's role in an organization
   * PATCH /api/organisations/:id/users/:userId/role
   * Body: { role: OrganisationRoleType }
   */
  @Patch(':id/users/:userId/role')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to update user roles in this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async updateUserRole(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateOrganisationUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.organisationsService.updateUserRole(
      organizationId,
      userId,
      updateDto.role,
      req.user.id,
    );
  }

  /**
   * Remove user from organization (alternative endpoint with proper flow)
   * DELETE /api/organisations/:id/users/:userId/remove
   */
  @Delete(':id/users/:userId/remove')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to remove users from this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async removeUserFromOrganization(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    await this.organisationsService.removeUserFromOrganization(
      organizationId,
      userId,
      req.user.id,
    );
    return { message: bStatic('errors.auto.backend.k9d4b095fcd4d') };
  }

  /**
   * Preview what will be deleted when deleting an organization
   * GET /api/organisations/:id/deletion-preview
   */
  @Get(':id/deletion-preview')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to view deletion preview for this organisation',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.ADMIN, {
    organisationIdParam: 'id',
  })
  async previewDeletion(
    @Param('id', ParseIntPipe) organizationId: number,
    @Req() _req: RequestWithUser,
  ) {
    return await this.organisationsService.previewOrganizationDeletion(
      organizationId,
    );
  }

  /**
   * Delete organization with cascade (resource types, resources, reservations)
   * DELETE /api/organisations/:id/cascade
   * Requires organization admin permission
   */
  @Delete(':id/cascade')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin('You do not have permission to delete this organisation')
  @RequirePermission(ORGANISATION_PERMISSIONS.DELETE, {
    organisationIdParam: 'id',
  })
  async deleteCascade(
    @Param('id', ParseIntPipe) organizationId: number,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.organisationsService.deleteOrganizationCascade(
      organizationId,
      req.user.id,
    );
    return result;
  }

  /**
   * Update organization color
   * PATCH /api/organisations/:id/color
   * Body: { color: string, cascadeToResourceTypes?: boolean }
   */
  @Patch(':id/color')
  @UseGuards(OrganisationOwnershipGuard)
  @OrganisationScope({
    field: 'id',
    source: 'params',
    minimumRole: OrganisationRoleType.ADMIN,
  })
  @RequireOrgAdmin(
    'You do not have permission to update this organisation color',
  )
  @RequirePermission(ORGANISATION_PERMISSIONS.WRITE, {
    organisationIdParam: 'id',
  })
  async updateColor(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() body: UpdateOrganisationColorDto,
    @Req() _req: RequestWithUser,
  ) {
    return await this.organisationsService.updateColor(
      organizationId,
      body.color,
      body.cascadeToResourceTypes,
    );
  }
}
