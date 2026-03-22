import request from 'supertest';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import { describeDockerBacked } from '../support/postgres-nest.harness';

describeDockerBacked('Concurrent token rotation integration', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  it('revokes token family when concurrent replay is detected', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const username = `concurrent_user_${suffix}`;
    const email = `concurrent_user_${suffix}@example.com`;
    const password = 'ConcurrentPass#123';
    const fingerprint = `concurrent-fp-${suffix}`;

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/register')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({
        username,
        email,
        password,
      })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ username, password })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const refreshToken = loginResponse.body.refresh_token as string;
    expect(refreshToken).toBeTruthy();

    const [firstRefresh, secondRefresh] = await Promise.all([
      request(server)
        .post('/auth/refresh')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send({ refreshToken }),
      request(server)
        .post('/auth/refresh')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
        .send({ refreshToken }),
    ]);

    const statuses = [firstRefresh.status, secondRefresh.status];
    const successCount = statuses.filter((status) =>
      [200, 201].includes(status),
    ).length;
    const unauthorizedCount = statuses.filter((status) => status === 401).length;
    expect(successCount).toBe(1);
    expect(unauthorizedCount).toBe(1);

    const freshTokenResponse = [firstRefresh, secondRefresh].find((response) =>
      [200, 201].includes(response.status),
    );
    expect(freshTokenResponse?.body?.refresh_token).toBeTruthy();

    const rotatedRefreshToken = freshTokenResponse?.body?.refresh_token as string;

    await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken: rotatedRefreshToken })
      .expect(401);
  });
});
