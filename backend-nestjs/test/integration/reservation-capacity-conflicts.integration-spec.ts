import request from 'supertest';
import { Organisation } from '../../src/entities/organisation.entity';
import { Resource } from '../../src/entities/resource.entity';
import { ResourceType } from '../../src/entities/resource-type.entity';
import { ReservationStatus } from '../../src/entities/reservation.entity';
import { UsagePlan, User } from '../../src/entities/user.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Reservation capacity and conflict integration',
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
      capacity = 2,
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
          name: `Reservation Org ${suffix}`,
          description: 'Integration reservation organisation',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Room Type ${suffix}`,
          description: 'Integration reservation resource type',
          organisation,
          organisationId: organisation.id,
          color: '#0ea5e9',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Room ${suffix}`,
          description: 'Reservable integration resource',
          capacity,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser as User,
        }),
      );

      return { organisation, resourceType, resource };
    };

    it('enforces overlap capacity rules and excludes cancelled reservations from active usage', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('reservation-conflicts');
      await grantReservationAccess(session.userId);
      const { resource } = await seedReservableResource(
        session.userId,
        'reservation-conflict-resource',
      );

      const firstReservationResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-02-01T09:00:00.000Z',
          endTime: '2031-02-01T10:00:00.000Z',
          quantity: 2,
          notes: 'Fully uses available capacity',
          customerInfo: {
            name: 'Capacity Owner',
            email: 'capacity-owner@example.com',
          },
        })
        .expect(201);

      const firstReservationId = firstReservationResponse.body.id as number;
      expect(firstReservationId).toEqual(expect.any(Number));

      const overlapConflictResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-02-01T09:15:00.000Z',
          endTime: '2031-02-01T09:45:00.000Z',
          quantity: 1,
          notes: 'Should exceed active capacity',
          customerInfo: {
            name: 'Overlap User',
            email: 'overlap@example.com',
          },
        })
        .expect(400);

      expect(String(overlapConflictResponse.body.message)).toMatch(
        /available|capacity/i,
      );

      await request(server)
        .patch(`/reservations/${firstReservationId}`)
        .set(session.authHeaders)
        .send({
          status: ReservationStatus.CANCELLED,
          notes: 'Cancelled to release capacity',
        })
        .expect(200);

      await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-02-01T09:15:00.000Z',
          endTime: '2031-02-01T09:45:00.000Z',
          quantity: 2,
          notes: 'Should be allowed after cancellation',
          customerInfo: {
            name: 'Reused Capacity',
            email: 'reused-capacity@example.com',
          },
        })
        .expect(201);
    });

    it('rejects invalid ranges, over-capacity quantities, and conflicting updates', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('reservation-validation');
      await grantReservationAccess(session.userId);
      const { resource } = await seedReservableResource(
        session.userId,
        'reservation-validation-resource',
      );

      const invalidRangeResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-03-01T10:00:00.000Z',
          endTime: '2031-03-01T09:00:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Invalid Range',
            email: 'invalid-range@example.com',
          },
        })
        .expect(400);

      expect(invalidRangeResponse.body.message).toBeTruthy();

      const overCapacityResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-03-01T11:00:00.000Z',
          endTime: '2031-03-01T12:00:00.000Z',
          quantity: 3,
          customerInfo: {
            name: 'Over Capacity',
            email: 'over-capacity@example.com',
          },
        })
        .expect(400);

      expect(String(overCapacityResponse.body.message)).toMatch(/capacity/i);

      const baseReservationResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-03-01T13:00:00.000Z',
          endTime: '2031-03-01T14:00:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Base Reservation',
            email: 'base@example.com',
          },
        })
        .expect(201);

      const overlappingReservationResponse = await request(server)
        .post('/reservations')
        .set(session.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-03-01T13:30:00.000Z',
          endTime: '2031-03-01T14:30:00.000Z',
          quantity: 1,
          customerInfo: {
            name: 'Overlapping Reservation',
            email: 'overlap-2@example.com',
          },
        })
        .expect(201);

      const baseReservationId = baseReservationResponse.body.id as number;
      const conflictingUpdateResponse = await request(server)
        .patch(`/reservations/${baseReservationId}`)
        .set(session.authHeaders)
        .send({
          quantity: 2,
          status: ReservationStatus.CONFIRMED,
        })
        .expect(400);

      expect(conflictingUpdateResponse.body.message).toBeTruthy();

      const overlappingReservationId =
        overlappingReservationResponse.body.id as number;

      await request(server)
        .delete(`/reservations/${overlappingReservationId}`)
        .set(session.authHeaders)
        .expect(200);

      await request(server)
        .patch(`/reservations/${baseReservationId}`)
        .set(session.authHeaders)
        .send({
          quantity: 2,
          status: ReservationStatus.CONFIRMED,
        })
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(baseReservationId);
          expect(response.body.quantity).toBe(2);
          expect(response.body.status).toBe(ReservationStatus.CONFIRMED);
        });
    });
  },
);
