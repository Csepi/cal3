import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/types/request-with-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';
import {
  CreateAgentDto,
  CreateAgentKeyDto,
  UpdateAgentDto,
  UpdateAgentPermissionsDto,
} from './dto/agent.dto';
import { CalendarsService } from '../calendars/calendars.service';
import { AutomationService } from '../automation/automation.service';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly calendarsService: CalendarsService,
    private readonly automationService: AutomationService,
  ) {}

  @Get()
  async listAgents(@Request() req: RequestWithUser) {
    return this.agentsService.listAgentsForUser(req.user.id);
  }

  @Post()
  async createAgent(
    @Request() req: RequestWithUser,
    @Body() dto: CreateAgentDto,
  ) {
    return this.agentsService.createAgent(req.user.id, dto);
  }

  @Get('catalog')
  async getActionCatalogue(@Request() req: RequestWithUser) {
    const actions = await this.agentsService.getActionCatalogue();
    const calendars = await this.calendarsService.findAll(req.user.id);
    const rulesResponse = await this.automationService.listRules(
      req.user.id,
      1,
      100,
    );

    return {
      actions,
      resources: {
        calendars: calendars.map((calendar) => ({
          id: calendar.id,
          name: calendar.name,
          color: calendar.color,
          ownerId: calendar.ownerId,
          description: calendar.description,
        })),
        automationRules: rulesResponse.data.map((rule) => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          isEnabled: rule.isEnabled,
          triggerType: rule.triggerType,
        })),
      },
    };
  }

  @Get(':id')
  async getAgent(@Request() req: RequestWithUser, @Param('id') id: number) {
    return this.agentsService.getAgentDetail(Number(id), req.user.id);
  }

  @Put(':id')
  async updateAgent(
    @Request() req: RequestWithUser,
    @Param('id') id: number,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.updateAgent(Number(id), req.user.id, dto);
  }

  @Delete(':id')
  async disableAgent(@Request() req: RequestWithUser, @Param('id') id: number) {
    await this.agentsService.disableAgent(Number(id), req.user.id);
    return { success: true };
  }

  @Put(':id/permissions')
  async updatePermissions(
    @Request() req: RequestWithUser,
    @Param('id') id: number,
    @Body() dto: UpdateAgentPermissionsDto,
  ) {
    return this.agentsService.replacePermissions(Number(id), req.user.id, dto);
  }

  @Get(':id/keys')
  async listKeys(@Request() req: RequestWithUser, @Param('id') id: number) {
    return this.agentsService.listAgentKeys(Number(id), req.user.id);
  }

  @Post(':id/keys')
  async createKey(
    @Request() req: RequestWithUser,
    @Param('id') id: number,
    @Body() dto: CreateAgentKeyDto,
  ) {
    return this.agentsService.createAgentKey(Number(id), req.user.id, dto);
  }

  @Delete(':id/keys/:keyId')
  async revokeKey(
    @Request() req: RequestWithUser,
    @Param('id') id: number,
    @Param('keyId') keyId: number,
  ) {
    await this.agentsService.revokeAgentKey(
      Number(id),
      Number(keyId),
      req.user.id,
    );
    return { success: true };
  }
}
