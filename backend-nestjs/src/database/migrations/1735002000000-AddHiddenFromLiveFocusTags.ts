import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHiddenFromLiveFocusTags1735002000000
  implements MigrationInterface
{
  name = 'AddHiddenFromLiveFocusTags1735002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "hiddenFromLiveFocusTags" json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "hiddenFromLiveFocusTags"
    `);
  }
}
