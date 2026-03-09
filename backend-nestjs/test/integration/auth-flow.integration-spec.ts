import request from 'supertest';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import { describeDockerBacked } from '../support/postgres-nest.harness';

describeDockerBacked('Auth flow integration (postgres testcontainer)', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  it('completes register -> profile -> refresh -> logout flow', async () => {
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
    const fingerprint = 'integration-device-auth-flow';

    const suffix = uniqueSuffix();
    const username = `integration_user_${suffix}`;
    const email = `integration_user_${suffix}@example.com`;
    const password = 'ValidPass123';

    const registerResponse = await request(server)
      .post('/auth/register')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({
        username,
        email,
        password,
      })
      .expect(201);

    expect(registerResponse.body.access_token).toBeTruthy();
    expect(registerResponse.body.refresh_token).toBeTruthy();

    const accessToken = registerResponse.body.access_token as string;
    const refreshToken = registerResponse.body.refresh_token as string;

    await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.username).toBe(username);
      });

    const refreshResponse = await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    expect(refreshResponse.body.access_token).toBeTruthy();
    expect(refreshResponse.body.refresh_token).toBeTruthy();
    expect(refreshResponse.body.refresh_token).not.toBe(refreshToken);

    const rotatedAccessToken = refreshResponse.body.access_token as string;
    const rotatedRefreshToken = refreshResponse.body.refresh_token as string;

    await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${rotatedAccessToken}`)
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken: rotatedRefreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${rotatedAccessToken}`)
      .expect(401);
  });

  it('rejects refresh replay after token rotation', async () => {
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
    const fingerprint = 'integration-device-replay';
    const suffix = uniqueSuffix();
    const username = `integration_replay_${suffix}`;
    const email = `integration_replay_${suffix}@example.com`;
    const password = 'ValidPass123';

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
      .send({
        username,
        password,
      })
      .expect(201);

    const refreshToken = loginResponse.body.refresh_token as string;
    expect(refreshToken).toBeTruthy();

    await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect(401);
  });
});
