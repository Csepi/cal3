import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AgentActionKey } from './agent-actions.registry';
import { AgentStatus } from '../entities/agent-profile.entity';
import { AgentsService } from './agents.service';
import { upgradeLegacyCalendarPermissions } from './legacy-permissions.helper';

jest.mock('./legacy-permissions.helper', () => ({
  upgradeLegacyCalendarPermissions: jest.fn(),
}));

describe('AgentsService', () => {
  const agentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const agentPermissionRepository = {
    manager: {
      transaction: jest.fn(),
    },
    find: jest.fn(),
  };
  const agentApiKeyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const agentKeysService = {
    generateKey: jest.fn(),
  };
  const featureFlagsService = {
    isAgentIntegrationsEnabled: jest.fn(),
  };

  const mockedUpgrade = upgradeLegacyCalendarPermissions as jest.MockedFunction<
    typeof upgradeLegacyCalendarPermissions
  >;

  let service: AgentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    featureFlagsService.isAgentIntegrationsEnabled.mockReturnValue(true);
    mockedUpgrade.mockImplementation(async (_agentId, _repo, permissions) => permissions);
    service = new AgentsService(
      agentRepository as never,
      agentPermissionRepository as never,
      agentApiKeyRepository as never,
      userRepository as never,
      agentKeysService as never,
      featureFlagsService as never,
    );
  });

  it('blocks operations when agent integrations feature flag is disabled', async () => {
    featureFlagsService.isAgentIntegrationsEnabled.mockReturnValue(false);

    await expect(service.listAgentsForUser(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects createAgent when owner user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createAgent(10, { name: 'Planner' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects createAgent on duplicate agent name for same owner', async () => {
    userRepository.findOne.mockResolvedValue({ id: 10, isActive: true });
    agentRepository.findOne.mockResolvedValue({ id: 99, name: 'Planner' });

    await expect(
      service.createAgent(10, { name: 'Planner' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates agent profile successfully for valid user', async () => {
    userRepository.findOne.mockResolvedValue({ id: 10, isActive: true });
    agentRepository.findOne.mockResolvedValue(null);
    agentRepository.create.mockImplementation((payload) => payload);
    agentRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 5,
    }));

    const result = await service.createAgent(10, {
      name: 'Planner',
      description: 'Daily planning',
    });

    expect(result.id).toBe(5);
    expect(agentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        name: 'Planner',
        status: AgentStatus.ACTIVE,
      }),
    );
  });

  it('normalizes and de-duplicates calendarIds in replacePermissions', async () => {
    const txManager = {
      delete: jest.fn(),
      create: jest.fn((_entity: unknown, payload: unknown) => payload),
      save: jest.fn(async (entities: unknown[]) => entities),
    };
    agentPermissionRepository.manager.transaction.mockImplementation(
      async (
        callback: (manager: typeof txManager) => Promise<unknown>,
      ) => callback(txManager),
    );
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      permissions: [],
      apiKeys: [],
    });

    const result = await service.replacePermissions(7, 10, {
      permissions: [
        {
          actionKey: AgentActionKey.CALENDAR_LIST,
          scope: { calendarIds: [1, '2', 2] },
        },
      ],
    });

    expect(txManager.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        agentId: 7,
        actionKey: AgentActionKey.CALENDAR_LIST,
        scope: { calendarIds: [1, 2] },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        actionKey: AgentActionKey.CALENDAR_LIST,
      }),
    ]);
  });

  it('rejects replacePermissions when required scope property is missing', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      permissions: [],
      apiKeys: [],
    });

    await expect(
      service.replacePermissions(7, 10, {
        permissions: [
          {
            actionKey: AgentActionKey.CALENDAR_EVENTS_UPDATE,
            scope: {},
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects createAgentKey when agent is disabled', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      status: AgentStatus.DISABLED,
    });

    await expect(
      service.createAgentKey(7, 10, { label: 'Main key' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates agent key and returns plaintext token once', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      status: AgentStatus.ACTIVE,
    });
    agentKeysService.generateKey.mockResolvedValue({
      tokenId: 'token-id',
      hashed: 'hashed-value',
      lastFour: 'A1B2',
      token: 'ag_sk_...',
    });
    agentApiKeyRepository.create.mockImplementation((payload) => payload);
    agentApiKeyRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 41,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt: null,
    }));

    const result = await service.createAgentKey(7, 10, { label: 'Main key' });

    expect(result.plaintextToken).toBe('ag_sk_...');
    expect(result.key.id).toBe(41);
    expect(agentApiKeyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 7,
        tokenId: 'token-id',
        hashedKey: 'hashed-value',
      }),
    );
  });

  it('throws not found on revokeAgentKey when key does not exist', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      status: AgentStatus.ACTIVE,
    });
    agentApiKeyRepository.findOne.mockResolvedValue(null);

    await expect(service.revokeAgentKey(7, 123, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns without saving when revoking an already inactive key', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 7,
      userId: 10,
      status: AgentStatus.ACTIVE,
    });
    agentApiKeyRepository.findOne.mockResolvedValue({
      id: 123,
      agentId: 7,
      isActive: false,
    });

    await service.revokeAgentKey(7, 123, 10);

    expect(agentApiKeyRepository.save).not.toHaveBeenCalled();
  });

  it('returns list summaries with only active api key count', async () => {
    agentRepository.find.mockResolvedValue([
      {
        id: 7,
        name: 'Planner',
        description: null,
        status: AgentStatus.ACTIVE,
        lastUsedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        permissions: [{ actionKey: AgentActionKey.CALENDAR_LIST }],
        apiKeys: [{ isActive: true }, { isActive: false }],
      },
    ]);

    const result = await service.listAgentsForUser(10);

    expect(result[0].apiKeyCount).toBe(1);
    expect(result[0].actionKeys).toEqual([AgentActionKey.CALENDAR_LIST]);
  });

  it('returns agent detail with permissions and active key count', async () => {
    agentRepository.findOne.mockResolvedValue({
      id: 9,
      userId: 10,
      name: 'Planner',
      description: 'desc',
      status: AgentStatus.ACTIVE,
      lastUsedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      permissions: [
        {
          actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
          scope: { ruleIds: [1] },
        },
      ],
      apiKeys: [{ isActive: true }, { isActive: true }, { isActive: false }],
    });

    const detail = await service.getAgentDetail(9, 10);

    expect(detail.id).toBe(9);
    expect(detail.apiKeyCount).toBe(2);
    expect(detail.permissions).toEqual([
      expect.objectContaining({
        actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
      }),
    ]);
  });
});

