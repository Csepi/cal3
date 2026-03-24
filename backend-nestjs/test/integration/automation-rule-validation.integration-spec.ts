import request from 'supertest';
import { Repository } from 'typeorm';
import {
  describeDockerBacked,
  loginNative,
  seedUser,
} from '../support/postgres-nest.harness';
import { DEVICE_FINGERPRINT_HEADER } from '../../src/auth/services/token-fingerprint.service';
import { User, UserRole } from '../../src/entities/user.entity';
import { AutomationRule, TriggerType } from '../../src/entities/automation-rule.entity';
import { AutomationAction, ActionType } from '../../src/entities/automation-action.entity';
import { AutomationCondition } from '../../src/entities/automation-condition.entity';
import { AutomationAuditLog } from '../../src/entities/automation-audit-log.entity';
import { ERROR_CODES } from '../../src/common/responses/error.catalog';

describeDockerBacked(
  'Automation rule relative trigger validation integration (postgres testcontainer)',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let userRepository: Repository<User>;
    let ruleRepository: Repository<AutomationRule>;
    let conditionRepository: Repository<AutomationCondition>;
    let actionRepository: Repository<AutomationAction>;
    let auditLogRepository: Repository<AutomationAuditLog>;

    const uniqueSuffix = () =>
      `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    beforeEach(async () => {
      if (isUnavailable()) {
        return;
      }

      const harness = getHarness();
      if (!harness) {
        return;
      }

      userRepository = harness.userRepository;
      ruleRepository = harness.dataSource.getRepository(AutomationRule);
      conditionRepository = harness.dataSource.getRepository(AutomationCondition);
      actionRepository = harness.dataSource.getRepository(AutomationAction);
      auditLogRepository = harness.dataSource.getRepository(AutomationAuditLog);

      await auditLogRepository.createQueryBuilder().delete().execute();
      await actionRepository.createQueryBuilder().delete().execute();
      await conditionRepository.createQueryBuilder().delete().execute();
      await ruleRepository.createQueryBuilder().delete().execute();
      await userRepository.createQueryBuilder().delete().execute();
    });

    const bootstrapAuthenticatedContext = async (): Promise<{
      server: Parameters<typeof request>[0];
      accessToken: string;
      fingerprint: string;
    }> => {
      const harness = getHarness();
      if (!harness) {
        throw new Error('Harness unavailable');
      }

      const suffix = uniqueSuffix();
      const fingerprint = `automation-validation-${suffix}`;
      const user = await seedUser(userRepository, {
        username: `automation_validation_${suffix}`,
        email: `automation_validation_${suffix}@example.com`,
        password: 'ValidPass#123',
        role: UserRole.USER,
      });

      user.onboardingCompleted = true;
      user.onboardingCompletedAt = new Date();
      user.privacyPolicyAcceptedAt = new Date();
      user.privacyPolicyVersion = 'integration-test';
      await userRepository.save(user);

      const loginResponse = await loginNative(
        harness.app,
        user.username,
        'ValidPass#123',
        fingerprint,
      );
      expect([200, 201]).toContain(loginResponse.status);

      return {
        server: harness.app.getHttpServer() as Parameters<typeof request>[0],
        accessToken: loginResponse.body.access_token as string,
        fingerprint,
      };
    };

    it('rejects invalid nested relative trigger config with field-level errors before persistence', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const { server, accessToken, fingerprint } =
        await bootstrapAuthenticatedContext();
      const ruleName = `Relative invalid nested ${uniqueSuffix()}`;

      const response = await request(server)
        .post('/automation/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send({
          name: ruleName,
          triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
          triggerConfig: {
            referenceTime: { base: 'start' },
            offset: { direction: 'sideways', value: -5, unit: 'minutes' },
          },
          actions: [
            {
              actionType: ActionType.UPDATE_EVENT_TITLE,
              actionConfig: { newTitle: 'Auto title' },
            },
          ],
        })
        .expect(400);

      expect(response.body?.error?.code).toBe(ERROR_CODES.VALIDATION_FAILED);

      const fields = response.body?.error?.details?.fields as
        | Array<{ field?: string }>
        | undefined;
      const fieldNames = (fields ?? [])
        .map((entry) => entry.field)
        .filter((field): field is string => Boolean(field));

      expect(fieldNames).toContain('triggerConfig.offset.direction');
      expect(fieldNames).toContain('triggerConfig.offset.value');

      const persistedCount = await ruleRepository.count({
        where: { name: ruleName },
      });
      expect(persistedCount).toBe(0);
    });

    it('rejects unknown nested properties with field-level path', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const { server, accessToken, fingerprint } =
        await bootstrapAuthenticatedContext();
      const ruleName = `Relative unknown nested ${uniqueSuffix()}`;

      const response = await request(server)
        .post('/automation/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send({
          name: ruleName,
          triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
          triggerConfig: {
            offset: {
              direction: 'before',
              value: 10,
              unit: 'minutes',
              unsupported: true,
            },
          },
          actions: [
            {
              actionType: ActionType.UPDATE_EVENT_TITLE,
              actionConfig: { newTitle: 'Auto title' },
            },
          ],
        })
        .expect(400);

      expect(response.body?.error?.code).toBe(ERROR_CODES.VALIDATION_FAILED);

      const fields = response.body?.error?.details?.fields as
        | Array<{ field?: string }>
        | undefined;
      const fieldNames = (fields ?? [])
        .map((entry) => entry.field)
        .filter((field): field is string => Boolean(field));

      expect(fieldNames).toContain('triggerConfig.offset.unsupported');

      const persistedCount = await ruleRepository.count({
        where: { name: ruleName },
      });
      expect(persistedCount).toBe(0);
    });
  },
);
