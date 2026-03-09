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
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceTypesService } from './resource-types.service';
import {
  CreateResourceTypeDto,
  UpdateResourceTypeDto,
} from '../dto/resource-type.dto';
import { ResourceTypeListQueryDto } from './dto/resource-type.query.dto';
import { UpdateResourceTypeColorDto } from './dto/update-resource-type-color.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { CascadeDeletionService } from '../common/services/cascade-deletion.service';
import type { RequestWithUser } from '../common/types/request-with-user';

@Controller('resource-types')
@UseGuards(JwtAuthGuard)
export class ResourceTypesController {
  constructor(
    private readonly resourceTypesService: ResourceTypesService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly cascadeDeletionService: CascadeDeletionService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateResourceTypeDto) {
    return await this.resourceTypesService.create(createDto);
  }

  @Get()
  async findAll(
    @Query() query: ResourceTypeListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    console.log(
      '🔍 ResourceTypesController.findAll called for user:',
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
      '📋 User accessible organization IDs for resource types:',
      organizationIds,
    );

    if (organizationIds.length === 0) {
      console.log(
        '⚠️  No accessible organizations - returning empty resource types',
      );
      return [];
    }

    // If a specific organisationId is requested, make sure it's in the user's accessible list
    if (
      typeof query.organisationId === 'number' &&
      !organizationIds.includes(query.organisationId)
    ) {
      console.log(
        '⚠️  Requested organization ID',
        query.organisationId,
        'not accessible - returning empty',
      );
      return [];
    }

    return await this.resourceTypesService.findAllByOrganizations(
      organizationIds,
      query.organisationId,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.resourceTypesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateResourceTypeDto,
  ) {
    return await this.resourceTypesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.resourceTypesService.remove(id);
    return { message: 'Resource type deleted successfully' };
  }

  // === Phase 2: Cascade deletion endpoints ===

  /**
   * Preview what will be deleted when deleting a resource type
   * GET /api/resource-types/:id/deletion-preview
   */
  @Get(':id/deletion-preview')
  async previewDeletion(
    @Param('id', ParseIntPipe) resourceTypeId: number,
    @Req() req: RequestWithUser,
  ) {

    // Get the resource type to check organization access
    const resourceType =
      await this.resourceTypesService.findOne(resourceTypeId);
    if (!resourceType) {
      throw new ForbiddenException('Resource type not found');
    }

    // Check if user can manage this organization's resource types
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resourceTypeId,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to view deletion preview for this resource type',
      );
    }

    return await this.cascadeDeletionService.previewResourceTypeDeletion(
      resourceTypeId,
    );
  }

  /**
   * Delete resource type with cascade (all resources and their reservations)
   * DELETE /api/resource-types/:id/cascade
   */
  @Delete(':id/cascade')
  async deleteCascade(
    @Param('id', ParseIntPipe) resourceTypeId: number,
    @Req() req: RequestWithUser,
  ) {

    // Get the resource type to check organization access
    const resourceType =
      await this.resourceTypesService.findOne(resourceTypeId);
    if (!resourceType) {
      throw new ForbiddenException('Resource type not found');
    }

    // Check if user can manage this organization's resource types
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resourceTypeId,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource type',
      );
    }

    const result = await this.cascadeDeletionService.deleteResourceType(
      resourceTypeId,
      req.user.id,
    );
    return result;
  }

  /**
   * Update resource type color
   * PATCH /api/resource-types/:id/color
   * Body: { color: string }
   */
  @Patch(':id/color')
  async updateColor(
    @Param('id', ParseIntPipe) resourceTypeId: number,
    @Body() body: UpdateResourceTypeColorDto,
    @Req() req: RequestWithUser,
  ) {
    // Check if user can manage this resource type
    const canManage = await this.userPermissionsService.canUserEditResourceType(
      req.user.id,
      resourceTypeId,
    );
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to update this resource type color',
      );
    }

    return await this.resourceTypesService.updateColor(
      resourceTypeId,
      body.color,
    );
  }
}
