import { All, Body, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AgentApiKeyGuard } from './guards/agent-api-key.guard';
import { AgentMcpHttpService } from './agent-mcp-http.service';
import type { AgentContext } from './interfaces/agent-context.interface';

type AgentRequest = Request & { agentContext: AgentContext };

@Controller('mcp/stream')
@UseGuards(AgentApiKeyGuard)
export class AgentMcpStreamController {
  constructor(private readonly httpService: AgentMcpHttpService) {}

  @All()
  async handleRequest(
    @Req() req: AgentRequest,
    @Res({ passthrough: false }) res: Response,
    @Body() body: unknown,
  ): Promise<void> {
    const payload = req.method === 'POST' ? body : undefined;
    await this.httpService.handleStreamRequest(
      req.agentContext,
      req,
      res,
      payload,
    );
  }
}
