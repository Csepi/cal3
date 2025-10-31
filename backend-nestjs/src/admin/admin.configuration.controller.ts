import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ConfigurationService } from '../configuration/configuration.service';
import { UpdateConfigurationValueDto } from './dto/configuration.dto';

@ApiTags('Admin Configuration')
@Controller('admin/configuration')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get runtime configuration settings available to administrators',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration settings retrieved successfully',
  })
  getConfigurationOverview() {
    return this.configurationService.getOverview();
  }

  @Patch(':key')
  @ApiOperation({
    summary: 'Update a configuration entry',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  updateConfigurationEntry(
    @Param('key') key: string,
    @Body() updateDto: UpdateConfigurationValueDto,
  ) {
    const normalizedKey = key.toUpperCase();
    const value =
      updateDto.value === undefined ? null : (updateDto.value as any);
    return this.configurationService.updateSetting(normalizedKey, value);
  }
}
