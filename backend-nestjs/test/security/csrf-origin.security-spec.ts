import request from 'supertest';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../../src/common/security/csrf.service';
import { describeDockerBacked } from '../support/postgres-nest.harness';

describeDockerBacked('CSRF and strict-origin security', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  it('blocks mutating requests from disallowed origins', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ username: 'any', password: 'any' })
      .expect(403);
  });

  it('enforces csrf header when csrf cookie exists', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `${CSRF_COOKIE_NAME}=known-token`)
      .send({ username: 'any', password: 'any' })
      .expect(403);

    await request(server)
      .post('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `${CSRF_COOKIE_NAME}=known-token`)
      .set(CSRF_HEADER_NAME, 'known-token')
      .send({ username: 'any', password: 'any' })
      .expect((response) => {
        // Credentials are invalid, but CSRF layer should pass.
        expect([400, 401]).toContain(response.status);
      });
  });

  it('allows webhook-style route without csrf token when path is excluded', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/automation/webhook/test-no-handler')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `${CSRF_COOKIE_NAME}=known-token`)
      .send({ ping: true })
      .expect((response) => {
        // Route may not exist, but CSRF should not be the blocker.
        expect(response.status).not.toBe(403);
      });
  });
});
