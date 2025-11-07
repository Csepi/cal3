import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ConfigurationService } from '../configuration/configuration.service';
import { UpdateConfigurationValueDto } from '../admin/dto/configuration.dto';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class NotificationsAdminController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('config')
  getConfig() {
    const overview = this.configurationService.getOverview();
    return {
      categories: overview.categories.filter(
        (category) => category.key === 'notifications',
      ),
      derived: overview.derived,
    };
  }

  @Patch('config/:key')
  updateConfig(
    @Param('key') key: string,
    @Body() body: UpdateConfigurationValueDto,
  ) {
    return this.configurationService.updateSetting(key, body.value ?? null);
  }
}
