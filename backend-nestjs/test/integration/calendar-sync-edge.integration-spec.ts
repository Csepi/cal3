import request from 'supertest';
import { SyncProvider } from '../../src/entities/calendar-sync.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Calendar sync API edge integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let sequence = 0;

    const nextSuffix = (prefix: string): string => {
      sequence += 1;
      return `${prefix}-${String(sequence).padStart(2, '0')}`;
    };

    const getHarnessOrThrow = () => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }
      return harness;
    };

    const getServer = () =>
      getHarnessOrThrow().app.getHttpServer() as Parameters<typeof request>[0];

    const createSession = async (
      prefix: string,
    ): Promise<OnboardedUserSession> => {
      const suffix = nextSuffix(prefix);
      return registerAndCompleteOnboarding(getServer(), {
        username: `${prefix}-register-${suffix}`,
        email: `${prefix}-${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `${prefix}-user-${suffix}`,
        fingerprint: `${prefix}-fingerprint-${suffix}`,
      });
    };

    it('returns disconnected provider status and allows no-op disconnect endpoints', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('sync-status');

      await request(server).get('/calendar-sync/status').expect(401);

      const statusResponse = await request(server)
        .get('/calendar-sync/status')
        .set(session.authHeaders)
        .expect(200);

      expect(Array.isArray(statusResponse.body.providers)).toBe(true);
      expect(statusResponse.body.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: SyncProvider.GOOGLE,
            isConnected: false,
          }),
          expect.objectContaining({
            provider: SyncProvider.MICROSOFT,
            isConnected: false,
          }),
        ]),
      );

      await request(server)
        .post('/calendar-sync/disconnect')
        .set(session.authHeaders)
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
          expect(String(response.body.message || '')).toMatch(/disconnect|all/i);
        });

      await request(server)
        .post(`/calendar-sync/disconnect/${SyncProvider.GOOGLE}`)
        .set(session.authHeaders)
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
          expect(String(response.body.message || '')).toMatch(/google/i);
        });
    });

    it('rejects sync/force calls when provider connections are absent and validates callback input', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('sync-errors');

      await request(server)
        .post('/calendar-sync/sync')
        .set(session.authHeaders)
        .send({
          provider: SyncProvider.GOOGLE,
          calendars: [],
        })
        .expect(404);

      await request(server)
        .post('/calendar-sync/force')
        .set(session.authHeaders)
        .expect(404);

      await request(server)
        .get('/calendar-sync/auth/unsupported-provider')
        .set(session.authHeaders)
        .expect(400);

      await request(server)
        .get(`/calendar-sync/callback/${SyncProvider.GOOGLE}`)
        .query({
          code: 'abc123',
          state: 'calendar-sync-invalid-state-without-user',
        })
        .expect(302)
        .expect((response) => {
          const location = String(response.headers.location || '');
          expect(location).toContain('error=sync_failed');
        });

      await request(server)
        .get(`/calendar-sync/callback/${SyncProvider.GOOGLE}`)
        .query({ state: 'calendar-sync-123' })
        .expect(400);
    });
  },
);
