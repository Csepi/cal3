import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenAuthTokenSecurity1734200000000
  implements MigrationInterface
{
  name = 'HardenAuthTokenSecurity1734200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres =
      queryRunner.connection.options.type === 'postgres' ||
      queryRunner.connection.options.type === 'aurora-postgres';

    if (!isPostgres) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "familyId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "parentTokenId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "fingerprintHash" varchar(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "familyExpiresAt" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "consumedAt" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ADD COLUMN IF NOT EXISTS "lastUsedAt" timestamptz
    `);

    await queryRunner.query(`
      UPDATE "auth_refresh_tokens"
      SET "familyId" = COALESCE("familyId", "id"::uuid),
          "familyExpiresAt" = COALESCE("familyExpiresAt", "expiresAt"),
          "lastUsedAt" = COALESCE("lastUsedAt", "createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ALTER COLUMN "familyId" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      ALTER COLUMN "familyExpiresAt" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_refresh_family"
      ON "auth_refresh_tokens" ("familyId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_refresh_user_revoked"
      ON "auth_refresh_tokens" ("userId", "revoked")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres =
      queryRunner.connection.options.type === 'postgres' ||
      queryRunner.connection.options.type === 'aurora-postgres';

    if (!isPostgres) {
      return;
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_auth_refresh_user_revoked"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_refresh_family"`);

    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "lastUsedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "consumedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "familyExpiresAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "fingerprintHash"
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "parentTokenId"
    `);
    await queryRunner.query(`
      ALTER TABLE "auth_refresh_tokens"
      DROP COLUMN IF EXISTS "familyId"
    `);
  }
}

