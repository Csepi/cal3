import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCalendarGroups1733600000000 implements MigrationInterface {
  name = 'CreateCalendarGroups1733600000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      // SQLite/local dev uses synchronize; skip explicit migration there.
      return;
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calendar_groups" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "isVisible" boolean NOT NULL DEFAULT true,
        "ownerId" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_calendar_groups_owner" ON "calendar_groups" ("ownerId");
    `);

    await queryRunner.query(`
      ALTER TABLE "calendar_groups"
      ADD CONSTRAINT "FK_calendar_groups_owner"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "calendars"
      ADD COLUMN IF NOT EXISTS "groupId" integer;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_calendars_group" ON "calendars" ("groupId");
    `);

    await queryRunner.query(`
      ALTER TABLE "calendars"
      ADD CONSTRAINT "FK_calendars_group"
      FOREIGN KEY ("groupId") REFERENCES "calendar_groups"("id")
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "calendars" DROP CONSTRAINT IF EXISTS "FK_calendars_group";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_calendars_group";
    `);
    await queryRunner.query(`
      ALTER TABLE "calendars" DROP COLUMN IF EXISTS "groupId";
    `);

    await queryRunner.query(`
      ALTER TABLE "calendar_groups" DROP CONSTRAINT IF EXISTS "FK_calendar_groups_owner";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_calendar_groups_owner";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "calendar_groups";
    `);
  }
}
