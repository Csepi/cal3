import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEventLabels1736003000000 implements MigrationInterface {
  name = 'AddUserEventLabels1736003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "eventLabels" json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "eventLabels"
    `);
  }
}
