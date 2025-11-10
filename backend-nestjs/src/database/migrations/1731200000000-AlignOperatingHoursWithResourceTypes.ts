import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignOperatingHoursWithResourceTypes1731200000000
  implements MigrationInterface
{
  name = 'AlignOperatingHoursWithResourceTypes1731200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operating_hours" ADD COLUMN IF NOT EXISTS "resourceTypeId" integer`,
    );

    await queryRunner.query(`
      UPDATE "operating_hours" oh
      SET "resourceTypeId" = r."resourceTypeId"
      FROM "resources" r
      WHERE oh."resourceId" = r."id" AND oh."resourceTypeId" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "operating_hours" DROP CONSTRAINT IF EXISTS "FK_operating_hours_resource"`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operating_hours_resourceType" ON "operating_hours" ("resourceTypeId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours"
       ADD CONSTRAINT "FK_operating_hours_resource_type"
       FOREIGN KEY ("resourceTypeId") REFERENCES "resource_types"("id")
       ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" ALTER COLUMN "resourceTypeId" SET NOT NULL`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_operating_hours_resourceId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" DROP COLUMN IF EXISTS "resourceId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "startTime" TO "openTime"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "endTime" TO "closeTime"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "isAvailable" TO "isActive"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "isActive" TO "isAvailable"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "closeTime" TO "endTime"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" RENAME COLUMN "openTime" TO "startTime"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" ADD COLUMN IF NOT EXISTS "resourceId" integer`,
    );

    await queryRunner.query(`
      UPDATE "operating_hours" oh
      SET "resourceId" = (
        SELECT MIN(r."id")
        FROM "resources" r
        WHERE r."resourceTypeId" = oh."resourceTypeId"
      )
      WHERE oh."resourceId" IS NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_operating_hours_resourceId" ON "operating_hours" ("resourceId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours"
       ADD CONSTRAINT "FK_operating_hours_resource"
       FOREIGN KEY ("resourceId") REFERENCES "resources"("id")
       ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" DROP CONSTRAINT IF EXISTS "FK_operating_hours_resource_type"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_operating_hours_resourceType"`,
    );

    await queryRunner.query(
      `ALTER TABLE "operating_hours" DROP COLUMN IF EXISTS "resourceTypeId"`,
    );
  }
}
