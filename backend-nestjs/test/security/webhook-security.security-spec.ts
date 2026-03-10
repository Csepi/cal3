import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { SecurityStoreService } from '../../src/api-security/services/security-store.service';
import { ActionType } from '../../src/entities/automation-action.entity';
import {
  AutomationRule,
  TriggerType,
} from '../../src/entities/automation-rule.entity';
import { WebhookSecurityService } from '../../src/automation/security/webhook-security.service';

describe('Webhook security integration', () => {
  const store = new SecurityStoreService();
  const service = new WebhookSecurityService(store);

  const buildRule = (): AutomationRule =>
    ({
      id: 101,
      name: 'Webhook Rule',
      description: '',
      triggerType: TriggerType.WEBHOOK_INCOMING,
      triggerConfig: {},
      isEnabled: true,
      conditionLogic: 'AND',
      lastExecutedAt: null,
      executionCount: 0,
      webhookToken: 'token-int',
      webhookSecret: 'integration-secret',
      webhookSecretPrevious: null,
      webhookSecretRotatedAt: null,
      webhookSecretGraceUntil: null,
      isApprovalRequired: false,
      approvedAt: null,
      approvedBy: null,
      approvedByUserId: null,
      createdBy: null,
      createdById: 11,
      conditions: [],
      actions: [{ id: 1, actionType: ActionType.WEBHOOK }],
      auditLogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as unknown as AutomationRule;

  const createHeaders = (body: string, timestampSeconds: number) => {
    const signature = createHmac('sha256', 'integration-secret')
      .update(`${timestampSeconds}.${body}`)
      .digest('hex');
    return {
      'x-primecal-signature': `sha256=${signature}`,
      'x-primecal-timestamp': String(timestampSeconds),
    };
  };

  afterAll(async () => {
    await store.onModuleDestroy();
  });

  it('rejects malformed signature header', async () => {
    const now = Math.floor(Date.now() / 1000);
    await expect(
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-int',
        rawBody: '{"ok":true}',
        headers: {
          'x-primecal-signature': 'sha256=nothex',
          'x-primecal-timestamp': String(now),
        },
        sourceIp: '8.8.8.8',
      }),
    ).rejects.toBeTruthy();
  });

  it('prevents replay across concurrent requests', async () => {
    const body = JSON.stringify({ id: 'abc' });
    const now = Math.floor(Date.now() / 1000);
    const headers = createHeaders(body, now);

    const [first, second] = await Promise.allSettled([
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-int',
        rawBody: body,
        headers,
        sourceIp: '8.8.8.8',
      }),
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-int',
        rawBody: body,
        headers,
        sourceIp: '8.8.8.8',
      }),
    ]);

    const fulfilledCount = [first, second].filter(
      (item) => item.status === 'fulfilled',
    ).length;
    const rejectedCount = [first, second].filter(
      (item) => item.status === 'rejected',
    ).length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);
  });

  it('rejects stale webhook timestamps', async () => {
    const body = JSON.stringify({ stale: true });
    const oldTimestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000);
    const headers = createHeaders(body, oldTimestamp);

    await expect(
      service.verifyIncomingRequest({
        rule: buildRule(),
        token: 'token-int',
        rawBody: body,
        headers,
        sourceIp: '8.8.8.8',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
