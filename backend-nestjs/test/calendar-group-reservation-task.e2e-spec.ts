import request from 'supertest';
import { CalendarVisibility } from '../src/entities/calendar.entity';
import { Organisation } from '../src/entities/organisation.entity';
import { Resource } from '../src/entities/resource.entity';
import { ResourceType } from '../src/entities/resource-type.entity';
import { ReservationStatus } from '../src/entities/reservation.entity';
import { UsagePlan } from '../src/entities/user.entity';
import { describeDockerBacked } from './support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from './support/auth-onboarding.flow';

jest.setTimeout(180000);

describeDockerBacked(
  'Calendar, group, reservation, and task e2e journey',
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
          name: `Journey Org ${suffix}`,
          description: 'Organisation for e2e reservation journey',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Journey Room Type ${suffix}`,
          description: 'Resource type for e2e reservation journey',
          organisation,
          organisationId: organisation.id,
          color: '#0ea5e9',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Journey Room ${suffix}`,
          description: 'Reservable resource for e2e journey',
          capacity: 4,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser,
        }),
      );

      return { organisation, resourceType, resource };
    };

    it('covers the owner journey across calendar, group, task, and reservation APIs', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const owner = await createSession('journey-owner');
      await grantReservationAccess(owner.userId);
      const { resource } = await seedReservableResource(
        owner.userId,
        'journey-resource',
      );
      const suffix = nextSuffix('journey');

      const groupResponse = await request(server)
        .post('/calendar-groups')
        .set(owner.authHeaders)
        .send({
          name: `Planning Group ${suffix}`,
          isVisible: true,
        })
        .expect(201);

      const groupId = groupResponse.body.id as number;
      expect(groupId).toEqual(expect.any(Number));
      expect(groupResponse.body).toEqual(
        expect.objectContaining({
          id: groupId,
          name: `Planning Group ${suffix}`,
          ownerId: owner.userId,
        }),
      );

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Planning Calendar ${suffix}`,
          description: 'Calendar grouped for the owner journey',
          visibility: CalendarVisibility.PRIVATE,
          color: '#2563eb',
          groupId,
        })
        .expect(201);

      const calendarId = calendarResponse.body.id as number;
      expect(calendarId).toEqual(expect.any(Number));
      expect(calendarResponse.body.groupId).toBe(groupId);

      await request(server)
        .patch(`/calendar-groups/${groupId}`)
        .set(owner.authHeaders)
        .send({
          name: `Planning Group Updated ${suffix}`,
          isVisible: false,
        })
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: groupId,
              name: `Planning Group Updated ${suffix}`,
              isVisible: false,
            }),
          );
        });

      await request(server)
        .patch(`/calendars/${calendarId}`)
        .set(owner.authHeaders)
        .send({
          name: `Planning Calendar Updated ${suffix}`,
          color: '#0f766e',
        })
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: calendarId,
              name: `Planning Calendar Updated ${suffix}`,
              color: '#0f766e',
            }),
          );
        });

      await request(server)
        .get('/calendar-groups')
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const groups = response.body as Array<{
            id: number;
            calendars?: Array<{ id: number }>;
          }>;
          const group = groups.find((entry) => entry.id === groupId);
          expect(group).toBeDefined();
          expect(group?.calendars).toEqual(
            expect.arrayContaining([expect.objectContaining({ id: calendarId })]),
          );
        });

      const labelResponse = await request(server)
        .post('/task-labels')
        .set(owner.authHeaders)
        .send({
          name: 'Planning',
          color: '#0ea5e9',
        })
        .expect(201);

      const labelId = labelResponse.body.id as number;
      expect(labelId).toEqual(expect.any(Number));

      const taskResponse = await request(server)
        .post('/tasks')
        .set(owner.authHeaders)
        .send({
          title: `Planning Task ${suffix}`,
          body: 'Task created during the e2e journey',
          status: 'todo',
          priority: 'medium',
          labelIds: [labelId],
        })
        .expect(201);

      const taskId = taskResponse.body.id as number;
      expect(taskId).toEqual(expect.any(Number));
      expect(taskResponse.body.labels).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: labelId })]),
      );

      await request(server)
        .patch(`/tasks/${taskId}`)
        .set(owner.authHeaders)
        .send({
          status: 'in_progress',
          priority: 'high',
          labelIds: [labelId],
        })
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: taskId,
              status: 'in_progress',
              priority: 'high',
            }),
          );
        });

      const firstReservationResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-05-01T09:00:00.000Z',
          endTime: '2030-05-01T10:00:00.000Z',
          quantity: 1,
          notes: 'Owner journey reservation',
          customerInfo: {
            name: 'Planning Owner',
            email: 'planning-owner@example.com',
          },
        })
        .expect(201);

      const reservationId = firstReservationResponse.body.id as number;
      expect(reservationId).toEqual(expect.any(Number));
      expect(firstReservationResponse.body.status).toBe(
        ReservationStatus.PENDING,
      );
      expect(firstReservationResponse.body.resource?.id).toBe(resource.id);

      await request(server)
        .patch(`/reservations/${reservationId}`)
        .set(owner.authHeaders)
        .send({
          quantity: 2,
          status: ReservationStatus.CONFIRMED,
          notes: 'Reservation confirmed in the e2e journey',
        })
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: reservationId,
              quantity: 2,
              status: ReservationStatus.CONFIRMED,
            }),
          );
        });

      const overlapResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-05-01T09:30:00.000Z',
          endTime: '2030-05-01T10:30:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Overlap Request',
            email: 'overlap@example.com',
          },
        })
        .expect(400);

      expect(JSON.stringify(overlapResponse.body)).not.toMatch(
        /stack|query|typeorm|sql|password|secret/i,
      );

      await request(server)
        .delete(`/reservations/${reservationId}`)
        .set(owner.authHeaders)
        .expect(200);

      await request(server)
        .delete(`/tasks/${taskId}`)
        .set(owner.authHeaders)
        .expect(200);

      await request(server)
        .delete(`/calendars/${calendarId}`)
        .set(owner.authHeaders)
        .expect(200);

      await request(server)
        .delete(`/calendar-groups/${groupId}`)
        .set(owner.authHeaders)
        .expect(200);
    });

    it('rejects overlapping reservation submissions with a bounded error payload', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const owner = await createSession('reservation-conflict-owner');
      await grantReservationAccess(owner.userId);
      const { resource } = await seedReservableResource(
        owner.userId,
        'reservation-conflict-resource',
      );

      const firstReservationResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-05-02T09:00:00.000Z',
          endTime: '2030-05-02T10:00:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Conflict Owner',
            email: 'conflict-owner@example.com',
          },
        })
        .expect(201);

      const reservationId = firstReservationResponse.body.id as number;
      expect(reservationId).toEqual(expect.any(Number));

      const conflictResponse = await request(server)
        .post('/reservations')
        .set(owner.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-05-02T09:15:00.000Z',
          endTime: '2030-05-02T10:15:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Conflict Request',
            email: 'conflict@example.com',
          },
        })
        .expect(400);

      expect(String(conflictResponse.body.message)).toMatch(/overlap/i);
      expect(JSON.stringify(conflictResponse.body)).not.toMatch(
        /stack|query|typeorm|sql|password|secret/i,
      );

      await request(server)
        .delete(`/reservations/${reservationId}`)
        .set(owner.authHeaders)
        .expect(200);
    });
  },
);
