import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resource.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateResourceDto) {
    return await this.resourcesService.create(createDto);
  }

  @Get()
  async findAll(@Query('resourceTypeId') resourceTypeId?: string, @Req() req?: any) {
    console.log('🔍 ResourcesController.findAll called for user:', req.user.id, 'username:', req.user.username);

    // Get user's accessible organizations
    const organizations = await this.userPermissionsService.getUserAccessibleOrganizations(req.user.id);
    const organizationIds = organizations.map(org => org.id);

    console.log('📋 User accessible organization IDs for resources:', organizationIds);

    if (organizationIds.length === 0) {
      console.log('⚠️  No accessible organizations - returning empty resources');
      return [];
    }

    return await this.resourcesService.findAllByOrganizations(organizationIds, resourceTypeId ? +resourceTypeId : undefined);
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
}