import { Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AbusePreventionService } from '../services/abuse-prevention.service';

@Controller('security/honeypot')
export class HoneypotController {
  constructor(private readonly abusePrevention: AbusePreventionService) {}

  @Get('admin-login')
  @HttpCode(204)
  @Public()
  async trapAdminLogin(@Req() req: Request): Promise<void> {
    await this.abusePrevention.markHoneypotHit(
      req.ip,
      req.originalUrl || req.url,
    );
  }

  @Post('submit')
  @HttpCode(204)
  @Public()
  async trapSubmit(@Req() req: Request): Promise<void> {
    await this.abusePrevention.markHoneypotHit(
      req.ip,
      req.originalUrl || req.url,
    );
  }
}
