import request from 'supertest';
import { SharePermission } from '../../src/entities/calendar.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import { registerAndCompleteOnboarding } from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Calendar API integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    const uniqueSuffix = () =>
      `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const expectSuccessStatus = (status: number) => {
      expect([200, 201]).toContain(status);
    };

    const expectForbiddenOrNotFound = (status: number) => {
      expect([403, 404]).toContain(status);
    };

    it('covers calendar and calendars-prefixed group lifecycle for owner flows', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        return;
      }

      const server = harness.app.getHttpServer() as Parameters<
        typeof request
      >[0];
      const suffix = uniqueSuffix();

      const owner = await registerAndCompleteOnboarding(server, {
        username: `calendar_owner_${suffix}`,
        email: `calendar_owner_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `calendar_owner_onboarded_${suffix}`,
        fingerprint: `calendar-owner-${suffix}`,
      });

      const member = await registerAndCompleteOnboarding(server, {
        username: `calendar_member_${suffix}`,
        email: `calendar_member_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `calendar_member_onboarded_${suffix}`,
        fingerprint: `calendar-member-${suffix}`,
      });

      const groupResponse = await request(server)
        .post('/calendars/groups')
        .set(owner.authHeaders)
        .send({
          name: `Shared Group ${suffix}`,
          isVisible: true,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const groupId = groupResponse.body.id as number;
      expect(groupId).toBeTruthy();

      await request(server)
        .get('/calendar-groups')
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const groups = response.body as Array<{ id: number }>;
          expect(groups.map((group) => group.id)).toContain(groupId);
        });

      const createCalendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Owner Calendar ${suffix}`,
          description: 'Calendar owner flow coverage',
          visibility: 'private',
          color: '#3b82f6',
          groupId,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const calendarId = createCalendarResponse.body.id as number;
      expect(calendarId).toBeTruthy();
      expect(createCalendarResponse.body.groupId).toBe(groupId);

      await request(server)
        .get('/calendars')
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const calendars = response.body as Array<{ id: number }>;
          expect(calendars.map((calendar) => calendar.id)).toContain(calendarId);
        });

      await request(server)
        .patch(`/calendars/${calendarId}`)
        .set(owner.authHeaders)
        .send({
          name: `Owner Calendar Updated ${suffix}`,
          color: '#0ea5e9',
        })
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(calendarId);
          expect(response.body.name).toBe(`Owner Calendar Updated ${suffix}`);
          expect(response.body.color).toBe('#0ea5e9');
        });

      await request(server)
        .post(`/calendars/${calendarId}/share`)
        .set(owner.authHeaders)
        .send({
          userIds: [member.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      await request(server)
        .get(`/calendars/${calendarId}/shared-users`)
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const shared = response.body as Array<{ user: { id: number } }>;
          expect(shared.map((entry) => entry.user.id)).toContain(member.userId);
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(calendarId);
          expect(response.body.owner?.id).toBe(owner.userId);
        });

      await request(server)
        .delete(`/calendars/${calendarId}/share`)
        .set(owner.authHeaders)
        .send({ userIds: [member.userId] })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .delete(`/calendars/${calendarId}`)
        .set(owner.authHeaders)
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(owner.authHeaders)
        .expect(404);
    });

    it('blocks non-owners from mutating calendar endpoints', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        return;
      }

      const server = harness.app.getHttpServer() as Parameters<
        typeof request
      >[0];
      const suffix = uniqueSuffix();

      const owner = await registerAndCompleteOnboarding(server, {
        username: `calendar_lock_owner_${suffix}`,
        email: `calendar_lock_owner_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `calendar_lock_owner_onboarded_${suffix}`,
        fingerprint: `calendar-lock-owner-${suffix}`,
      });

      const intruder = await registerAndCompleteOnboarding(server, {
        username: `calendar_lock_intruder_${suffix}`,
        email: `calendar_lock_intruder_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `calendar_lock_intruder_onboarded_${suffix}`,
        fingerprint: `calendar-lock-intruder-${suffix}`,
      });

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Private Calendar ${suffix}`,
          description: 'Restricted calendar',
          visibility: 'private',
          color: '#f97316',
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const calendarId = calendarResponse.body.id as number;
      expect(calendarId).toBeTruthy();

      await request(server)
        .patch(`/calendars/${calendarId}`)
        .set(intruder.authHeaders)
        .send({ name: `Hijacked ${suffix}` })
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .post(`/calendars/${calendarId}/share`)
        .set(intruder.authHeaders)
        .send({
          userIds: [owner.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .delete(`/calendars/${calendarId}`)
        .set(intruder.authHeaders)
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });
    });
  },
);
