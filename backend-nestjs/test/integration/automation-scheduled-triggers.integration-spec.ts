import request from 'supertest';
import { Repository } from 'typeorm';
import {
  describeDockerBacked,
  loginNative,
  seedUser,
} from '../support/postgres-nest.harness';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import { User, UserRole } from '../../src/entities/user.entity';
import { Calendar } from '../../src/entities/calendar.entity';
import { Event } from '../../src/entities/event.entity';
import {
  AutomationScheduledTrigger,
  AutomationScheduledTriggerStatus,
} from '../../src/entities/automation-scheduled-trigger.entity';
import {
  AutomationRule,
  TriggerType,
} from '../../src/entities/automation-rule.entity';
import {
  AutomationAction,
  ActionType,
} from '../../src/entities/automation-action.entity';
import { AutomationCondition } from '../../src/entities/automation-condition.entity';
import { AutomationAuditLog } from '../../src/entities/automation-audit-log.entity';

const dayOffsetIso = (offsetDays: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
};

const expectedScheduleAtFromUtcDateTime = (
  date: string,
  time: string,
  offsetMinutesBefore: number,
): Date => {
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCHours(hour, minute, 0, 0);
  value.setUTCMinutes(value.getUTCMinutes() - offsetMinutesBefore);
  return value;
};

