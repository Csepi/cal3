import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto, UpdateOrganisationDto, AssignUserDto } from '../dto/organisation.dto';
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
  async create(@Body() createDto: CreateOrganisationDto) {
    return await this.organisationsService.create(createDto);
  }

  @Get()
  async findAll(@Req() req) {
    // Return only organizations the user has access to
    return await this.userPermissionsService.getUserAccessibleOrganizations(req.user.id);
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
}