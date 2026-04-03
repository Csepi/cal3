import request from 'supertest';
import { SharePermission } from '../../src/entities/calendar.entity';
import { registerAndCompleteOnboarding } from '../support/auth-onboarding.flow';
import { describeDockerBacked } from '../support/postgres-nest.harness';

describeDockerBacked(
  'Calendar group API integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    const uniqueSuffix = () =>
      `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const expectSuccessStatus = (status: number) => {
      expect([200, 201]).toContain(status);
    };

    const expectForbiddenOrNotFound = (status: number) => {
      expect([403, 404]).toContain(status);
    };

    const findGroupById = (groups: Array<Record<string, unknown>>, groupId: number) =>
      groups.find((group) => group.id === groupId) as
        | (Record<string, unknown> & {
            calendars?: Array<Record<string, unknown>>;
          })
        | undefined;

    it('creates grouped calendars and supports assign and unassign flows', async () => {
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
        username: `group_owner_${suffix}`,
        email: `group_owner_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `group_owner_onboarded_${suffix}`,
        fingerprint: `group-owner-${suffix}`,
      });

      const groupResponse = await request(server)
        .post('/calendar-groups')
        .set(owner.authHeaders)
        .send({
          name: `Operations ${suffix}`,
          isVisible: true,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const groupId = groupResponse.body.id as number;
      expect(groupId).toBeTruthy();
      expect(groupResponse.body).toEqual(
        expect.objectContaining({
          id: groupId,
          name: `Operations ${suffix}`,
          ownerId: owner.userId,
        }),
      );

      const groupedCalendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Roadmap ${suffix}`,
          description: 'Primary grouped calendar',
          visibility: 'private',
          color: '#3b82f6',
          groupId,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const groupedCalendarId = groupedCalendarResponse.body.id as number;
      expect(groupedCalendarId).toBeTruthy();
      expect(groupedCalendarResponse.body).toEqual(
        expect.objectContaining({
          id: groupedCalendarId,
          groupId,
        }),
      );

      const initialGroupsResponse = await request(server)
        .get('/calendar-groups')
        .set(owner.authHeaders)
        .expect(200);

      const initialGroup = findGroupById(
        initialGroupsResponse.body as Array<Record<string, unknown>>,
        groupId,
      );
      expect(initialGroup).toBeDefined();
      expect(initialGroup?.calendars).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: groupedCalendarId }),
        ]),
      );

      const detachedCalendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Inbox ${suffix}`,
          description: 'Starts outside the group',
          visibility: 'private',
          color: '#10b981',
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const detachedCalendarId = detachedCalendarResponse.body.id as number;
      expect(detachedCalendarId).toBeTruthy();
      expect(detachedCalendarResponse.body.groupId ?? null).toBeNull();

      const assignResponse = await request(server)
        .post(`/calendar-groups/${groupId}/calendars`)
        .set(owner.authHeaders)
        .send({
          calendarIds: [detachedCalendarId],
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      expect(assignResponse.body).toEqual(
        expect.objectContaining({
          id: groupId,
          calendars: expect.arrayContaining([
            expect.objectContaining({ id: groupedCalendarId }),
            expect.objectContaining({ id: detachedCalendarId }),
          ]),
        }),
      );

      await request(server)
        .get(`/calendars/${detachedCalendarId}`)
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.groupId).toBe(groupId);
        });

      const unassignResponse = await request(server)
        .post(`/calendar-groups/${groupId}/calendars/unassign`)
        .set(owner.authHeaders)
        .send({
          calendarIds: [detachedCalendarId],
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const remainingCalendarIds = (
        (unassignResponse.body.calendars ?? []) as Array<Record<string, unknown>>
      ).map((calendar) => calendar.id);
      expect(remainingCalendarIds).toContain(groupedCalendarId);
      expect(remainingCalendarIds).not.toContain(detachedCalendarId);

      await request(server)
        .get(`/calendars/${detachedCalendarId}`)
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.groupId ?? null).toBeNull();
        });
    });

    it('shares grouped calendars to improve access and blocks non-owner group actions', async () => {
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
        username: `share_owner_${suffix}`,
        email: `share_owner_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `share_owner_onboarded_${suffix}`,
        fingerprint: `share-owner-${suffix}`,
      });

      const member = await registerAndCompleteOnboarding(server, {
        username: `share_member_${suffix}`,
        email: `share_member_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `share_member_onboarded_${suffix}`,
        fingerprint: `share-member-${suffix}`,
      });

      const groupResponse = await request(server)
        .post('/calendar-groups')
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

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Shared Calendar ${suffix}`,
          description: 'Grouped calendar to share',
          visibility: 'private',
          color: '#f59e0b',
          groupId,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const calendarId = calendarResponse.body.id as number;
      expect(calendarId).toBeTruthy();

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      const shareResponse = await request(server)
        .post(`/calendar-groups/${groupId}/share`)
        .set(owner.authHeaders)
        .send({
          userIds: [member.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      expect(shareResponse.body).toEqual({
        sharedCalendarIds: [calendarId],
      });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: calendarId,
              groupId,
              owner: expect.objectContaining({ id: owner.userId }),
            }),
          );
        });

      const memberGroupsResponse = await request(server)
        .get('/calendar-groups')
        .set(member.authHeaders)
        .expect(200);

      const sharedGroup = findGroupById(
        memberGroupsResponse.body as Array<Record<string, unknown>>,
        groupId,
      );
      expect(sharedGroup).toBeDefined();
      expect(sharedGroup?.calendars).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: calendarId })]),
      );

      await request(server)
        .patch(`/calendar-groups/${groupId}`)
        .set(member.authHeaders)
        .send({ name: `Taken Over ${suffix}` })
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .delete(`/calendar-groups/${groupId}`)
        .set(member.authHeaders)
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .post(`/calendar-groups/${groupId}/share`)
        .set(member.authHeaders)
        .send({
          userIds: [owner.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });
    });

    it('lets group owners update, unshare, and delete calendar groups', async () => {
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
        username: `lifecycle_owner_${suffix}`,
        email: `lifecycle_owner_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `lifecycle_owner_onboarded_${suffix}`,
        fingerprint: `lifecycle-owner-${suffix}`,
      });

      const member = await registerAndCompleteOnboarding(server, {
        username: `lifecycle_member_${suffix}`,
        email: `lifecycle_member_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `lifecycle_member_onboarded_${suffix}`,
        fingerprint: `lifecycle-member-${suffix}`,
      });

      const groupResponse = await request(server)
        .post('/calendar-groups')
        .set(owner.authHeaders)
        .send({
          name: `Lifecycle Group ${suffix}`,
          isVisible: true,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const groupId = groupResponse.body.id as number;
      expect(groupId).toBeTruthy();

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(owner.authHeaders)
        .send({
          name: `Lifecycle Calendar ${suffix}`,
          description: 'Calendar for owner lifecycle test',
          visibility: 'private',
          color: '#f59e0b',
          groupId,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      const calendarId = calendarResponse.body.id as number;
      expect(calendarId).toBeTruthy();

      await request(server)
        .post(`/calendar-groups/${groupId}/share`)
        .set(owner.authHeaders)
        .send({
          userIds: [member.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect(200);

      await request(server)
        .patch(`/calendar-groups/${groupId}`)
        .set(owner.authHeaders)
        .send({
          name: `Lifecycle Group Updated ${suffix}`,
          isVisible: false,
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        })
        .expect((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              id: groupId,
              name: `Lifecycle Group Updated ${suffix}`,
              isVisible: false,
            }),
          );
        });

      await request(server)
        .delete(`/calendar-groups/${groupId}/share`)
        .set(owner.authHeaders)
        .send({
          userIds: [member.userId],
        })
        .expect((response) => {
          expectSuccessStatus(response.status);
        })
        .expect((response) => {
          expect(response.body).toEqual({ unsharedCalendarIds: [calendarId] });
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(member.authHeaders)
        .expect((response) => {
          expectForbiddenOrNotFound(response.status);
        });

      await request(server)
        .delete(`/calendar-groups/${groupId}`)
        .set(owner.authHeaders)
        .expect((response) => {
          expectSuccessStatus(response.status);
        });

      await request(server)
        .get('/calendar-groups')
        .set(owner.authHeaders)
        .expect(200)
        .expect((response) => {
          const groups = response.body as Array<{ id: number }>;
          expect(groups.map((group) => group.id)).not.toContain(groupId);
        });
    });
  },
);
