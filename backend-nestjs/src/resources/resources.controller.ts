import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resource.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { CascadeDeletionService } from '../common/services/cascade-deletion.service';
import { PublicBookingService } from './public-booking.service';
import { ConfigurationService } from '../configuration/configuration.service';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly cascadeDeletionService: CascadeDeletionService,
    private readonly publicBookingService: PublicBookingService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateResourceDto) {
    return await this.resourcesService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('resourceTypeId') resourceTypeId?: string,
    @Req() req?: any,
  ) {
    console.log(
      '🔍 ResourcesController.findAll called for user:',
      req.user.id,
      'username:',
      req.user.username,
    );

    // Get user's accessible organizations
    const organizations =
      await this.userPermissionsService.getUserAccessibleOrganizations(
        req.user.id,
      );
    const organizationIds = organizations.map((org) => org.id);

    console.log(
      '📋 User accessible organization IDs for resources:',
      organizationIds,
    );

    if (organizationIds.length === 0) {
      console.log(
        '⚠️  No accessible organizations - returning empty resources',
      );
      return [];
    }

    return await this.resourcesService.findAllByOrganizations(
      organizationIds,
      resourceTypeId ? +resourceTypeId : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.resourcesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateResourceDto) {
    return await this.resourcesService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.resourcesService.remove(+id);
    return { message: 'Resource deleted successfully' };
  }

  // === Phase 2: Cascade deletion and token management ===

  /**
   * Preview what will be deleted when deleting a resource
   * GET /api/resources/:id/deletion-preview
   */
  @Get(':id/deletion-preview')
  async previewDeletion(@Param('id') id: string, @Req() req) {
    const resourceId = +id;

    // Get the resource to check organization access
    const resource = await this.resourcesService.findOne(resourceId);
    if (!resource) {
      throw new ForbiddenException('Resource not found');
    }

    // Check if user can edit the resource type (which gives permission to manage resources)
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resource.resourceType.id,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to view deletion preview for this resource',
      );
    }

    return await this.cascadeDeletionService.previewResourceDeletion(
      resourceId,
    );
  }

  /**
   * Delete resource with cascade (all reservations)
   * DELETE /api/resources/:id/cascade
   */
  @Delete(':id/cascade')
  async deleteCascade(@Param('id') id: string, @Req() req) {
    const resourceId = +id;

    // Get the resource to check organization access
    const resource = await this.resourcesService.findOne(resourceId);
    if (!resource) {
      throw new ForbiddenException('Resource not found');
    }

    // Check if user can edit the resource type (which gives permission to manage resources)
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resource.resourceType.id,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource',
      );
    }

    const result = await this.cascadeDeletionService.deleteResource(
      resourceId,
      req.user.id,
    );
    return result;
  }

  /**
   * Get resource's public booking token
   * GET /api/resources/:id/public-token
   */
  @Get(':id/public-token')
  async getPublicToken(@Param('id') id: string, @Req() req) {
    const resourceId = +id;

    // Get the resource to check organization access
    const resource = await this.resourcesService.findOne(resourceId);
    if (!resource) {
      throw new ForbiddenException('Resource not found');
    }

    // Check if user can access the organization (basic view permission)
    const canAccess =
      await this.userPermissionsService.canUserAccessOrganization(
        req.user.id,
        resource.resourceType.organisationId,
      );
    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this resource',
      );
    }

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      publicBookingToken: resource.publicBookingToken,
      publicBookingUrl: resource.publicBookingToken
        ? `${this.configurationService.getFrontendBaseUrl()}/public-booking/${resource.publicBookingToken}`
        : null,
    };
  }

  /**
   * Regenerate resource's public booking token
   * POST /api/resources/:id/regenerate-token
   */
  @Post(':id/regenerate-token')
  async regenerateToken(@Param('id') id: string, @Req() req) {
    const resourceId = +id;

    // Get the resource to check organization access
    const resource = await this.resourcesService.findOne(resourceId);
    if (!resource) {
      throw new ForbiddenException('Resource not found');
    }

    // Check if user can edit the resource type (which gives permission to manage resources)
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resource.resourceType.id,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to regenerate token for this resource',
      );
    }

    const newToken =
      await this.publicBookingService.regenerateToken(resourceId);
    return {
      resourceId: resource.id,
      resourceName: resource.name,
      publicBookingToken: newToken,
      publicBookingUrl: `${this.configurationService.getFrontendBaseUrl()}/public-booking/${newToken}`,
      message: 'Public booking token regenerated successfully',
    };
  }
}
