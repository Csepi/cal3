import { AgentMcpStreamController } from './agent-mcp-stream.controller';

describe('AgentMcpStreamController', () => {
  const httpService = {
    handleStreamRequest: jest.fn(),
  };

  let controller: AgentMcpStreamController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AgentMcpStreamController(httpService as never);
  });

  it('passes body.payload for POST stream requests', async () => {
    const req = {
      method: 'POST',
      agentContext: { agent: { id: 1 } },
    };
    const res = {};

    await controller.handleRequest(
      req as never,
      res as never,
      { payload: { jsonrpc: '2.0' } } as never,
    );

    expect(httpService.handleStreamRequest).toHaveBeenCalledWith(
      req.agentContext,
      req,
      res,
      { jsonrpc: '2.0' },
    );
  });

  it('passes undefined payload for non-POST stream requests', async () => {
    const req = {
      method: 'GET',
      agentContext: { agent: { id: 1 } },
    };
    const res = {};

    await controller.handleRequest(
      req as never,
      res as never,
      { payload: { ignored: true } } as never,
    );

    expect(httpService.handleStreamRequest).toHaveBeenCalledWith(
      req.agentContext,
      req,
      res,
      undefined,
    );
  });
});

