import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AgentApiKeyGuard } from './guards/agent-api-key.guard';
import { AgentMcpService } from './agent-mcp.service';
import { ExecuteAgentActionDto } from './dto/agent.dto';
import { AgentContext } from './interfaces/agent-context.interface';

type AgentRequest = ExpressRequest & { agentContext: AgentContext };

@Controller('mcp')
@UseGuards(AgentApiKeyGuard)
export class AgentMcpController {
  constructor(private readonly agentMcpService: AgentMcpService) {}

  @Get('metadata')
  async getMetadata(@Req() req: AgentRequest) {
    const context = req.agentContext;
    return {
      agent: {
        id: context.agent.id,
        name: context.agent.name,
        description: context.agent.description,
        lastUsedAt: context.agent.lastUsedAt,
        createdAt: context.agent.createdAt,
        updatedAt: context.agent.updatedAt,
      },
      owner: {
        id: context.user.id,
        username: context.user.username,
        email: context.user.email,
      },
      protocol: {
        version: '1.0',
        transport: 'https',
      },
    };
  }

  @Get('actions')
  async listActions(@Req() req: AgentRequest) {
    return this.agentMcpService.listAllowedActions(req.agentContext);
  }

  @Post('execute')
  async execute(@Req() req: AgentRequest, @Body() dto: ExecuteAgentActionDto) {
    return this.agentMcpService.executeAction(req.agentContext, dto);
  }
}
