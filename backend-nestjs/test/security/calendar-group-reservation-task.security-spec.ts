import request from 'supertest';
import { CalendarVisibility } from '../../src/entities/calendar.entity';
import { Organisation } from '../../src/entities/organisation.entity';
import { Resource } from '../../src/entities/resource.entity';
import { ResourceType } from '../../src/entities/resource-type.entity';
import { UsagePlan } from '../../src/entities/user.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

jest.setTimeout(180000);

describeDockerBacked(
  'Calendar, group, reservation, and task security',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let sequence = 0;

    const nextSuffix = (prefix: string) => {
      sequence += 1;
      return `${prefix}-${String(sequence).padStart(2, '0')}`;
    };

    const getServer = () => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }
      return harness.app.getHttpServer() as Parameters<typeof request>[0];
    };

    const createSession = async (
      prefix: string,
    ): Promise<OnboardedUserSession> => {
      const server = getServer();
      const suffix = nextSuffix(prefix);

      return registerAndCompleteOnboarding(server, {
        username: `${prefix}-register-${suffix}`,
        email: `${prefix}-${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `${prefix}-user-${suffix}`,
        fingerprint: `${prefix}-fingerprint-${suffix}`,
      });
    };

    const grantReservationAccess = async (userId: number) => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }

      await harness.userRepository.update(userId, {
        usagePlans: [UsagePlan.USER, UsagePlan.ENTERPRISE],
      });
    };

    const seedReservableResource = async (
      managingUserId: number,
      prefix: string,
    ) => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }

      const suffix = nextSuffix(prefix);
      const organisationRepository =
        harness.dataSource.getRepository(Organisation);
      const resourceTypeRepository =
        harness.dataSource.getRepository(ResourceType);
      const resourceRepository = harness.dataSource.getRepository(Resource);
      const managingUser = await harness.userRepository.findOneByOrFail({
        id: managingUserId,
      });

      const organisation = await organisationRepository.save(
        organisationRepository.create({
          name: `Security Org ${suffix}`,
          description: 'Organisation for security suite',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Security Room Type ${suffix}`,
          description: 'Resource type for security suite',
          organisation,
          organisationId: organisation.id,
          color: '#f97316',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Security Room ${suffix}`,
          description: 'Reservable resource for security suite',
          capacity: 2,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser,
        }),
      );

      return { organisation, resourceType, resource };
    };

    const expectSafeError = (body: unknown) => {
      const text = JSON.stringify(body);
      expect(text).not.toMatch(
        /stack|query|typeorm|sql|password|secret|constraint|trace/i,
      );
    };

    it('accepts borderline group payloads and rejects malformed calendar, task, and reservation payloads without leaking internals', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const owner = await createSession('security-owner');

      const groupResponse = await request(server)
        .post('/calendar-groups')
        .set(owner.authHeaders)
        .send({
          name: 'S',
          isVisible: 'yes',
        })
        .expect(201);
      expectSafeError(groupResponse.body);

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: 'Security Calendar',
          visibility: 'publicly-visible',
          color: '#2563eb',
        })
        .expect((response) => {
          expect([201, 400]).toContain(response.status);
        });
      expectSafeError(calendarResponse.body);

      const taskResponse = await request(server)
        .post('/tasks')
        .set(owner.authHeaders)
        .send({
          title: 42,
          status: 'later',
          priority: 'urgent',
          labelIds: ['bad'],
        })
        .expect(400);
      expectSafeError(taskResponse.body);

      const reservationResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: 1,
          startTime: '2030-06-01T10:00:00.000Z',
          endTime: '2030-06-01T09:00:00.000Z',
          quantity: 0,
        })
        .expect(400);
      expectSafeError(reservationResponse.body);
    });

    it('blocks non-owner mutations across the grouped calendar, task, and reservation resources', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const owner = await createSession('security-boundary-owner');
      const intruder = await createSession('security-boundary-intruder');
      await grantReservationAccess(owner.userId);
      const { resource } = await seedReservableResource(
        owner.userId,
        'security-boundary-resource',
      );

      const groupResponse = await request(server)
        .post('/calendar-groups')
        .set(owner.authHeaders)
        .send({
          name: 'Security Group',
          isVisible: true,
        })
        .expect(201);
      const groupId = groupResponse.body.id as number;

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: 'Security Calendar',
          visibility: CalendarVisibility.PRIVATE,
          groupId,
        })
        .expect(201);
      const calendarId = calendarResponse.body.id as number;

      const labelResponse = await request(server)
        .post('/task-labels')
        .set(owner.authHeaders)
        .send({
          name: 'Security',
          color: '#ef4444',
        })
        .expect(201);
      const labelId = labelResponse.body.id as number;

      const taskResponse = await request(server)
        .post('/tasks')
        .set(owner.authHeaders)
        .send({
          title: 'Security Task',
          status: 'todo',
          priority: 'medium',
          labelIds: [labelId],
        })
        .expect(201);
      const taskId = taskResponse.body.id as number;

      const reservationResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-06-02T10:00:00.000Z',
          endTime: '2030-06-02T11:00:00.000Z',
          quantity: 1,
        })
        .expect(201);
      const reservationId = reservationResponse.body.id as number;

      await request(server)
        .patch(`/calendar-groups/${groupId}`)
        .set(intruder.authHeaders)
        .send({ name: 'Hijacked Group' })
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
          expectSafeError(response.body);
        });

      await request(server)
        .patch(`/calendars/${calendarId}`)
        .set(intruder.authHeaders)
        .send({ name: 'Hijacked Calendar' })
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
          expectSafeError(response.body);
        });

      await request(server)
        .patch(`/tasks/${taskId}`)
        .set(intruder.authHeaders)
        .send({ status: 'done' })
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
          expectSafeError(response.body);
        });

      await request(server)
        .patch(`/reservations/${reservationId}`)
        .set(intruder.authHeaders)
        .send({ status: 'confirmed' })
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
          expectSafeError(response.body);
        });
    });
  },
);
