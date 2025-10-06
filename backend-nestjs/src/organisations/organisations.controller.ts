import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto, UpdateOrganisationDto, AssignUserDto } from '../dto/organisation.dto';
import { AssignOrganisationUserDto, UpdateOrganisationUserRoleDto } from '../dto/organisation-user.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';

@Controller('organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  @UseGuards(AdminGuard) // Only super admins can create organizations
  async create(@Body() createDto: CreateOrganisationDto, @Req() req) {
    // Create the organization and automatically add the creator as ORG_ADMIN
    return await this.organisationsService.createWithCreator(createDto, req.user.id);
  }

  @Get()
  async findAll(@Req() req) {
    // Return only organizations the user has access to
    console.log('🔍 OrganisationsController.findAll called for user:', req.user.id, 'role:', req.user.role, 'username:', req.user.username);
    const organizations = await this.userPermissionsService.getUserAccessibleOrganizations(req.user.id);
    console.log('📋 User accessible organizations count:', organizations.length);
    console.log('📋 Organization IDs returned:', organizations.map(org => `${org.id}:${org.name}`));
    console.log('📋 Full organization data:', JSON.stringify(organizations.map(org => ({ id: org.id, name: org.name })), null, 2));
    return organizations;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const organizationId = +id;

    // Check if user has access to this organization
    const canAccess = await this.userPermissionsService.canUserAccessOrganization(req.user.id, organizationId);
    if (!canAccess) {
      throw new NotFoundException('Organisation not found or access denied');
    }

    return await this.organisationsService.findOne(organizationId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrganisationDto, @Req() req) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to update this organisation');
    }

    return await this.organisationsService.update(organizationId, updateDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard) // Only super admins can delete organizations
  async remove(@Param('id') id: string) {
    await this.organisationsService.remove(+id);
    return { message: 'Organisation deleted successfully' };
  }

  @Post(':id/users')
  async assignUser(@Param('id') id: string, @Body() assignDto: AssignUserDto, @Req() req) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to assign users to this organisation');
    }

    return await this.organisationsService.assignUser(organizationId, assignDto.userId);
  }

  @Delete(':id/users/:userId')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string, @Req() req) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to remove users from this organisation');
    }

    return await this.organisationsService.removeUser(organizationId, +userId);
  }

  // === New endpoints for Phase 2 ===

  /**
   * Assign a user to organization with a specific role
   * POST /api/organisations/:id/users/assign
   * Body: { userId: number, role: OrganisationRoleType }
   */
  @Post(':id/users/assign')
  async assignUserWithRole(
    @Param('id') id: string,
    @Body() assignDto: AssignOrganisationUserDto,
    @Req() req,
  ) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to assign users to this organisation');
    }

    return await this.organisationsService.assignUserWithRole(organizationId, assignDto, req.user.id);
  }

  /**
   * Get all users assigned to an organization with their roles
   * GET /api/organisations/:id/users/list
   */
  @Get(':id/users/list')
  async getOrganizationUsers(@Param('id') id: string, @Req() req) {
    const organizationId = +id;

    // Check if user has access to this organization
    const canAccess = await this.userPermissionsService.canUserAccessOrganization(req.user.id, organizationId);
    if (!canAccess) {
      throw new NotFoundException('Organisation not found or access denied');
    }

    return await this.organisationsService.getOrganizationUsers(organizationId);
  }

  /**
   * Update a user's role in an organization
   * PATCH /api/organisations/:id/users/:userId/role
   * Body: { role: OrganisationRoleType }
   */
  @Patch(':id/users/:userId/role')
  async updateUserRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateOrganisationUserRoleDto,
    @Req() req,
  ) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to update user roles in this organisation');
    }

    return await this.organisationsService.updateUserRole(organizationId, +userId, updateDto.role);
  }

  /**
   * Remove user from organization (alternative endpoint with proper flow)
   * DELETE /api/organisations/:id/users/:userId/remove
   */
  @Delete(':id/users/:userId/remove')
  async removeUserFromOrganization(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to remove users from this organisation');
    }

    await this.organisationsService.removeUserFromOrganization(organizationId, +userId);
    return { message: 'User removed from organisation successfully' };
  }

  /**
   * Preview what will be deleted when deleting an organization
   * GET /api/organisations/:id/deletion-preview
   */
  @Get(':id/deletion-preview')
  async previewDeletion(@Param('id') id: string, @Req() req) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to view deletion preview for this organisation');
    }

    return await this.organisationsService.previewOrganizationDeletion(organizationId);
  }

  /**
   * Delete organization with cascade (resource types, resources, reservations)
   * DELETE /api/organisations/:id/cascade
   * Requires organization admin permission
   */
  @Delete(':id/cascade')
  async deleteCascade(@Param('id') id: string, @Req() req) {
    const organizationId = +id;

    // Check if user can admin this organization
    const canAdmin = await this.userPermissionsService.canUserAdminOrganization(req.user.id, organizationId);
    if (!canAdmin) {
      throw new ForbiddenException('You do not have permission to delete this organisation');
    }

    const result = await this.organisationsService.deleteOrganizationCascade(organizationId, req.user.id);
    return result;
  }
}