import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AgentAuthorizationService } from '../agent-authorization.service';
import { AgentContext } from '../interfaces/agent-context.interface';

type AgentRequest = Request & { agentContext?: AgentContext; user?: any };

@Injectable()
export class AgentApiKeyGuard implements CanActivate {
  constructor(
    private readonly agentAuthorizationService: AgentAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AgentRequest>();
    const token = this.extractToken(request);

    const agentContext =
      await this.agentAuthorizationService.validateApiKey(token);
    request.agentContext = agentContext;
    request.user = agentContext.user;
    return true;
  }

  private extractToken(request: AgentRequest): string {
    const headerToken =
      (request.headers['x-agent-key'] as string | undefined) ||
      (request.headers['x-agent-token'] as string | undefined);

    if (headerToken) {
      return headerToken.trim();
    }

    const authHeader = request.headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [scheme, credentials] = authHeader.split(' ');
      if (scheme && scheme.toLowerCase() === 'agent' && credentials) {
        return credentials.trim();
      }
      if (scheme && scheme.toLowerCase() === 'bearer') {
        throw new UnauthorizedException(
          'Bearer tokens are not valid for MCP endpoints.',
        );
      }
    }

    throw new UnauthorizedException('Agent API key is required.');
  }
}
