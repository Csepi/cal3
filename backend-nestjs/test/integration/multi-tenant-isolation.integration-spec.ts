import request from 'supertest';
import { Repository } from 'typeorm';
import { Organisation } from '../../src/entities/organisation.entity';
import {
  OrganisationRoleType,
  OrganisationUser,
} from '../../src/entities/organisation-user.entity';
import { UserRole } from '../../src/entities/user.entity';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import {
  describeDockerBacked,
  seedUser,
} from '../support/postgres-nest.harness';

describeDockerBacked('Multi-tenant isolation integration', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  let organisationRepository: Repository<Organisation>;
  let organisationUserRepository: Repository<OrganisationUser>;

  beforeEach(async () => {
    if (isUnavailable()) {
      return;
    }
    const harness = getHarness();
    if (!harness) {
      return;
    }

    organisationRepository = harness.dataSource.getRepository(Organisation);
    organisationUserRepository = harness.dataSource.getRepository(OrganisationUser);

    await organisationUserRepository.delete({});
    await organisationRepository.delete({});
    await harness.userRepository.delete({});
  });

  it('blocks cross-organisation reads and writes while allowing scoped access', async () => {
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

    const userA = await seedUser(harness.userRepository, {
      username: `tenant_a_${suffix}`,
      email: `tenant_a_${suffix}@example.com`,
      password: 'TenantPass123',
      role: UserRole.USER,
    });

    const userB = await seedUser(harness.userRepository, {
      username: `tenant_b_${suffix}`,
      email: `tenant_b_${suffix}@example.com`,
      password: 'TenantPass123',
      role: UserRole.USER,
    });

    const organisationA = await organisationRepository.save(
      organisationRepository.create({
        name: `Organisation A ${suffix}`,
        description: 'Tenant A',
      }),
    );

    const organisationB = await organisationRepository.save(
      organisationRepository.create({
        name: `Organisation B ${suffix}`,
        description: 'Tenant B',
      }),
    );

    await organisationUserRepository.save([
      organisationUserRepository.create({
        organisationId: organisationA.id,
        userId: userA.id,
        role: OrganisationRoleType.ADMIN,
      }),
      organisationUserRepository.create({
        organisationId: organisationA.id,
        userId: userB.id,
        role: OrganisationRoleType.USER,
      }),
      organisationUserRepository.create({
        organisationId: organisationB.id,
        userId: userB.id,
        role: OrganisationRoleType.ADMIN,
      }),
    ]);

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    const loginA = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-a-${suffix}`)
      .send({ username: userA.username, password: 'TenantPass123' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const accessTokenA = loginA.body.access_token as string;
    expect(accessTokenA).toBeTruthy();

    const listResponse = await request(server)
      .get('/organisations')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-a-${suffix}`)
      .expect(200);

    const listedIds = (listResponse.body as Array<{ id: number }>).map((org) => org.id);
    expect(listedIds).toContain(organisationA.id);
    expect(listedIds).not.toContain(organisationB.id);

    await request(server)
      .get(`/organisations/${organisationA.id}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-a-${suffix}`)
      .expect(200);

    await request(server)
      .get(`/organisations/${organisationB.id}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-a-${suffix}`)
      .expect((response) => {
        expect([403, 404]).toContain(response.status);
      });

    const loginB = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-b-${suffix}`)
      .send({ username: userB.username, password: 'TenantPass123' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const accessTokenB = loginB.body.access_token as string;
    expect(accessTokenB).toBeTruthy();

    await request(server)
      .patch(`/organisations/${organisationA.id}/color`)
      .set('Authorization', `Bearer ${accessTokenB}`)
      .set(DEVICE_FINGERPRINT_HEADER, `tenant-b-${suffix}`)
      .send({ color: '#22c55e' })
      .expect((response) => {
        expect([403, 404]).toContain(response.status);
      });
  });
});
