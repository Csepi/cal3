import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserOnboardingFields1735000000000 implements MigrationInterface {
  name = 'AddUserOnboardingFields1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "onboardingUseCase" varchar(32),
      ADD COLUMN IF NOT EXISTS "onboardingGoogleCalendarSyncRequested" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "onboardingMicrosoftCalendarSyncRequested" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "onboardingCompleted" = true,
          "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", "updatedAt")
      WHERE "onboardingCompleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_onboarding_completed"
      ON "users" ("onboardingCompleted")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_users_onboarding_completed"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "onboardingMicrosoftCalendarSyncRequested",
      DROP COLUMN IF EXISTS "onboardingGoogleCalendarSyncRequested",
      DROP COLUMN IF EXISTS "onboardingUseCase",
      DROP COLUMN IF EXISTS "onboardingCompletedAt",
      DROP COLUMN IF EXISTS "onboardingCompleted"
    `);
  }
}
