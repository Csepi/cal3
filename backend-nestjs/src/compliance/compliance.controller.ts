import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/types/request-with-user';
import type { UserConsentType } from '../entities/user-consent.entity';
import { ComplianceService } from './compliance.service';
import {
  AcceptPrivacyPolicyDto,
  CreateDataSubjectRequestDto,
  DataSubjectRequestQueryDto,
  UpsertConsentDto,
} from './dto/compliance.dto';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('me/privacy/access')
  @ApiOperation({ summary: 'Get GDPR access report for current user' })
  @ApiResponse({ status: 200, description: 'Access report generated' })
  getPrivacyAccess(@Req() req: RequestWithUser) {
    return this.complianceService.getPersonalPrivacyReport(req.user.id);
  }

  @Get('me/privacy/export')
  @ApiOperation({ summary: 'Export current user personal data (GDPR portability)' })
  @ApiResponse({ status: 200, description: 'Data export generated' })
  exportPersonalData(@Req() req: RequestWithUser) {
    return this.complianceService.exportPersonalData(req.user.id);
  }

  @Post('me/privacy/requests')
  @ApiOperation({ summary: 'Create data subject request (access/export/delete)' })
  @ApiResponse({ status: 201, description: 'Request created' })
  createDataSubjectRequest(
    @Req() req: RequestWithUser,
    @Body() body: CreateDataSubjectRequestDto,
  ) {
    return this.complianceService.createDataSubjectRequest(req.user.id, body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      source: 'privacy-center',
    });
  }

  @Get('me/privacy/requests')
  @ApiOperation({ summary: 'List current user data subject requests' })
  @ApiResponse({ status: 200, description: 'Requests listed' })
  listDataSubjectRequests(
    @Req() req: RequestWithUser,
    @Query() query: DataSubjectRequestQueryDto,
  ) {
    return this.complianceService.listPersonalRequests(req.user.id, query);
  }

  @Get('me/privacy/consents')
  @ApiOperation({ summary: 'List latest consent states for current user' })
  @ApiResponse({ status: 200, description: 'Consents listed' })
  listConsents(@Req() req: RequestWithUser) {
    return this.complianceService.listLatestConsents(req.user.id);
  }

  @Put('me/privacy/consents/:consentType')
  @ApiOperation({ summary: 'Update consent decision for current user' })
  @ApiResponse({ status: 200, description: 'Consent updated' })
  upsertConsent(
    @Req() req: RequestWithUser,
    @Param('consentType') consentType: UserConsentType,
    @Body() body: UpsertConsentDto,
  ) {
    return this.complianceService.upsertConsent(req.user.id, consentType, body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      source: 'privacy-center',
    });
  }

  @Post('me/privacy/policy-acceptance')
  @ApiOperation({ summary: 'Accept current privacy policy version' })
  @ApiResponse({ status: 200, description: 'Policy acceptance tracked' })
  acceptPrivacyPolicy(
    @Req() req: RequestWithUser,
    @Body() body: AcceptPrivacyPolicyDto,
  ) {
    return this.complianceService.acceptPrivacyPolicy(
      req.user.id,
      body.version,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        source: 'privacy-policy',
      },
    );
  }
}
