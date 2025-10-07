import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutomationService } from './automation.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationRuleDto,
  AutomationRuleDetailDto,
  PaginatedAutomationRulesDto,
} from './dto/automation-rule.dto';
import {
  AuditLogQueryDto,
  AuditLogDto,
  AuditLogDetailDto,
  PaginatedAuditLogsDto,
  AuditLogStatsDto,
} from './dto/automation-audit-log.dto';

@ApiTags('automation')
@Controller('automation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  // ========================================
  // AUTOMATION RULES ENDPOINTS
  // ========================================

  @Post('rules')
  @ApiOperation({ summary: 'Create a new automation rule' })
  @ApiResponse({
    status: 201,
    description: 'Rule created successfully',
    type: AutomationRuleDetailDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRule(
    @Body() createRuleDto: CreateAutomationRuleDto,
    @Req() req,
  ): Promise<AutomationRuleDetailDto> {
    const userId = req.user.id;
    return this.automationService.createRule(userId, createRuleDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List all automation rules for current user' })
  @ApiResponse({
    status: 200,
    description: 'Rules retrieved successfully',
    type: PaginatedAutomationRulesDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listRules(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('enabled') enabled?: string,
    @Req() req?,
  ): Promise<PaginatedAutomationRulesDto> {
    const userId = req.user.id;
    const isEnabled = enabled === 'true' ? true : enabled === 'false' ? false : undefined;
    return this.automationService.listRules(userId, page, limit, isEnabled);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get automation rule by ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Rule retrieved successfully',
    type: AutomationRuleDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async getRule(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<AutomationRuleDetailDto> {
    const userId = req.user.id;
    return this.automationService.getRule(userId, id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update an existing automation rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Rule updated successfully',
    type: AutomationRuleDetailDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async updateRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRuleDto: UpdateAutomationRuleDto,
    @Req() req,
  ): Promise<AutomationRuleDetailDto> {
    const userId = req.user.id;
    return this.automationService.updateRule(userId, id, updateRuleDto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an automation rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ status: 204, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async deleteRule(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<void> {
    const userId = req.user.id;
    await this.automationService.deleteRule(userId, id);
  }

  @Post('rules/:id/execute')
  @ApiOperation({ summary: 'Execute automation rule immediately ("Run Now" feature)' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution initiated',
    schema: {
      properties: {
        message: { type: 'string', example: 'Rule execution initiated' },
        executionCount: { type: 'number', example: 42 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async executeRule(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<{ message: string; executionCount: number }> {
    const userId = req.user.id;
    const executionCount = await this.automationService.executeRuleNow(userId, id);
    return {
      message: 'Rule execution initiated',
      executionCount,
    };
  }

  // ========================================
  // AUDIT LOG ENDPOINTS
  // ========================================

  @Get('rules/:id/audit-logs')
  @ApiOperation({ summary: 'Get audit logs for a specific rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: PaginatedAuditLogsDto,
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async getRuleAuditLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AuditLogQueryDto,
    @Req() req,
  ): Promise<PaginatedAuditLogsDto> {
    const userId = req.user.id;
    return this.automationService.getRuleAuditLogs(userId, id, query);
  }

  @Get('audit-logs/:logId')
  @ApiOperation({ summary: 'Get detailed audit log entry' })
  @ApiParam({ name: 'logId', description: 'Audit log entry ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    type: AuditLogDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your audit log' })
  async getAuditLog(
    @Param('logId', ParseIntPipe) logId: number,
    @Req() req,
  ): Promise<AuditLogDetailDto> {
    const userId = req.user.id;
    return this.automationService.getAuditLog(userId, logId);
  }

  @Get('rules/:id/stats')
  @ApiOperation({ summary: 'Get execution statistics for a rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: AuditLogStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your rule' })
  async getRuleStats(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<AuditLogStatsDto> {
    const userId = req.user.id;
    return this.automationService.getRuleStats(userId, id);
  }
}
