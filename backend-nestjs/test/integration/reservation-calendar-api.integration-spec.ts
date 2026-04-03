import request from 'supertest';
import {
  Calendar,
  CalendarVisibility,
} from '../../src/entities/calendar.entity';
import { OrganisationAdmin } from '../../src/entities/organisation-admin.entity';
import { Organisation } from '../../src/entities/organisation.entity';
import { ReservationCalendar } from '../../src/entities/reservation-calendar.entity';
import {
  ReservationCalendarRole,
  ReservationCalendarRoleType,
} from '../../src/entities/reservation-calendar-role.entity';
import { UsagePlan } from '../../src/entities/user.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Reservation calendar API integration',
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
        usagePlans: [UsagePlan.USER, UsagePlan.STORE],
      });
    };

    const seedReservationCalendarContext = async (
      ownerId: number,
      reviewerId: number,
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
      const organisationAdminRepository =
        harness.dataSource.getRepository(OrganisationAdmin);
      const calendarRepository = harness.dataSource.getRepository(Calendar);
      const reservationCalendarRepository =
        harness.dataSource.getRepository(ReservationCalendar);
      const reservationCalendarRoleRepository =
        harness.dataSource.getRepository(ReservationCalendarRole);

      const organisation = await organisationRepository.save(
        organisationRepository.create({
          name: `Reservation Org ${suffix}`,
          description: 'Organisation for reservation calendar integration',
        }),
      );

      await organisationAdminRepository.save(
        organisationAdminRepository.create({
          organisationId: organisation.id,
          userId: ownerId,
          assignedById: null,
        }),
      );

      const reviewer = await harness.userRepository.findOne({
        where: { id: reviewerId },
        relations: ['organisations'],
      });
      expect(reviewer).not.toBeNull();
      if (!reviewer) {
        throw new Error('Reviewer user was not found');
      }
      reviewer.organisations = [...(reviewer.organisations ?? []), organisation];
      await harness.userRepository.save(reviewer);

      const calendar = await calendarRepository.save(
        calendarRepository.create({
          name: `Reservation Calendar ${suffix}`,
          description: 'Seeded reservation calendar',
          color: '#2563eb',
          visibility: CalendarVisibility.PRIVATE,
          isReservationCalendar: true,
          organisationId: organisation.id,
          ownerId,
        }),
      );

      const reservationCalendar = await reservationCalendarRepository.save(
        reservationCalendarRepository.create({
          calendarId: calendar.id,
          organisationId: organisation.id,
          createdById: ownerId,
          calendar,
          organisation,
        }),
      );

      await reservationCalendarRoleRepository.save(
        reservationCalendarRoleRepository.create({
          reservationCalendarId: reservationCalendar.id,
          userId: ownerId,
          role: ReservationCalendarRoleType.EDITOR,
          assignedById: ownerId,
          isOrganisationAdmin: true,
        }),
      );

      await reservationCalendarRoleRepository.save(
        reservationCalendarRoleRepository.create({
          reservationCalendarId: reservationCalendar.id,
          userId: reviewerId,
          role: ReservationCalendarRoleType.REVIEWER,
          assignedById: ownerId,
          isOrganisationAdmin: false,
        }),
      );

      return {
        organisationId: organisation.id,
        reservationCalendarId: reservationCalendar.id,
      };
    };

    it('covers reservation-calendar role lifecycle, restrictions, and role-gated endpoints', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const owner = await createSession('reservation-calendar-owner');
      const reviewer = await createSession('reservation-calendar-reviewer');

      await grantReservationAccess(owner.userId);
      await grantReservationAccess(reviewer.userId);

      const seededContext = await seedReservationCalendarContext(
        owner.userId,
        reviewer.userId,
        'reservation-calendar-org',
      );

      const reservationCalendarId = seededContext.reservationCalendarId;
      expect(reservationCalendarId).toEqual(expect.any(Number));

      await request(server)
        .get(`/organisations/${seededContext.organisationId}/reservation-calendars`)
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const calendars = response.body.data as Array<{ id: number }>;
          expect(calendars.map((calendar) => calendar.id)).toContain(
            reservationCalendarId,
          );
        });

      await request(server)
        .get(`/reservation-calendars/${reservationCalendarId}/roles`)
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const roles = response.body.data as Array<{
            userId: number;
            role: ReservationCalendarRoleType;
          }>;
          expect(roles).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                userId: owner.userId,
                role: ReservationCalendarRoleType.EDITOR,
              }),
              expect.objectContaining({
                userId: reviewer.userId,
                role: ReservationCalendarRoleType.REVIEWER,
              }),
            ]),
          );
        });

      await request(server)
        .get('/users/reservation-calendars')
        .set(reviewer.authHeaders)
        .expect(200)
        .expect((response) => {
          const calendars = response.body.data as Array<{ id: number }>;
          expect(calendars.map((calendar) => calendar.id)).toContain(
            reservationCalendarId,
          );
        });

      await request(server)
        .get(`/reservation-calendars/${reservationCalendarId}/my-role`)
        .set(reviewer.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.data.userId).toBe(reviewer.userId);
          expect(response.body.data.role).toBe(
            ReservationCalendarRoleType.REVIEWER,
          );
        });

      await request(server)
        .get(
          `/reservation-calendars/${reservationCalendarId}/has-role/${ReservationCalendarRoleType.REVIEWER}`,
        )
        .set(reviewer.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.data.hasRole).toBe(true);
        });

      await request(server)
        .post(`/reservation-calendars/${reservationCalendarId}/reservations`)
        .set(reviewer.authHeaders)
        .expect(403);

      await request(server)
        .get(`/reservation-calendars/${reservationCalendarId}/reservations`)
        .set(reviewer.authHeaders)
        .expect(200);

      await request(server)
        .post(`/reservation-calendars/${reservationCalendarId}/roles`)
        .set(owner.authHeaders)
        .send({
          userId: reviewer.userId,
          role: ReservationCalendarRoleType.EDITOR,
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .post(`/reservation-calendars/${reservationCalendarId}/reservations`)
        .set(reviewer.authHeaders)
        .expect(201)
        .expect((response) => {
          expect(response.body.data.reservationCalendarId).toBe(
            reservationCalendarId,
          );
          expect(response.body.data.userId).toBe(reviewer.userId);
        });

      await request(server)
        .delete(`/reservation-calendars/${reservationCalendarId}/roles/${owner.userId}`)
        .set(owner.authHeaders)
        .expect(400);

      await request(server)
        .delete(
          `/reservation-calendars/${reservationCalendarId}/roles/${reviewer.userId}`,
        )
        .set(owner.authHeaders)
        .expect(200);

      await request(server)
        .post(`/reservation-calendars/${reservationCalendarId}/reservations`)
        .set(reviewer.authHeaders)
        .expect(403);
    });
  },
);