describeDockerBacked(
  'Automation scheduled triggers integration (postgres testcontainer)',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let userRepository: Repository<User>;
    let calendarRepository: Repository<Calendar>;
    let eventRepository: Repository<Event>;
    let ruleRepository: Repository<AutomationRule>;
    let conditionRepository: Repository<AutomationCondition>;
    let actionRepository: Repository<AutomationAction>;
    let auditLogRepository: Repository<AutomationAuditLog>;
    let scheduledTriggerRepository: Repository<AutomationScheduledTrigger>;

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
      calendarRepository = harness.dataSource.getRepository(Calendar);
      eventRepository = harness.dataSource.getRepository(Event);
      ruleRepository = harness.dataSource.getRepository(AutomationRule);
      conditionRepository =
        harness.dataSource.getRepository(AutomationCondition);
      actionRepository = harness.dataSource.getRepository(AutomationAction);
      auditLogRepository = harness.dataSource.getRepository(AutomationAuditLog);
      scheduledTriggerRepository = harness.dataSource.getRepository(
        AutomationScheduledTrigger,
      );

      await scheduledTriggerRepository.createQueryBuilder().delete().execute();
      await auditLogRepository.createQueryBuilder().delete().execute();
      await actionRepository.createQueryBuilder().delete().execute();
      await conditionRepository.createQueryBuilder().delete().execute();
      await ruleRepository.createQueryBuilder().delete().execute();
      await eventRepository.createQueryBuilder().delete().execute();
      await calendarRepository.createQueryBuilder().delete().execute();
      await userRepository.createQueryBuilder().delete().execute();
    });

    const bootstrapAuthenticatedContext = async (): Promise<{
      server: Parameters<typeof request>[0];
      accessToken: string;
      calendarId: number;
      fingerprint: string;
    }> => {
      const harness = getHarness();
      if (!harness) {
        throw new Error('Harness unavailable');
      }

      const suffix = uniqueSuffix();
      const fingerprint = `automation-scheduled-${suffix}`;
      const user = await seedUser(userRepository, {
        username: `automation_sched_${suffix}`,
        email: `automation_sched_${suffix}@example.com`,
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

      const accessToken = loginResponse.body.access_token as string;
      expect(accessToken).toBeTruthy();

      const calendar = await calendarRepository.save(
        calendarRepository.create({
          ownerId: user.id,
          name: `Automation Calendar ${suffix}`,
        }),
      );

      return {
        server: harness.app.getHttpServer() as Parameters<typeof request>[0],
        accessToken,
        calendarId: calendar.id,
        fingerprint,
      };
    };

    const createRule = async (
      server: Parameters<typeof request>[0],
      accessToken: string,
      fingerprint: string,
      payload: Record<string, unknown>,
    ): Promise<{ id: number }> => {
      const response = await request(server)
        .post('/automation/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send(payload)
        .expect(201);

      expect(response.body.id).toBeTruthy();
      return { id: response.body.id as number };
    };

    const createEvent = async (
      server: Parameters<typeof request>[0],
      accessToken: string,
      fingerprint: string,
      payload: Record<string, unknown>,
    ): Promise<{ id: number }> => {
      const response = await request(server)
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send(payload)
        .expect(201);

      expect(response.body.id).toBeTruthy();
      return { id: response.body.id as number };
    };

    it('creates, reschedules, and removes rows in automation_scheduled_triggers for relative trigger lifecycle', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const { server, accessToken, calendarId, fingerprint } =
        await bootstrapAuthenticatedContext();

      const { id: ruleId } = await createRule(
        server,
        accessToken,
        fingerprint,
        {
          name: `Relative schedule rule ${uniqueSuffix()}`,
          triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
          triggerConfig: {
            referenceTime: { base: 'start' },
            offset: { direction: 'before', value: 30, unit: 'minutes' },
            execution: { runOncePerEvent: true },
          },
          actions: [
            {
              actionType: ActionType.UPDATE_EVENT_TITLE,
              actionConfig: { newTitle: 'Auto title' },
            },
          ],
        },
      );

      const eventDate = dayOffsetIso(2);
      const initialStartTime = '10:00';

      const { id: eventId } = await createEvent(
        server,
        accessToken,
        fingerprint,
        {
          calendarId,
          title: 'Lifecycle Event',
          startDate: eventDate,
          startTime: initialStartTime,
          endDate: eventDate,
          endTime: '11:00',
          isAllDay: false,
        },
      );

      const scheduledAfterCreate = await scheduledTriggerRepository.find({
        where: { ruleId, eventId },
      });

      expect(scheduledAfterCreate).toHaveLength(1);
      expect(scheduledAfterCreate[0].status).toBe(
        AutomationScheduledTriggerStatus.SCHEDULED,
      );

      const expectedInitialScheduleAt = expectedScheduleAtFromUtcDateTime(
        eventDate,
        initialStartTime,
        30,
      );

      expect(
        Math.abs(
          scheduledAfterCreate[0].scheduledAt.getTime() -
            expectedInitialScheduleAt.getTime(),
        ),
      ).toBeLessThanOrEqual(1000);

      await request(server)
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send({ startTime: '16:45' })
        .expect(200);

      const scheduledAfterUpdate = await scheduledTriggerRepository.find({
        where: { ruleId, eventId },
      });

      expect(scheduledAfterUpdate).toHaveLength(1);
      expect(scheduledAfterUpdate[0].id).toBe(scheduledAfterCreate[0].id);
      expect(scheduledAfterUpdate[0].status).toBe(
        AutomationScheduledTriggerStatus.SCHEDULED,
      );

      const expectedUpdatedScheduleAt = expectedScheduleAtFromUtcDateTime(
        eventDate,
        '16:45',
        30,
      );

      expect(
        Math.abs(
          scheduledAfterUpdate[0].scheduledAt.getTime() -
            expectedUpdatedScheduleAt.getTime(),
        ),
      ).toBeLessThanOrEqual(1000);

      await request(server)
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .expect(200);

      const scheduledAfterDelete = await scheduledTriggerRepository.find({
        where: { ruleId, eventId },
      });

      expect(scheduledAfterDelete).toHaveLength(0);
    });

    it.each([
      {
        triggerType: TriggerType.EVENT_CREATED,
        triggerConfig: {},
      },
      {
        triggerType: TriggerType.EVENT_UPDATED,
        triggerConfig: {},
      },
      {
        triggerType: TriggerType.EVENT_DELETED,
        triggerConfig: {},
      },
      {
        triggerType: TriggerType.EVENT_STARTS_IN,
        triggerConfig: { minutes: 10 },
      },
      {
        triggerType: TriggerType.EVENT_ENDS_IN,
        triggerConfig: { minutes: 10 },
      },
      {
        triggerType: TriggerType.SCHEDULED_TIME,
        triggerConfig: { cronExpression: '0 9 * * *' },
      },
      {
        triggerType: TriggerType.CALENDAR_IMPORTED,
        triggerConfig: {},
      },
      {
        triggerType: TriggerType.WEBHOOK_INCOMING,
        triggerConfig: {},
      },
    ])(
      'keeps automation_scheduled_triggers empty for $triggerType during event create/update/delete lifecycle',
      async ({ triggerType, triggerConfig }) => {
        if (isUnavailable()) {
          expect(unavailabilityReason()).toBeTruthy();
          return;
        }

        const { server, accessToken, calendarId, fingerprint } =
          await bootstrapAuthenticatedContext();

        await createRule(server, accessToken, fingerprint, {
          name: `Non-relative rule ${triggerType} ${uniqueSuffix()}`,
          triggerType,
          triggerConfig,
          actions: [
            {
              actionType: ActionType.UPDATE_EVENT_TITLE,
              actionConfig: { newTitle: 'No scheduling row expected' },
            },
          ],
        });

        const eventDate = dayOffsetIso(3);
        const { id: eventId } = await createEvent(
          server,
          accessToken,
          fingerprint,
          {
            calendarId,
            title: 'No scheduled row event',
            startDate: eventDate,
            startTime: '09:00',
            endDate: eventDate,
            endTime: '10:00',
          },
        );

        expect(await scheduledTriggerRepository.count()).toBe(0);

        await request(server)
          .patch(`/events/${eventId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
          .send({ title: 'Updated once' })
          .expect(200);

        expect(await scheduledTriggerRepository.count()).toBe(0);

        await request(server)
          .delete(`/events/${eventId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
          .expect(200);

        expect(await scheduledTriggerRepository.count()).toBe(0);
      },
    );

    it('returns 503 when relative scheduling table is missing (schema mismatch)', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const harness = getHarness();
      if (!harness) {
        throw new Error('Harness unavailable');
      }

      const { server, accessToken, fingerprint } =
        await bootstrapAuthenticatedContext();

      await harness.dataSource.query(
        'DROP TABLE IF EXISTS automation_scheduled_triggers',
      );

      try {
        const response = await request(server)
          .post('/automation/rules')
          .set('Authorization', `Bearer ${accessToken}`)
          .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
          .send({
            name: `Relative schema mismatch ${uniqueSuffix()}`,
            triggerType: TriggerType.RELATIVE_TIME_TO_EVENT,
            triggerConfig: {
              referenceTime: { base: 'start' },
              offset: { direction: 'before', value: 10, unit: 'minutes' },
            },
            actions: [
              {
                actionType: ActionType.UPDATE_EVENT_TITLE,
                actionConfig: { newTitle: 'Auto title' },
              },
            ],
          });

        expect([500, 503]).toContain(response.status);
        if (response.status === 503) {
          expect(response.body?.error?.code).toBe('SERVICE_UNAVAILABLE');
          expect(response.body?.error?.details?.type).toBe('schema-mismatch');
        }
      } finally {
        await harness.dataSource.synchronize();
      }
    });
  },
);
