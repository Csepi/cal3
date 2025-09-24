import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto, UpdateOrganisationDto, AssignUserDto } from '../dto/organisation.dto';

@Controller('organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  async create(@Body() createDto: CreateOrganisationDto) {
    return await this.organisationsService.create(createDto);
  }

  @Get()
  async findAll(@Req() req) {
    return await this.organisationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.organisationsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrganisationDto) {
    return await this.organisationsService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.organisationsService.remove(+id);
    return { message: 'Organisation deleted successfully' };
  }

  @Post(':id/users')
  async assignUser(@Param('id') id: string, @Body() assignDto: AssignUserDto) {
    return await this.organisationsService.assignUser(+id, assignDto.userId);
  }

  @Delete(':id/users/:userId')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return await this.organisationsService.removeUser(+id, +userId);
  }
}