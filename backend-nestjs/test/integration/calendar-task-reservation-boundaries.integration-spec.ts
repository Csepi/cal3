import request from 'supertest';
import { SharePermission } from '../../src/entities/calendar.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import { registerAndCompleteOnboarding } from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Calendar, task, and reservation boundary integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    const uniqueSuffix = () =>
      `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    it('enforces ownership and plan-based access across core endpoints', async () => {
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

      const userA = await registerAndCompleteOnboarding(server, {
        username: `boundary_user_a_${suffix}`,
        email: `boundary_user_a_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `boundary_user_a_onboarded_${suffix}`,
        fingerprint: `boundary-user-a-${suffix}`,
      });

      const userB = await registerAndCompleteOnboarding(server, {
        username: `boundary_user_b_${suffix}`,
        email: `boundary_user_b_${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `boundary_user_b_onboarded_${suffix}`,
        fingerprint: `boundary-user-b-${suffix}`,
      });

      const calendarResponse = await request(server)
        .post('/calendars')
        .set(userA.authHeaders)
        .send({
          name: `Boundary Calendar ${suffix}`,
          description: 'Calendar boundary coverage',
          visibility: 'private',
          color: '#3b82f6',
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      const calendarId = calendarResponse.body.id as number;
      expect(calendarId).toBeTruthy();

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(userB.authHeaders)
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
        });

      await request(server)
        .post(`/calendars/${calendarId}/share`)
        .set(userA.authHeaders)
        .send({
          userIds: [userB.userId],
          permission: SharePermission.READ,
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .get(`/calendars/${calendarId}`)
        .set(userB.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(calendarId);
          expect(response.body.owner?.id).toBe(userA.userId);
        });

      const taskResponse = await request(server)
        .post('/tasks')
        .set(userA.authHeaders)
        .send({
          title: `Boundary Task ${suffix}`,
          body: 'Task boundary coverage',
          status: 'todo',
          priority: 'medium',
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      const taskId = taskResponse.body.id as number;
      expect(taskId).toBeTruthy();

      await request(server)
        .get(`/tasks/${taskId}`)
        .set(userA.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(taskId);
        });

      await request(server)
        .get(`/tasks/${taskId}`)
        .set(userB.authHeaders)
        .expect((response) => {
          expect([403, 404]).toContain(response.status);
        });

      await request(server)
        .get('/reservations')
        .set(userA.authHeaders)
        .expect(403);
    });
  },
);
