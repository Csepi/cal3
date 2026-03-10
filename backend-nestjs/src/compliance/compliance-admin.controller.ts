import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { AdminGuard } from '../auth/guards/admin.guard';
import type { RequestWithUser } from '../common/types/request-with-user';
import { ComplianceReportingService } from './compliance-reporting.service';
import { ComplianceService } from './compliance.service';
import {
  ComplianceAuditExportQueryDto,
  DataSubjectRequestQueryDto,
  UpdateDataSubjectRequestDto,
} from './dto/compliance.dto';

@ApiTags('Admin Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/compliance')
export class ComplianceAdminController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly complianceReporting: ComplianceReportingService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get compliance dashboard summary (Admin only)' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard generated' })
  getDashboard() {
    return this.complianceReporting.getDashboard();
  }

  @Get('access-review')
  @ApiOperation({ summary: 'Get privileged access review report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Access review report generated' })
  getAccessReview() {
    return this.complianceReporting.getAccessReviewReport();
  }

  @Get('dsr')
  @ApiOperation({ summary: 'List data subject requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'DSR list returned' })
  listDataSubjectRequests(@Query() query: DataSubjectRequestQueryDto) {
    return this.complianceService.listDataSubjectRequests(query);
  }

  @Patch('dsr/:id')
  @ApiOperation({ summary: 'Update data subject request status (Admin only)' })
  @ApiResponse({ status: 200, description: 'DSR updated' })
  updateDataSubjectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDataSubjectRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.complianceService.updateDataSubjectRequest(id, {
      status: body.status,
      adminNotes: body.adminNotes,
      handledByUserId: req.user.id,
    });
  }

  @Get('audit-export')
  @ApiOperation({ summary: 'Export audit events for compliance evidence' })
  @ApiResponse({ status: 200, description: 'Audit export generated' })
  exportAuditEvents(@Query() query: ComplianceAuditExportQueryDto) {
    return this.complianceReporting.exportAuditEvents(query);
  }
}
