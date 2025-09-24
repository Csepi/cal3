import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResourceTypesService } from './resource-types.service';
import { CreateResourceTypeDto, UpdateResourceTypeDto } from '../dto/resource-type.dto';

@Controller('resource-types')
@UseGuards(JwtAuthGuard)
export class ResourceTypesController {
  constructor(private readonly resourceTypesService: ResourceTypesService) {}

  @Post()
  async create(@Body() createDto: CreateResourceTypeDto) {
    return await this.resourceTypesService.create(createDto);
  }

  @Get()
  async findAll(@Query('organisationId') organisationId?: string) {
    return await this.resourceTypesService.findAll(organisationId ? +organisationId : undefined);
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