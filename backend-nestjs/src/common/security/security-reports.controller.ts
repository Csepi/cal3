import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('security/reports')
export class SecurityReportsController {
  private readonly logger = new Logger(SecurityReportsController.name);

  @Post('ct')
  @HttpCode(204)
  handleCertificateTransparencyReport(
    @Body() payload: Record<string, unknown>,
    @Req() request: Request,
  ): void {
    this.logger.warn(
      `Certificate transparency report received from ${request.ip ?? 'unknown'}: ${JSON.stringify(payload)}`,
    );
  }

  @Post('csp')
  @HttpCode(204)
  handleCspReport(
    @Body() payload: Record<string, unknown>,
    @Req() request: Request,
  ): void {
    this.logger.warn(
      `CSP report received from ${request.ip ?? 'unknown'}: ${JSON.stringify(payload)}`,
    );
  }
}

