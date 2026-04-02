import { AgentMcpController } from './agent-mcp.controller';
import { AgentActionKey } from './agent-actions.registry';

describe('AgentMcpController', () => {
  const agentMcpService = {
    listAllowedActions: jest.fn(),
    executeAction: jest.fn(),
  };

  let controller: AgentMcpController;

  const req = {
    agentContext: {
      agent: {
        id: 7,
        name: 'Planner',
        description: 'desc',
        lastUsedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      user: {
        id: 9,
        username: 'owner',
        email: 'owner@example.com',
      },
      apiKey: {
        id: 12,
      },
      permissions: [{ actionKey: AgentActionKey.USER_PROFILE_READ }],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AgentMcpController(agentMcpService as never);
  });

  it('returns MCP metadata for authenticated agent context', async () => {
    const metadata = await controller.getMetadata(req as never);

    expect(metadata).toEqual(
      expect.objectContaining({
        agent: expect.objectContaining({ id: 7 }),
        owner: expect.objectContaining({ id: 9 }),
        protocol: expect.objectContaining({ version: '1.0' }),
      }),
    );
  });

  it('delegates action listing and execution to AgentMcpService', async () => {
    agentMcpService.listAllowedActions.mockReturnValue([{ key: 'user.profile.read' }]);
    agentMcpService.executeAction.mockResolvedValue({ ok: true });

    const actions = await controller.listActions(req as never);
    const result = await controller.execute(req as never, {
      action: AgentActionKey.USER_PROFILE_READ,
      parameters: {},
    });

    expect(actions).toEqual([{ key: 'user.profile.read' }]);
    expect(agentMcpService.executeAction).toHaveBeenCalledWith(
      req.agentContext,
      expect.objectContaining({
        action: AgentActionKey.USER_PROFILE_READ,
      }),
    );
    expect(result).toEqual({ ok: true });
  });
});

