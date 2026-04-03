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
  'Booking timezone and access integration',
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
          name: `Booking Org ${suffix}`,
          description: 'Integration booking organisation',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Booking Room Type ${suffix}`,
          description: 'Integration booking resource type',
          organisation,
          organisationId: organisation.id,
          color: '#f97316',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Booking Room ${suffix}`,
          description: 'Reservable integration resource',
          capacity: 1,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser as User,
        }),
      );

      return { resource };
    };

    it('handles offset-based timestamps consistently and enforces reservation feature access', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const managerSession = await createSession('booking-manager');
      const requesterSession = await createSession('booking-requester');
      const restrictedSession = await createSession('booking-restricted');

      await grantReservationAccess(managerSession.userId);
      await grantReservationAccess(requesterSession.userId);

      const { resource } = await seedReservableResource(
        managerSession.userId,
        'booking-resource',
      );

      const createWithOffsetResponse = await request(server)
        .post('/reservations')
        .set(requesterSession.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-01-15T09:00:00+02:00',
          endTime: '2031-01-15T10:00:00+02:00',
          quantity: 1,
          notes: 'Timezone-aware reservation',
          customerInfo: {
            name: 'Timezone Requester',
            email: 'timezone-requester@example.com',
          },
        })
        .expect(201);

      const reservationId = createWithOffsetResponse.body.id as number;
      expect(reservationId).toEqual(expect.any(Number));
      expect(createWithOffsetResponse.body.startTime).toBe(
        '2031-01-15T07:00:00.000Z',
      );
      expect(createWithOffsetResponse.body.endTime).toBe(
        '2031-01-15T08:00:00.000Z',
      );

      await request(server)
        .post('/reservations')
        .set(managerSession.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2031-01-15T07:30:00.000Z',
          endTime: '2031-01-15T08:30:00.000Z',
          quantity: 1,
          notes: 'Should conflict after timezone normalization',
          customerInfo: {
            name: 'Conflicting User',
            email: 'conflict@example.com',
          },
        })
        .expect(400)
        .expect((response) => {
          expect(String(response.body.message)).toMatch(/capacity|available/i);
        });

      await request(server)
        .patch(`/reservations/${reservationId}`)
        .set(requesterSession.authHeaders)
        .send({
          startTime: '2031-01-15T10:00:00+02:00',
          endTime: '2031-01-15T11:00:00+02:00',
        })
        .expect(200)
        .expect((response) => {
          expect(response.body.startTime).toBe('2031-01-15T08:00:00.000Z');
          expect(response.body.endTime).toBe('2031-01-15T09:00:00.000Z');
        });

      await request(server)
        .get('/reservations')
        .set(restrictedSession.authHeaders)
        .expect(403);
    });
  },
);
