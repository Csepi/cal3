import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resource.dto';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  async create(@Body() createDto: CreateResourceDto) {
    return await this.resourcesService.create(createDto);
  }

  @Get()
  async findAll(@Query('resourceTypeId') resourceTypeId?: string) {
    return await this.resourcesService.findAll(resourceTypeId ? +resourceTypeId : undefined);
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