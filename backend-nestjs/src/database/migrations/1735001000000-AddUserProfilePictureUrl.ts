import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfilePictureUrl1735001000000
  implements MigrationInterface
{
  name = 'AddUserProfilePictureUrl1735001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "profilePictureUrl" varchar(2048)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "profilePictureUrl"
    `);
  }
}
