import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AgentActionKey } from './agent-actions.registry';
import { AgentAuthorizationService } from './agent-authorization.service';
import { AgentStatus } from '../entities/agent-profile.entity';

describe('AgentAuthorizationService', () => {
  const agentApiKeyRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const agentProfileRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const agentPermissionRepository = {
    manager: { transaction: jest.fn() },
    find: jest.fn(),
  };
  const agentKeysService = {
    verifyKey: jest.fn(),
  };
  const featureFlagsService = {
    isAgentIntegrationsEnabled: jest.fn(),
  };

  const tokenId = '11111111-1111-1111-1111-111111111111';
  const validToken = `ag_sk_${tokenId}_secretPart`;

  let service: AgentAuthorizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    featureFlagsService.isAgentIntegrationsEnabled.mockReturnValue(true);
    agentKeysService.verifyKey.mockResolvedValue(true);
    service = new AgentAuthorizationService(
      agentApiKeyRepository as never,
      agentProfileRepository as never,
      agentPermissionRepository as never,
      agentKeysService as never,
      featureFlagsService as never,
    );
  });

  it('blocks API key validation when agent integrations feature is disabled', async () => {
    featureFlagsService.isAgentIntegrationsEnabled.mockReturnValue(false);

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects malformed API key tokens', async () => {
    await expect(service.validateApiKey('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects inactive API keys', async () => {
    agentApiKeyRepository.findOne.mockResolvedValue({
      tokenId,
      hashedKey: 'hashed',
      isActive: false,
    });

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects API keys that fail hash verification', async () => {
    agentApiKeyRepository.findOne.mockResolvedValue({
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
    });
    agentKeysService.verifyKey.mockResolvedValue(false);

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns context and updates usage timestamps for stale keys', async () => {
    const apiKey = {
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
      lastUsedAt: new Date(Date.now() - 10_000),
    };
    const permission = {
      actionKey: AgentActionKey.CALENDAR_LIST,
      scope: { calendarIds: [10, 20] },
    };
    const agent = {
      id: 7,
      status: AgentStatus.ACTIVE,
      user: { id: 4, isActive: true },
      permissions: [permission],
    };

    agentApiKeyRepository.findOne.mockResolvedValue(apiKey);
    agentProfileRepository.findOne.mockResolvedValue(agent);

    const context = await service.validateApiKey(validToken);

    expect(context.agent.id).toBe(7);
    expect(context.user.id).toBe(4);
    expect(context.permissions).toEqual([permission]);
    expect(agentApiKeyRepository.save).toHaveBeenCalledTimes(1);
    expect(agentProfileRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not persist usage timestamps when the key was used recently', async () => {
    const apiKey = {
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
      lastUsedAt: new Date(Date.now() - 500),
    };
    const agent = {
      id: 7,
      status: AgentStatus.ACTIVE,
      user: { id: 4, isActive: true },
      permissions: [],
    };

    agentApiKeyRepository.findOne.mockResolvedValue(apiKey);
    agentProfileRepository.findOne.mockResolvedValue(agent);

    await service.validateApiKey(validToken);

    expect(agentApiKeyRepository.save).not.toHaveBeenCalled();
    expect(agentProfileRepository.save).not.toHaveBeenCalled();
  });

  it('rejects validation when referenced agent profile does not exist', async () => {
    agentApiKeyRepository.findOne.mockResolvedValue({
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
    });
    agentProfileRepository.findOne.mockResolvedValue(null);

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects validation when agent status is not active', async () => {
    agentApiKeyRepository.findOne.mockResolvedValue({
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
    });
    agentProfileRepository.findOne.mockResolvedValue({
      id: 7,
      status: AgentStatus.DISABLED,
      user: { id: 4, isActive: true },
      permissions: [],
    });

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects validation when owning user is inactive', async () => {
    agentApiKeyRepository.findOne.mockResolvedValue({
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
    });
    agentProfileRepository.findOne.mockResolvedValue({
      id: 7,
      status: AgentStatus.ACTIVE,
      user: { id: 4, isActive: false },
      permissions: [],
    });

    await expect(service.validateApiKey(validToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not persist usage metadata when key was used very recently', async () => {
    const apiKey = {
      id: 12,
      tokenId,
      agentId: 7,
      hashedKey: 'hashed',
      isActive: true,
      lastUsedAt: new Date(),
    };
    agentApiKeyRepository.findOne.mockResolvedValue(apiKey);
    agentProfileRepository.findOne.mockResolvedValue({
      id: 7,
      status: AgentStatus.ACTIVE,
      user: { id: 4, isActive: true },
      permissions: [],
    });

    await service.validateApiKey(validToken);

    expect(agentApiKeyRepository.save).not.toHaveBeenCalled();
    expect(agentProfileRepository.save).not.toHaveBeenCalled();
  });

  it('blocks calendar access when the requested calendar is outside scope', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.CALENDAR_EVENTS_READ,
          scope: { calendarIds: [101] },
        },
      ],
    };

    expect(() =>
      service.ensureCalendarAccess(
        context as never,
        AgentActionKey.CALENDAR_EVENTS_READ,
        202,
      ),
    ).toThrow(ForbiddenException);
  });

  it('blocks automation rule access when required rule ids are missing', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
          scope: { ruleIds: [] },
        },
      ],
    };

    expect(() =>
      service.ensureAutomationRuleAccess(
        context as never,
        AgentActionKey.AUTOMATION_RULES_TRIGGER,
        5,
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows automation rule access when the requested rule is within scope', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
          scope: { ruleIds: [5, 9] },
        },
      ],
    };

    expect(
      service.ensureAutomationRuleAccess(
        context as never,
        AgentActionKey.AUTOMATION_RULES_TRIGGER,
        9,
      ),
    ).toEqual(
      expect.objectContaining({
        actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
      }),
    );
    expect(
      service.getAllowedResourceIds(
        context as never,
        AgentActionKey.AUTOMATION_RULES_TRIGGER,
        'ruleIds',
      ),
    ).toEqual([5, 9]);
  });

  it('allows automation rule access when rule id is explicitly scoped', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
          scope: { ruleIds: [5, 8] },
        },
      ],
    };

    const permission = service.ensureAutomationRuleAccess(
      context as never,
      AgentActionKey.AUTOMATION_RULES_TRIGGER,
      8,
    );

    expect(permission).toEqual(
      expect.objectContaining({
        actionKey: AgentActionKey.AUTOMATION_RULES_TRIGGER,
      }),
    );
  });

  it('filters allowed resource ids to positive integers only', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.CALENDAR_LIST,
          scope: { calendarIds: [1, 2, 0, -1, 3.5, '4', null] },
        },
      ],
    };

    const ids = service.getAllowedResourceIds(
      context as never,
      AgentActionKey.CALENDAR_LIST,
      'calendarIds',
    );

    expect(ids).toEqual([1, 2]);
  });

  it('filters ruleIds using positive integer validation', () => {
    const context = {
      permissions: [
        {
          actionKey: AgentActionKey.AUTOMATION_RULES_LIST,
          scope: { ruleIds: [3, 4, 0, -3, '5', 1.2] },
        },
      ],
    };

    const ids = service.getAllowedResourceIds(
      context as never,
      AgentActionKey.AUTOMATION_RULES_LIST,
      'ruleIds',
    );

    expect(ids).toEqual([3, 4]);
  });
});
