import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguagePreferences1734900000000 implements MigrationInterface {
  name = 'AddLanguagePreferences1734900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "preferred_language" varchar(8) NOT NULL DEFAULT 'en'
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "preferred_language" = COALESCE(
        NULLIF("preferred_language", ''),
        NULLIF("language", ''),
        'en'
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_preferred_language"
      ON "users" ("preferred_language")
    `);

    await queryRunner.query(`
      ALTER TABLE "organisations"
      ADD COLUMN IF NOT EXISTS "default_language" varchar(8) NOT NULL DEFAULT 'en'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_organisations_default_language"
      ON "organisations" ("default_language")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_organisations_default_language"
    `);
    await queryRunner.query(`
      ALTER TABLE "organisations"
      DROP COLUMN IF EXISTS "default_language"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_users_preferred_language"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "preferred_language"
    `);
  }
}

