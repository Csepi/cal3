import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoverTenantColumns1731300000000 implements MigrationInterface {
  name = 'RecoverTenantColumns1731300000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      // Dev environments often use SQLite with synchronize=true, so no-op there.
      return;
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'resources'
            AND column_name = 'organisationId'
        ) THEN
          ALTER TABLE "resources" ADD COLUMN "organisationId" integer;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'reservations'
            AND column_name = 'organisationId'
        ) THEN
          ALTER TABLE "reservations" ADD COLUMN "organisationId" integer;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      UPDATE "resources" r
      SET "organisationId" = rt."organisationId"
      FROM "resource_types" rt
      WHERE r."resourceTypeId" = rt."id"
        AND rt."organisationId" IS NOT NULL
        AND r."organisationId" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "reservations" resv
      SET "organisationId" = rt."organisationId"
      FROM "resources" r
      INNER JOIN "resource_types" rt ON rt."id" = r."resourceTypeId"
      WHERE resv."resourceId" = r."id"
        AND rt."organisationId" IS NOT NULL
        AND resv."organisationId" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_resources_organisation" ON "resources" ("organisationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reservations_organisation" ON "reservations" ("organisationId")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_resources_organisation'
            AND table_name = 'resources'
        ) THEN
          ALTER TABLE "resources"
          ADD CONSTRAINT "FK_resources_organisation"
          FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
          ON DELETE SET NULL
          DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_reservations_organisation'
            AND table_name = 'reservations'
        ) THEN
          ALTER TABLE "reservations"
          ADD CONSTRAINT "FK_reservations_organisation"
          FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
          ON DELETE SET NULL
          DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "FK_reservations_organisation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "FK_resources_organisation"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_reservations_organisation"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_resources_organisation"`);
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN IF EXISTS "organisationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP COLUMN IF EXISTS "organisationId"`,
    );
  }
}

