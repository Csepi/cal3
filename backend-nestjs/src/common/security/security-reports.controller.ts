import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SecurityReportDto } from './dto/security-report.dto';

@Controller('security/reports')
export class SecurityReportsController {
  private readonly logger = new Logger(SecurityReportsController.name);

  @Post('ct')
  @HttpCode(204)
  handleCertificateTransparencyReport(
    @Body() payload: SecurityReportDto,
    @Req() request: Request,
  ): void {
    this.logger.warn(
      `Certificate transparency report received from ${request.ip ?? 'unknown'}: ${JSON.stringify(payload.report ?? payload)}`,
    );
  }

  @Post('csp')
  @HttpCode(204)
  handleCspReport(
    @Body() payload: SecurityReportDto,
    @Req() request: Request,
  ): void {
    this.logger.warn(
      `CSP report received from ${request.ip ?? 'unknown'}: ${JSON.stringify(payload.report ?? payload)}`,
    );
  }
}
