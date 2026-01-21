import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarRank1734100000000 implements MigrationInterface {
  name = 'AddCalendarRank1734100000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      // SQLite/local dev uses synchronize; skip explicit migration there.
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "calendars"
      ADD COLUMN IF NOT EXISTS "rank" integer NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "calendars" DROP COLUMN IF EXISTS "rank";
    `);
  }
}
