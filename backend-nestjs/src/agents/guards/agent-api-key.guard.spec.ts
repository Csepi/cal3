import { UnauthorizedException } from '@nestjs/common';
import { AgentApiKeyGuard } from './agent-api-key.guard';

describe('AgentApiKeyGuard', () => {
  const agentAuthorizationService = {
    validateApiKey: jest.fn(),
  };
  const auditTrailService = {
    logSecurityEvent: jest.fn(),
  };

  let guard: AgentApiKeyGuard;

  const buildExecutionContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    auditTrailService.logSecurityEvent.mockResolvedValue(undefined);
    guard = new AgentApiKeyGuard(
      agentAuthorizationService as never,
      auditTrailService as never,
    );
  });

  it('extracts token from x-agent-key and attaches agent context', async () => {
    const request = {
      method: 'GET',
      url: '/mcp/actions',
      originalUrl: '/mcp/actions',
      headers: {
        'x-agent-key': 'ag_sk_1_secret',
      },
    };
    const context = {
      agent: { id: 7 },
      apiKey: { id: 8 },
      user: { id: 9 },
    };
    agentAuthorizationService.validateApiKey.mockResolvedValue(context);

    const result = await guard.canActivate(buildExecutionContext(request));

    expect(result).toBe(true);
    expect(agentAuthorizationService.validateApiKey).toHaveBeenCalledWith(
      'ag_sk_1_secret',
    );
    expect((request as { agentContext?: unknown }).agentContext).toBe(context);
    expect((request as { user?: unknown }).user).toEqual({ id: 9 });
  });

  it('extracts token from x-agent-token fallback header', async () => {
    const request = {
      method: 'GET',
      url: '/mcp/actions',
      originalUrl: '/mcp/actions',
      headers: {
        'x-agent-token': 'ag_sk_2_secret',
      },
    };
    agentAuthorizationService.validateApiKey.mockResolvedValue({
      agent: { id: 1 },
      apiKey: { id: 2 },
      user: { id: 3 },
    });

    await guard.canActivate(buildExecutionContext(request));

    expect(agentAuthorizationService.validateApiKey).toHaveBeenCalledWith(
      'ag_sk_2_secret',
    );
  });

  it('extracts token from Authorization: Agent header', async () => {
    const request = {
      method: 'GET',
      url: '/mcp/actions',
      originalUrl: '/mcp/actions',
      headers: {
        authorization: 'Agent ag_sk_3_secret',
      },
    };
    agentAuthorizationService.validateApiKey.mockResolvedValue({
      agent: { id: 1 },
      apiKey: { id: 2 },
      user: { id: 3 },
    });

    await guard.canActivate(buildExecutionContext(request));

    expect(agentAuthorizationService.validateApiKey).toHaveBeenCalledWith(
      'ag_sk_3_secret',
    );
  });

  it('rejects Bearer authorization header for MCP endpoint auth', async () => {
    const request = {
      method: 'GET',
      url: '/mcp/actions',
      originalUrl: '/mcp/actions',
      headers: {
        authorization: 'Bearer access-token',
      },
    };

    await expect(
      guard.canActivate(buildExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditTrailService.logSecurityEvent).toHaveBeenCalledWith(
      'mcp.endpoint.request',
      expect.objectContaining({
        error: expect.any(String),
      }),
      expect.objectContaining({
        outcome: 'failure',
      }),
    );
  });

  it('rejects when no agent token is provided', async () => {
    const request = {
      method: 'POST',
      url: '/mcp/execute',
      originalUrl: '/mcp/execute',
      headers: {},
    };

    await expect(
      guard.canActivate(buildExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('audits failures from token validation and rethrows', async () => {
    const request = {
      method: 'GET',
      url: '/mcp/actions',
      originalUrl: '/mcp/actions',
      headers: {
        'x-agent-key': 'ag_sk_bad',
      },
    };
    agentAuthorizationService.validateApiKey.mockRejectedValue(
      new UnauthorizedException('bad key'),
    );

    await expect(
      guard.canActivate(buildExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditTrailService.logSecurityEvent).toHaveBeenCalledWith(
      'mcp.endpoint.request',
      expect.objectContaining({
        method: 'GET',
        path: '/mcp/actions',
      }),
      expect.objectContaining({
        severity: 'warn',
        outcome: 'failure',
      }),
    );
  });
});

