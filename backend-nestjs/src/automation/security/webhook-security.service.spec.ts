import { UnauthorizedException } from '@nestjs/common';
import { ActionType } from '../../entities/automation-action.entity';
import { AutomationRule, TriggerType } from '../../entities/automation-rule.entity';
import { SecurityStoreService } from '../../api-security/services/security-store.service';
import { WebhookSecurityService } from './webhook-security.service';
import { createHmac } from 'crypto';

describe('WebhookSecurityService', () => {
  const securityStore = {
    setIfAbsent: jest.fn(),
  } as unknown as SecurityStoreService;

  const service = new WebhookSecurityService(securityStore);

  const buildRule = (): AutomationRule =>
    ({
      id: 10,
      name: 'Inbound webhook',
      description: '',
      triggerType: TriggerType.WEBHOOK_INCOMING,
      triggerConfig: {},
      isEnabled: true,
      conditionLogic: 'AND',
      lastExecutedAt: null,
      executionCount: 0,
      webhookToken: 'token-1',
      webhookSecret: 'secret-current',
      webhookSecretPrevious: null,
      webhookSecretRotatedAt: null,
      webhookSecretGraceUntil: null,
      isApprovalRequired: false,
      approvedAt: null,
      approvedBy: null,
      approvedByUserId: null,
      createdBy: null,
      createdById: 1,
      conditions: [],
      actions: [
        {
          id: 1,
          actionType: ActionType.WEBHOOK,
        },
      ],
      auditLogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as unknown as AutomationRule;

  const signatureFor = (
    secret: string,
    timestampSeconds: number,
    body: string,
  ): string =>
    createHmac('sha256', secret)
      .update(`${timestampSeconds}.${body}`)
      .digest('hex');

  beforeEach(() => {
    jest.clearAllMocks();
    securityStore.setIfAbsent = jest.fn().mockResolvedValue(true);
  });

  it('accepts valid signature and stores replay key', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ hello: 'world' });
    const signature = signatureFor('secret-current', nowSeconds, body);

    const result = await service.verifyIncomingRequest({
      rule: buildRule(),
      token: 'token-1',
      headers: {
        'x-primecal-signature': `sha256=${signature}`,
        'x-primecal-timestamp': String(nowSeconds),
      },
      rawBody: body,
      sourceIp: '8.8.8.8',
    });

    expect(result.usedPreviousSecret).toBe(false);
    expect(securityStore.setIfAbsent).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid signatures', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await expect(
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-1',
        headers: {
          'x-primecal-signature': `sha256=${'a'.repeat(64)}`,
          'x-primecal-timestamp': String(nowSeconds),
        },
        rawBody: JSON.stringify({ ok: true }),
        sourceIp: '8.8.8.8',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects replay attempts', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ hello: 'world' });
    const signature = signatureFor('secret-current', nowSeconds, body);
    securityStore.setIfAbsent = jest.fn().mockResolvedValue(false);

    await expect(
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-1',
        headers: {
          'x-primecal-signature': `sha256=${signature}`,
          'x-primecal-timestamp': String(nowSeconds),
        },
        rawBody: body,
        sourceIp: '8.8.8.8',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts previous secret during grace window', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ hello: 'world' });
    const signature = signatureFor('secret-old', nowSeconds, body);
    const rule = buildRule();
    rule.webhookSecretPrevious = 'secret-old';
    rule.webhookSecretGraceUntil = new Date(Date.now() + 60_000);

    const result = await service.verifyIncomingRequest({
      rule,
      token: 'token-1',
      headers: {
        'x-primecal-signature': `sha256=${signature}`,
        'x-primecal-timestamp': String(nowSeconds),
      },
      rawBody: body,
      sourceIp: '8.8.8.8',
    });

    expect(result.usedPreviousSecret).toBe(true);
  });
});
