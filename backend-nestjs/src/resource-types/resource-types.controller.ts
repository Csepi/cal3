import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceTypesService } from './resource-types.service';
import { CreateResourceTypeDto, UpdateResourceTypeDto } from '../dto/resource-type.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';

@Controller('resource-types')
@UseGuards(JwtAuthGuard)
export class ResourceTypesController {
  constructor(
    private readonly resourceTypesService: ResourceTypesService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateResourceTypeDto) {
    return await this.resourceTypesService.create(createDto);
  }

  @Get()
  async findAll(@Query('organisationId') organisationId?: string, @Req() req?: any) {
    console.log('🔍 ResourceTypesController.findAll called for user:', req.user.id, 'username:', req.user.username);

    // Get user's accessible organizations
    const organizations = await this.userPermissionsService.getUserAccessibleOrganizations(req.user.id);
    const organizationIds = organizations.map(org => org.id);

    console.log('📋 User accessible organization IDs for resource types:', organizationIds);

    if (organizationIds.length === 0) {
      console.log('⚠️  No accessible organizations - returning empty resource types');
      return [];
    }

    // If a specific organisationId is requested, make sure it's in the user's accessible list
    if (organisationId && !organizationIds.includes(+organisationId)) {
      console.log('⚠️  Requested organization ID', organisationId, 'not accessible - returning empty');
      return [];
    }

    return await this.resourceTypesService.findAllByOrganizations(organizationIds, organisationId ? +organisationId : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.resourceTypesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateResourceTypeDto) {
    return await this.resourceTypesService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.resourceTypesService.remove(+id);
    return { message: 'Resource type deleted successfully' };
  }
}