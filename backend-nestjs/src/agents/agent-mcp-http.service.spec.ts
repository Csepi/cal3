jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

const mockMcpServers: Array<any> = [];
const mockTransports: Array<any> = [];

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  class MockMcpServer {
    readonly server = {
      registerCapabilities: jest.fn(),
      setRequestHandler: jest.fn(),
    };

    readonly registerTool = jest.fn();
    readonly connect = jest.fn().mockResolvedValue(undefined);

    constructor(readonly config: unknown) {
      mockMcpServers.push(this);
    }
  }

  return { McpServer: MockMcpServer };
});

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
  class MockStreamableHTTPServerTransport {
    readonly handleRequest = jest.fn().mockResolvedValue(undefined);
    readonly close = jest.fn().mockResolvedValue(undefined);

    constructor(readonly options: unknown) {
      mockTransports.push(this);
    }
  }

  return { StreamableHTTPServerTransport: MockStreamableHTTPServerTransport };
});

jest.mock('../common/errors/error-logger', () => ({
  logError: jest.fn(),
}));

jest.mock('../common/errors/error-context', () => ({
  buildErrorContext: jest.fn(() => ({ mocked: true })),
}));

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { AgentActionKey } from './agent-actions.registry';
import { AgentMcpHttpService } from './agent-mcp-http.service';
import { AgentMcpService } from './agent-mcp.service';

describe('AgentMcpHttpService', () => {
  const agentMcpService = {
    executeAction: jest.fn(),
  };

  const baseContext = {
    agent: { id: 41 },
    apiKey: { id: 81 },
    user: { id: 9 },
    permissions: [{ actionKey: AgentActionKey.TASKS_CREATE }],
  };

  let service: AgentMcpHttpService;

  const createRequest = (
    method: string,
    sessionId?: string,
  ): Request & { get: jest.Mock } =>
    ({
      method,
      originalUrl: '/api/agents/mcp',
      url: '/api/agents/mcp',
      headers: sessionId ? { 'mcp-session-id': sessionId } : {},
      get: jest.fn((name: string) =>
        sessionId && name.toLowerCase() === 'mcp-session-id' ? sessionId : undefined,
      ),
    }) as unknown as Request & { get: jest.Mock };

  const createResponse = (): Response & {
    on: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
    headersSent: boolean;
  } =>
    ({
      headersSent: false,
      on: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }) as unknown as Response & {
      on: jest.Mock;
      status: jest.Mock;
      json: jest.Mock;
      headersSent: boolean;
    };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMcpServers.length = 0;
    mockTransports.length = 0;
    (randomUUID as jest.Mock).mockReturnValue('session-1');
    service = new AgentMcpHttpService(agentMcpService as never);
  });

  it('creates and reuses sessions while safely stringifying circular payloads', async () => {
    const req = createRequest('POST');
    const res = createResponse();
    const body: Record<string, unknown> = {};
    body.self = body;

    await service.handleStreamRequest(baseContext as never, req, res, body);

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(mockMcpServers).toHaveLength(1);
    expect(mockTransports).toHaveLength(1);
    expect(mockTransports[0].handleRequest).toHaveBeenCalledWith(
      req,
      res,
      body,
    );
    expect((service as any).sessions.size).toBe(1);

    const sessionId = 'session-1';
    const reusedReq = createRequest('POST', sessionId);
    const reusedRes = createResponse();

    await service.handleStreamRequest(baseContext as never, reusedReq, reusedRes, {
      ping: true,
    });

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(mockTransports[0].handleRequest).toHaveBeenCalledTimes(2);
    expect((service as any).sessions.size).toBe(1);
  });

  it('recreates a session when the same id is reused by another agent', async () => {
    const req = createRequest('POST');
    const res = createResponse();
    await service.handleStreamRequest(baseContext as never, req, res, {
      first: true,
    });

    const otherContext = {
      ...baseContext,
      agent: { id: 42 },
    };
    const sameSessionReq = createRequest('POST', 'session-1');
    const sameSessionRes = createResponse();

    await service.handleStreamRequest(
      otherContext as never,
      sameSessionReq,
      sameSessionRes,
      { second: true },
    );

    expect(mockMcpServers).toHaveLength(2);
    expect(mockTransports).toHaveLength(2);
    expect(mockTransports[1].handleRequest).toHaveBeenCalledTimes(1);
    expect((service as any).sessions.get('session-1').context.agent.id).toBe(42);
  });

  it('removes a session after DELETE requests complete', async () => {
    const req = createRequest('DELETE');
    const res = createResponse();

    await service.handleStreamRequest(baseContext as never, req, res, {
      delete: true,
    });

    expect(mockTransports[0].handleRequest).toHaveBeenCalledTimes(1);
    expect(mockTransports[0].close).toHaveBeenCalledTimes(1);
    expect((service as any).sessions.size).toBe(0);
  });

  it('returns a jsonrpc error response when transport execution fails', async () => {
    const req = createRequest('POST');
    const res = createResponse();
    mockTransports.length = 0;

    await service.handleStreamRequest(baseContext as never, req, res, {
      payload: true,
    });

    mockTransports[0].handleRequest.mockRejectedValueOnce(new Error('boom'));

    const errorReq = createRequest('POST', 'session-1');
    const errorRes = createResponse();

    await service.handleStreamRequest(
      baseContext as never,
      errorReq,
      errorRes,
      { payload: true },
    );

    expect(errorRes.status).toHaveBeenCalledWith(500);
    expect(errorRes.json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'errors.auto.backend.kfbb5b2a6d525',
      },
      id: null,
    });
  });

  it('wraps tool execution results and failures at the MCP layer', async () => {
    const req = createRequest('POST');
    const res = createResponse();
    await service.handleStreamRequest(baseContext as never, req, res, {
      payload: true,
    });

    const server = mockMcpServers[0];
    const registerToolCall = server.registerTool.mock.calls.find(
      ([name]: [string]) => name === 'tasks-create',
    );
    expect(registerToolCall).toBeDefined();
    const [, , toolHandler] = registerToolCall as [string, unknown, (input: Record<string, unknown>) => Promise<unknown>];

    agentMcpService.executeAction.mockResolvedValueOnce({
      actionId: 1,
      actionType: 'tasks.create',
      success: true,
      data: { id: 99 },
      executedAt: new Date('2025-01-01T00:00:00Z'),
    });

    await expect(toolHandler({ title: 'Plan' })).resolves.toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              actionId: 1,
              actionType: 'tasks.create',
              success: true,
              data: { id: 99 },
              executedAt: new Date('2025-01-01T00:00:00Z'),
            },
            null,
            2,
          ),
        },
      ],
      structuredContent: {
        actionId: 1,
        actionType: 'tasks.create',
        success: true,
        data: { id: 99 },
        executedAt: new Date('2025-01-01T00:00:00Z'),
      },
    });

    agentMcpService.executeAction.mockRejectedValueOnce(new Error('tool boom'));

    await expect(toolHandler({ title: 'Broken' })).resolves.toEqual({
      isError: true,
      content: [{ type: 'text', text: 'tool boom' }],
    });
  });
});
