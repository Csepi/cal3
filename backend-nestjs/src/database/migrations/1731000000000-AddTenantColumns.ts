import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantColumns1731000000000 implements MigrationInterface {
  name = 'AddTenantColumns1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "organisationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "organisationId" integer`,
    );

    await queryRunner.query(`
      UPDATE "resources" r
      SET "organisationId" = rt."organisationId"
      FROM "resource_types" rt
      WHERE rt."id" = r."resourceTypeId" AND r."organisationId" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "reservations" resv
      SET "organisationId" = rt."organisationId"
      FROM "resources" r
      INNER JOIN "resource_types" rt ON rt."id" = r."resourceTypeId"
      WHERE resv."resourceId" = r."id" AND resv."organisationId" IS NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_resources_organisation" ON "resources" ("organisationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reservations_organisation" ON "reservations" ("organisationId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "resources"
      ADD CONSTRAINT "FK_resources_organisation"
      FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
      ON DELETE SET NULL
      DEFERRABLE INITIALLY IMMEDIATE
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD CONSTRAINT "FK_reservations_organisation"
      FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
      ON DELETE SET NULL
      DEFERRABLE INITIALLY IMMEDIATE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "FK_reservations_organisation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "FK_resources_organisation"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_reservations_organisation"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_resources_organisation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN IF EXISTS "organisationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP COLUMN IF EXISTS "organisationId"`,
    );
  }
}
