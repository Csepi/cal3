import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AutomationService } from './automation.service';
import { AutomationSecurityService } from './security/automation-security.service';
import { WebhookSecurityService } from './security/webhook-security.service';
import { SecurityAuditService } from '../logging/security-audit.service';
import { AutomationRule, ConditionLogic, TriggerType } from '../entities/automation-rule.entity';
import { AutomationAction, ActionType } from '../entities/automation-action.entity';
import { AuditLogStatus } from '../entities/automation-audit-log.entity';

jest.mock('../common/errors/error-logger', () => ({
  logError: jest.fn(),
}));

jest.mock('../common/errors/error-context', () => ({
  buildErrorContext: jest.fn(() => ({ mocked: true })),
}));

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(),
  };
});

describe('AutomationService', () => {
  const ruleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const conditionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const actionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const auditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const scheduledTriggerRepository = {
    update: jest.fn(),
  };
  const eventRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };
  const evaluatorService = {
    evaluateConditions: jest.fn(),
  };
  const executorRegistry = {
    getExecutor: jest.fn(),
  };
  const webhookSecurity = {
    generateWebhookSecret: jest.fn(),
    verifyIncomingRequest: jest.fn(),
    computeRotatedSecretState: jest.fn(),
  };
  const automationSecurity = {
    assertKillSwitchDisabled: jest.fn(),
    assertApprovalSatisfied: jest.fn(),
    assertWithinRateLimits: jest.fn(),
    applyApprovalRequirement: jest.fn(),
  };
  const securityAudit = {
    log: jest.fn(),
  };

  let service: AutomationService;
  let syncSchedulesSpy: jest.SpyInstance;
  const randomBytesMock = crypto.randomBytes as jest.MockedFunction<
    typeof crypto.randomBytes
  >;

  const buildRule = (overrides: Partial<AutomationRule> = {}): AutomationRule =>
    ({
      id: 44,
      name: 'Morning automation',
      description: 'desc',
      triggerType: TriggerType.EVENT_CREATED,
      triggerConfig: { foo: 'bar' },
      isEnabled: true,
      conditionLogic: ConditionLogic.AND,
      lastExecutedAt: null,
      executionCount: 0,
      webhookToken: 'token',
      webhookSecret: 'secret',
      webhookSecretPrevious: null,
      webhookSecretRotatedAt: null,
      webhookSecretGraceUntil: null,
      isApprovalRequired: false,
      approvedAt: null,
      approvedByUserId: null,
      createdById: 9,
      conditions: [],
      actions: [],
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      ...overrides,
    }) as AutomationRule;

  const buildAction = (overrides: Partial<AutomationAction> = {}): AutomationAction =>
    ({
      id: 1,
      actionType: ActionType.SEND_NOTIFICATION,
      actionConfig: {},
      order: 0,
      ...overrides,
    }) as AutomationAction;

  beforeEach(() => {
    jest.resetAllMocks();
    randomBytesMock.mockReset();

    ruleRepository.findOne.mockResolvedValue(null);
    ruleRepository.create.mockImplementation((value) => ({ ...value }));
    ruleRepository.save.mockImplementation(async (value) => value);
    ruleRepository.update.mockResolvedValue({ affected: 1 });
    ruleRepository.remove.mockResolvedValue(undefined);
    ruleRepository.increment.mockResolvedValue({ affected: 1 });

    conditionRepository.create.mockImplementation((value) => ({ ...value }));
    conditionRepository.save.mockImplementation(async (value) => value);
    conditionRepository.delete.mockResolvedValue({ affected: 1 });

    actionRepository.create.mockImplementation((value) => ({ ...value }));
    actionRepository.save.mockImplementation(async (value) => value);
    actionRepository.delete.mockResolvedValue({ affected: 1 });

    auditLogRepository.create.mockImplementation((value) => value);
    auditLogRepository.save.mockResolvedValue({ id: 1 });

    eventRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    eventRepository.findOne.mockResolvedValue(null);

    evaluatorService.evaluateConditions.mockResolvedValue({
      passed: true,
      evaluations: [],
    });
    executorRegistry.getExecutor.mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        actionId: 1,
        actionType: ActionType.SEND_NOTIFICATION,
        success: true,
        data: { ok: true },
        executedAt: new Date('2025-01-01T00:00:00Z'),
      }),
    });

    webhookSecurity.generateWebhookSecret.mockReturnValue('secret-1');
    webhookSecurity.verifyIncomingRequest.mockResolvedValue({
      replayKey: 'replay-key',
      webhookTimestamp: new Date('2025-01-06T00:00:00Z'),
      usedPreviousSecret: false,
    });
    webhookSecurity.computeRotatedSecretState.mockReturnValue({
      webhookSecret: 'rotated-secret',
      webhookSecretPrevious: 'previous-secret',
      webhookSecretRotatedAt: new Date('2025-01-07T00:00:00Z'),
      webhookSecretGraceUntil: new Date('2025-01-08T00:00:00Z'),
    });

    automationSecurity.assertKillSwitchDisabled.mockImplementation(() => undefined);
    automationSecurity.assertApprovalSatisfied.mockImplementation(() => undefined);
    automationSecurity.assertWithinRateLimits.mockResolvedValue(undefined);
    automationSecurity.applyApprovalRequirement.mockReturnValue(false);

    securityAudit.log.mockResolvedValue(undefined);

    service = new AutomationService(
      ruleRepository as never,
      conditionRepository as never,
      actionRepository as never,
      auditLogRepository as never,
      scheduledTriggerRepository as never,
      eventRepository as never,
      evaluatorService as never,
      executorRegistry as never,
      webhookSecurity as never,
      automationSecurity as never,
      securityAudit as never,
    );

    syncSchedulesSpy = jest
      .spyOn(service as any, 'syncRelativeSchedulesForRule')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    syncSchedulesSpy.mockRestore();
  });

  it('creates webhook rules with generated credentials and approval metadata', async () => {
    const tokenBytes = Buffer.from(
      '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
      'hex',
    );
    randomBytesMock.mockReturnValue(tokenBytes);

    const savedRule = buildRule({
      id: 101,
      triggerType: TriggerType.WEBHOOK_INCOMING,
      isApprovalRequired: false,
      webhookToken: 'generated-token',
      webhookSecret: 'secret-1',
      actions: [],
      conditions: [],
    });
    const detailedRule = {
      ...savedRule,
      conditions: [{ id: 1 }],
      actions: [{ id: 2 }],
    } as AutomationRule;

    ruleRepository.save.mockResolvedValueOnce(savedRule);
    ruleRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(detailedRule);
    actionRepository.save.mockResolvedValueOnce([
      buildAction({ id: 2, actionType: ActionType.WEBHOOK }),
    ]);
    automationSecurity.applyApprovalRequirement.mockReturnValue(true);
    const getRuleSpy = jest
      .spyOn(service, 'getRule')
      .mockResolvedValue(detailedRule as never);

    const result = await service.createRule(9, {
      name: 'Webhook rule',
      description: 'desc',
      triggerType: TriggerType.WEBHOOK_INCOMING,
      triggerConfig: { allowedIps: ['127.0.0.1'] },
      isEnabled: true,
      conditionLogic: ConditionLogic.AND,
      conditions: [{ field: 'title', operator: 'contains', value: 'Plan' }],
      actions: [{ actionType: ActionType.WEBHOOK, actionConfig: { url: 'https://x.test' } }],
    } as never);

    expect(ruleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Webhook rule',
        triggerType: TriggerType.WEBHOOK_INCOMING,
      }),
    );
    expect(ruleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookToken:
          '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        webhookSecret: 'secret-1',
      }),
    );
    expect(ruleRepository.update).toHaveBeenCalledWith(
      { id: 101 },
      {
        isApprovalRequired: true,
        approvedAt: null,
        approvedByUserId: null,
      },
    );
    expect(syncSchedulesSpy).toHaveBeenCalledWith(101);
    expect(getRuleSpy).toHaveBeenCalledWith(9, 101);
    expect(result).toBe(detailedRule);
  });

  it('updates rules and clears approval metadata when reapproval is required', async () => {
    const existingRule = buildRule({
      id: 44,
      name: 'Morning automation',
      triggerType: TriggerType.WEBHOOK_INCOMING,
      isApprovalRequired: true,
      approvedAt: new Date('2025-01-01T00:00:00Z'),
      approvedByUserId: 9,
      actions: [buildAction({ id: 10, actionType: ActionType.SET_EVENT_COLOR })],
      conditions: [{ id: 11 }] as never,
    });

    ruleRepository.findOne.mockResolvedValueOnce(existingRule);
    actionRepository.save.mockResolvedValueOnce([
      buildAction({ id: 12, actionType: ActionType.WEBHOOK }),
    ]);
    const getRuleSpy = jest
      .spyOn(service, 'getRule')
      .mockResolvedValue({ ...existingRule, name: 'Morning automation updated' } as never);
    automationSecurity.applyApprovalRequirement.mockReturnValue(true);

    const updatedRule = { ...existingRule, name: 'Morning automation updated' } as AutomationRule;
    getRuleSpy.mockResolvedValue(updatedRule as never);

    const result = await service.updateRule(9, 44, {
      description: 'Updated description',
      isEnabled: false,
      triggerConfig: { allowedIps: ['10.0.0.1'] },
      actions: [{ actionType: ActionType.WEBHOOK, actionConfig: { url: 'https://example.test' } }],
      conditions: [{ field: 'title', operator: 'contains', value: 'Updated' }],
    } as never);

    expect(ruleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Updated description',
        isEnabled: false,
        triggerConfig: { allowedIps: ['10.0.0.1'] },
        isApprovalRequired: true,
        approvedAt: null,
        approvedByUserId: null,
      }),
    );
    expect(conditionRepository.delete).toHaveBeenCalledWith({ rule: { id: 44 } });
    expect(actionRepository.delete).toHaveBeenCalledWith({ rule: { id: 44 } });
    expect(syncSchedulesSpy).toHaveBeenCalled();
    expect(getRuleSpy).toHaveBeenCalledWith(9, 44);
    expect(result).toBe(updatedRule);
  });

  it('executes a rule now after ownership and security checks pass', async () => {
    const rule = buildRule({
      id: 55,
      actions: [buildAction({ id: 7, actionType: ActionType.SEND_NOTIFICATION })],
    });
    ruleRepository.findOne.mockResolvedValueOnce(rule);
    eventRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    });
    eventRepository.findOne.mockResolvedValue({ id: 1, calendarId: 2 } as never);
    const executeOnEventSpy = jest
      .spyOn(service, 'executeRuleOnEvent')
      .mockResolvedValue(undefined);

    const count = await service.executeRuleNow(9, 55, 'manual', 'user:9');

    expect(count).toBe(2);
    expect(securityAudit.log).toHaveBeenCalledWith(
      'automation.invocation',
      { userId: 9, ruleId: 55, source: 'manual' },
    );
    expect(executeOnEventSpy).toHaveBeenCalledTimes(2);
  });

  it('rejects execution when the rule is not owned by the caller', async () => {
    const forbiddenRule = buildRule();
    forbiddenRule.createdById = 10;
    ruleRepository.findOne.mockImplementation(async () => forbiddenRule);

    await expect(service.executeRuleNow(9, 55)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('writes success audit logs and updates execution metadata', async () => {
    const rule = buildRule({
      id: 66,
      triggerType: TriggerType.EVENT_CREATED,
      actions: [buildAction({ id: 8, actionType: ActionType.SEND_NOTIFICATION })],
    });
    const executor = {
      execute: jest.fn().mockResolvedValue({
        actionId: 8,
        actionType: ActionType.SEND_NOTIFICATION,
        success: true,
        data: { sent: true },
        executedAt: new Date('2025-01-05T00:00:00Z'),
      }),
    };
    executorRegistry.getExecutor.mockReturnValue(executor);

    await service.executeRuleOnEvent(
      rule,
      { id: 81, calendarId: 2 } as never,
      9,
      { source: 'manual' },
    );

    expect(evaluatorService.evaluateConditions).toHaveBeenCalledWith(
      rule,
      { id: 81, calendarId: 2 },
      { source: 'manual' },
    );
    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleId: 66,
        eventId: 81,
        status: AuditLogStatus.SUCCESS,
        triggerContext: { source: 'manual' },
        executedByUserId: 9,
      }),
    );
    expect(ruleRepository.increment).toHaveBeenCalledWith(
      { id: 66 },
      'executionCount',
      1,
    );
    expect(ruleRepository.update).toHaveBeenCalledWith(
      { id: 66 },
      expect.objectContaining({ lastExecutedAt: expect.any(Date) }),
    );
  });

  it('logs failures and rethrows when requested', async () => {
    const rule = buildRule({
      id: 77,
      actions: [buildAction({ id: 9, actionType: ActionType.WEBHOOK })],
    });
    evaluatorService.evaluateConditions.mockRejectedValueOnce(
      new Error('condition boom'),
    );

    await expect(
      service.executeRuleOnEvent(rule, null, 9, null, true),
    ).rejects.toThrow('condition boom');

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleId: 77,
        status: AuditLogStatus.FAILURE,
        errorMessage: 'condition boom',
      }),
    );
    expect(ruleRepository.increment).toHaveBeenCalledWith(
      { id: 77 },
      'executionCount',
      1,
    );
  });

  it('returns not found for missing webhook rules', async () => {
    ruleRepository.findOne.mockImplementation(async () => null);

    await expect(
      service.executeRuleFromWebhook(
        'token-1',
        { foo: 'bar' },
        { rawBody: '{}', headers: {}, sourceIp: '1.2.3.4' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects disabled webhook rules', async () => {
    const disabledRule = buildRule();
    disabledRule.id = 88;
    disabledRule.triggerType = TriggerType.WEBHOOK_INCOMING;
    disabledRule.isEnabled = false;
    ruleRepository.findOne.mockImplementation(async () => disabledRule);

    await expect(
      service.executeRuleFromWebhook(
        'token-2',
        { foo: 'bar' },
        { rawBody: '{}', headers: {}, sourceIp: '1.2.3.4' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects rules that are not webhook triggers', async () => {
    const wrongTriggerRule = buildRule();
    wrongTriggerRule.id = 89;
    wrongTriggerRule.triggerType = TriggerType.EVENT_CREATED;
    wrongTriggerRule.isEnabled = true;
    ruleRepository.findOne.mockImplementation(async () => wrongTriggerRule);

    await expect(
      service.executeRuleFromWebhook(
        'token-3',
        { foo: 'bar' },
        { rawBody: '{}', headers: {}, sourceIp: '1.2.3.4' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('verifies webhook security and injects webhook metadata before execution', async () => {
    const rule = buildRule();
    rule.id = 90;
    rule.triggerType = TriggerType.WEBHOOK_INCOMING;
    rule.isEnabled = true;
    ruleRepository.findOne.mockImplementation(async () => rule);
    const executeSpy = jest
      .spyOn(service, 'executeRuleOnEvent')
      .mockResolvedValue(undefined);

    const result = await service.executeRuleFromWebhook(
      'token-4',
      { payload: 'value' },
      {
        rawBody: '{"payload":"value"}',
        headers: { 'x-primecal-signature': 'sha256=' + 'a'.repeat(64) },
        sourceIp: '1.2.3.4',
      },
    );

    expect(webhookSecurity.verifyIncomingRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rule,
        token: 'token-4',
        rawBody: '{"payload":"value"}',
        sourceIp: '1.2.3.4',
      }),
    );
    expect(executeSpy).toHaveBeenCalledWith(
      rule,
      null,
      undefined,
      expect.objectContaining({
        payload: 'value',
        __webhook: expect.objectContaining({
          sourceIp: '1.2.3.4',
          verifiedTimestamp: '2025-01-06T00:00:00.000Z',
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      ruleId: 90,
      message: 'errors.auto.backend.ka70f28f9a49a',
    });
  });

  it('approves owned rules and records approval audit metadata', async () => {
    const rule = buildRule();
    rule.id = 91;
    rule.isApprovalRequired = true;
    rule.approvedAt = null;
    ruleRepository.findOne.mockImplementation(async () => rule);

    const approvedAt = await service.approveRule(9, 91, 'checked');

    expect(ruleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedAt,
        approvedByUserId: 9,
      }),
    );
    expect(securityAudit.log).toHaveBeenCalledWith(
      'automation.invocation',
      { userId: 9, ruleId: 91, source: 'approval', note: 'checked' },
    );
  });

  it('rejects approval and webhook secret mutations for non-owners', async () => {
    const nonOwnerRule = buildRule();
    nonOwnerRule.createdById = 22;
    nonOwnerRule.triggerType = TriggerType.WEBHOOK_INCOMING;

    ruleRepository.findOne.mockImplementation(async () => nonOwnerRule);
    await expect(service.approveRule(9, 44)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    ruleRepository.findOne.mockImplementation(async () => nonOwnerRule);
    await expect(service.regenerateWebhookToken(9, 44)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    ruleRepository.findOne.mockImplementation(async () => nonOwnerRule);
    await expect(service.rotateWebhookSecret(9, 44)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('regenerates and rotates webhook secrets for owned webhook rules', async () => {
    const regenerateRule = buildRule();
    regenerateRule.id = 92;
    regenerateRule.createdById = 9;
    regenerateRule.triggerType = TriggerType.WEBHOOK_INCOMING;
    regenerateRule.webhookSecret = 'current-secret';
    regenerateRule.webhookSecretPrevious = 'old-secret';
    regenerateRule.webhookSecretRotatedAt = null;
    regenerateRule.webhookSecretGraceUntil = null;
    const rotateRule = buildRule();
    rotateRule.id = 93;
    rotateRule.createdById = 9;
    rotateRule.triggerType = TriggerType.WEBHOOK_INCOMING;
    rotateRule.webhookSecret = 'current-secret';
    rotateRule.webhookSecretPrevious = null;
    rotateRule.webhookSecretRotatedAt = null;
    rotateRule.webhookSecretGraceUntil = null;

    ruleRepository.findOne
      .mockImplementationOnce(async () => regenerateRule)
      .mockImplementationOnce(async () => rotateRule);
    randomBytesMock.mockReturnValue(
      Buffer.from(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'hex',
      ),
    );

    const regenerated = await service.regenerateWebhookToken(9, 92);
    const rotated = await service.rotateWebhookSecret(9, 93);

    expect(regenerated).toBe(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );
    expect(ruleRepository.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        webhookToken:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        webhookSecret: 'secret-1',
        webhookSecretPrevious: null,
        webhookSecretRotatedAt: null,
        webhookSecretGraceUntil: null,
      }),
    );
    expect(rotated).toEqual({
      webhookSecret: 'rotated-secret',
      graceUntil: '2025-01-08T00:00:00.000Z',
    });
    expect(ruleRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        webhookSecret: 'rotated-secret',
        webhookSecretPrevious: 'previous-secret',
        webhookSecretRotatedAt: new Date('2025-01-07T00:00:00Z'),
        webhookSecretGraceUntil: new Date('2025-01-08T00:00:00Z'),
      }),
    );
    expect(securityAudit.log).toHaveBeenCalledWith(
      'automation.invocation',
      { userId: 9, ruleId: 93, source: 'webhook_secret_rotation' },
    );
  });
});
