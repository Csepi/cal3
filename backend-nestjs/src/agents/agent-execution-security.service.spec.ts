import {
  BadRequestException,
  ForbiddenException,
  RequestTimeoutException,
} from '@nestjs/common';
import { SecurityStoreService } from '../api-security/services/security-store.service';
import { AgentActionKey } from './agent-actions.registry';
import { AgentExecutionSecurityService } from './agent-execution-security.service';
import { ThrottlerException } from '@nestjs/throttler';

describe('AgentExecutionSecurityService', () => {
  const store = {
    consumeSlidingWindow: jest.fn(),
  } as unknown as SecurityStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    (store.consumeSlidingWindow as jest.Mock).mockResolvedValue({
      count: 1,
      resetAtMs: Date.now() + 60_000,
    });
    delete process.env.AGENT_ACTION_DENYLIST;
    delete process.env.AGENT_MAX_EXECUTION_MS;
  });

  it('blocks denylisted actions', async () => {
    process.env.AGENT_ACTION_DENYLIST = AgentActionKey.TASKS_DELETE;
    const service = new AgentExecutionSecurityService(store);

    await expect(
      service.executeGuarded({
        agentId: 1,
        action: AgentActionKey.TASKS_DELETE,
        parameters: {},
        run: async () => ({ ok: true }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects URL-like parameters', async () => {
    const service = new AgentExecutionSecurityService(store);

    await expect(
      service.executeGuarded({
        agentId: 1,
        action: AgentActionKey.TASKS_CREATE,
        parameters: { webhookUrl: 'https://evil.example' },
        run: async () => ({ ok: true }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces execution rate limits', async () => {
    (store.consumeSlidingWindow as jest.Mock).mockResolvedValue({
      count: 9999,
      resetAtMs: Date.now() + 20_000,
    });
    const service = new AgentExecutionSecurityService(store);

    await expect(
      service.executeGuarded({
        agentId: 1,
        action: AgentActionKey.TASKS_CREATE,
        parameters: {},
        run: async () => ({ ok: true }),
      }),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });

  it('fails long-running actions with timeout', async () => {
    process.env.AGENT_MAX_EXECUTION_MS = '10';
    const service = new AgentExecutionSecurityService(store);

    await expect(
      service.executeGuarded({
        agentId: 1,
        action: AgentActionKey.TASKS_CREATE,
        parameters: {},
        run: async () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true }), 50);
          }),
      }),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });
});
