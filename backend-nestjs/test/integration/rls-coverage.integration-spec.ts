import { Repository } from 'typeorm';
import { EnableTenantRlsAndAudit1734300000000 } from '../../src/database/migrations/1734300000000-EnableTenantRlsAndAudit';
import { EnterpriseSecurityOptimization1734600000000 } from '../../src/database/migrations/1734600000000-EnterpriseSecurityOptimization';
import { Organisation } from '../../src/entities/organisation.entity';
import { User, UserRole } from '../../src/entities/user.entity';
import {
  describeDockerBacked,
  seedUser,
} from '../support/postgres-nest.harness';

describeDockerBacked('RLS coverage integration', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  let userRepository: Repository<User>;
  let organisationRepository: Repository<Organisation>;

  beforeAll(async () => {
    if (isUnavailable()) {
      return;
    }
    const harness = getHarness();
    if (!harness) {
      return;
    }

    userRepository = harness.dataSource.getRepository(User);
    organisationRepository = harness.dataSource.getRepository(Organisation);

    const queryRunner = harness.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await new EnableTenantRlsAndAudit1734300000000().up(queryRunner);
      await new EnterpriseSecurityOptimization1734600000000().up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  });

  it('prevents cross-tenant reads and writes for newly protected tables', async () => {
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

    const userA = await seedUser(userRepository, {
      username: `rls_user_a_${suffix}`,
      email: `rls_user_a_${suffix}@example.com`,
      password: 'TenantPass123',
      role: UserRole.USER,
    });
    const userB = await seedUser(userRepository, {
      username: `rls_user_b_${suffix}`,
      email: `rls_user_b_${suffix}@example.com`,
      password: 'TenantPass123',
      role: UserRole.USER,
    });

    const organisationA = await organisationRepository.save(
      organisationRepository.create({
        name: `RLS Org A ${suffix}`,
      }),
    );
    const organisationB = await organisationRepository.save(
      organisationRepository.create({
        name: `RLS Org B ${suffix}`,
      }),
    );

    const setupRunner = harness.dataSource.createQueryRunner();
    await setupRunner.connect();
    await setupRunner.startTransaction();
    try {
      await setupRunner.query(
        `SELECT app_set_request_context($1::int, $2::int, $3::boolean, $4::text, $5::text)`,
        [null, null, true, `setup-${suffix}`, null],
      );

      await setupRunner.query(
        `INSERT INTO "resource_types" ("name", "organisationId") VALUES ($1, $2), ($3, $4)`,
        [
          `Resource Type A ${suffix}`,
          organisationA.id,
          `Resource Type B ${suffix}`,
          organisationB.id,
        ],
      );

      await setupRunner.query(
        `INSERT INTO "tasks" ("title", "ownerId", "status") VALUES ($1, $2, $3), ($4, $5, $6)`,
        [
          `Task A ${suffix}`,
          userA.id,
          'todo',
          `Task B ${suffix}`,
          userB.id,
          'todo',
        ],
      );

      await setupRunner.commitTransaction();
    } catch (error) {
      await setupRunner.rollbackTransaction();
      throw error;
    } finally {
      await setupRunner.release();
    }

    const tenantRunner = harness.dataSource.createQueryRunner();
    await tenantRunner.connect();
    await tenantRunner.startTransaction();
    try {
      const roleRows = (await tenantRunner.query(
        `
        SELECT r.rolsuper, r.rolbypassrls
        FROM pg_roles r
        WHERE r.rolname = current_user
        `,
      )) as Array<{ rolsuper: boolean; rolbypassrls: boolean }>;
      const canBypassRls = Boolean(
        roleRows[0]?.rolsuper || roleRows[0]?.rolbypassrls,
      );

      await tenantRunner.query(
        `SELECT app_set_request_context($1::int, $2::int, $3::boolean, $4::text, $5::text)`,
        [organisationA.id, userA.id, false, `tenant-${suffix}`, null],
      );

      const resourceTypes = (await tenantRunner.query(
        `SELECT "organisationId" FROM "resource_types" ORDER BY "id"`,
      )) as Array<{ organisationId: number }>;
      expect(resourceTypes.length).toBeGreaterThan(0);
      expect(new Set(resourceTypes.map((row) => row.organisationId))).toEqual(
        canBypassRls
          ? new Set([organisationA.id, organisationB.id])
          : new Set([organisationA.id]),
      );

      const tasks = (await tenantRunner.query(
        `SELECT "ownerId" FROM "tasks" ORDER BY "id"`,
      )) as Array<{ ownerId: number }>;
      expect(tasks.length).toBeGreaterThan(0);
      expect(new Set(tasks.map((row) => row.ownerId))).toEqual(
        canBypassRls ? new Set([userA.id, userB.id]) : new Set([userA.id]),
      );

      await expect(
        tenantRunner.query(
          `INSERT INTO "resource_types" ("name", "organisationId") VALUES ($1, $2)`,
          [`Blocked Insert ${suffix}`, organisationB.id],
        ),
      ).rejects.toThrow();
    } finally {
      await tenantRunner.rollbackTransaction();
      await tenantRunner.release();
    }
  });
});
