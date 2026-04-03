import request from 'supertest';
import { Organisation } from '../../src/entities/organisation.entity';
import { Resource } from '../../src/entities/resource.entity';
import { ResourceType } from '../../src/entities/resource-type.entity';
import { UsagePlan, User } from '../../src/entities/user.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Notifications API integration',
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
          name: `Notifications Org ${suffix}`,
          description: 'Integration notification organisation',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Notifications Room Type ${suffix}`,
          description: 'Integration notification resource type',
          organisation,
          organisationId: organisation.id,
          color: '#0ea5e9',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Notifications Room ${suffix}`,
          description: 'Reservable integration resource',
          capacity: 3,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser as User,
        }),
      );

      return { resource };
    };

    it('covers device lifecycle, reservation-triggered inbox flows, filters, and scope mutes', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const managerSession = await createSession('notif-manager');
      const requesterSession = await createSession('notif-requester');

      await grantReservationAccess(managerSession.userId);
      await grantReservationAccess(requesterSession.userId);

      const firstDeviceResponse = await request(server)
        .post('/notifications/devices')
        .set(managerSession.authHeaders)
        .send({
          platform: 'web',
          token: 'shared-notification-token',
          userAgent: 'integration-test',
        })
        .expect(201);

      const firstDeviceId = firstDeviceResponse.body.id as number;
      expect(firstDeviceId).toEqual(expect.any(Number));

      const reassignedDeviceResponse = await request(server)
        .post('/notifications/devices')
        .set(requesterSession.authHeaders)
        .send({
          platform: 'web',
          token: 'shared-notification-token',
          userAgent: 'integration-test-reassigned',
        })
        .expect(201);

      const reassignedDeviceId = reassignedDeviceResponse.body.id as number;
      expect(reassignedDeviceId).toEqual(expect.any(Number));

      await request(server)
        .delete(`/notifications/devices/${firstDeviceId}`)
        .set(managerSession.authHeaders)
        .expect(403);

      await request(server)
        .delete(`/notifications/devices/${reassignedDeviceId}`)
        .set(requesterSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .post('/notifications/filters')
        .set(managerSession.authHeaders)
        .send({
          name: 'Mark reservation updates as read',
          scopeType: 'global',
          isEnabled: true,
          conditions: [
            {
              field: 'eventType',
              operator: 'contains',
              value: 'reservation.',
            },
          ],
          actions: [{ type: 'mark_read' }],
          continueProcessing: true,
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.id).toEqual(expect.any(Number));
        });

      const filtersResponse = await request(server)
        .get('/notifications/filters')
        .set(managerSession.authHeaders)
        .expect(200);

      const ruleId = (filtersResponse.body[0]?.id as number) ?? 0;
      expect(ruleId).toBeGreaterThan(0);

      await request(server)
        .patch('/notifications/rules')
        .set(managerSession.authHeaders)
        .send({
          rules: filtersResponse.body.map(
            (entry: { id: number; order?: number }) => ({
              ...entry,
              order: (entry.order ?? 0) + 1,
            }),
          ),
        })
        .expect(200);

      await request(server)
        .delete(`/notifications/rules/${ruleId}`)
        .set(managerSession.authHeaders)
        .expect(200);

      await request(server)
        .post('/notifications/mutes')
        .set(managerSession.authHeaders)
        .send({
          scopeType: 'calendar',
          scopeId: ' ',
          isMuted: true,
        })
        .expect(404);

      await request(server)
        .post('/notifications/mutes')
        .set(managerSession.authHeaders)
        .send({
          scopeType: 'calendar',
          scopeId: '99',
          isMuted: true,
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.mute.scopeType).toBe('calendar');
          expect(response.body.mute.scopeId).toBe('99');
          expect(response.body.mute.isMuted).toBe(true);
        });

      await request(server)
        .get('/notifications/mutes')
        .set(managerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                scopeType: 'calendar',
                scopeId: '99',
                isMuted: true,
              }),
            ]),
          );
        });

      await request(server)
        .delete('/notifications/mutes/calendar/99')
        .set(managerSession.authHeaders)
        .expect(200);

      await request(server)
        .get('/notifications/scopes')
        .set(managerSession.authHeaders)
        .query({ type: 'calendar,reservation' })
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveProperty('calendar');
          expect(response.body).toHaveProperty('reservation');
        });

      const { resource } = await seedReservableResource(
        managerSession.userId,
        'notif-reservation-resource',
      );

      await request(server)
        .post('/reservations')
        .set(requesterSession.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2032-05-01T09:00:00.000Z',
          endTime: '2032-05-01T10:00:00.000Z',
          quantity: 1,
          notes: 'Notification-triggering reservation',
          customerInfo: {
            name: 'Notification Requester',
            email: 'notify-requester@example.com',
          },
        })
        .expect(201);

      const inboxResponse = await request(server)
        .get('/notifications')
        .set(managerSession.authHeaders)
        .expect(200);

      expect(Array.isArray(inboxResponse.body)).toBe(true);
      expect(inboxResponse.body.length).toBeGreaterThan(0);
      expect(inboxResponse.body[0].eventType).toBe('reservation.created');

      const messageId = inboxResponse.body[0].id as number;
      const threadId = inboxResponse.body[0].threadId as number | null;
      expect(messageId).toEqual(expect.any(Number));

      await request(server)
        .patch(`/notifications/${messageId}/read`)
        .set(managerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .patch(`/notifications/${messageId}/unread`)
        .set(managerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .post('/notifications/read-all')
        .set(managerSession.authHeaders)
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .patch(`/notifications/${messageId}/read`)
        .set(requesterSession.authHeaders)
        .expect(404);

      if (threadId && Number.isInteger(threadId)) {
        await request(server)
          .patch(`/notifications/threads/${threadId}/mute`)
          .set(managerSession.authHeaders)
          .expect(200);
        await request(server)
          .patch(`/notifications/threads/${threadId}/unmute`)
          .set(managerSession.authHeaders)
          .expect(200);
        await request(server)
          .patch(`/notifications/threads/${threadId}/archive`)
          .set(managerSession.authHeaders)
          .expect(200);
        await request(server)
          .patch(`/notifications/threads/${threadId}/unarchive`)
          .set(managerSession.authHeaders)
          .expect(200);
      }

      await request(server)
        .get('/notifications/threads')
        .set(managerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  },
);
