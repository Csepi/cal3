import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenWebhookAutomationSecurity1734700000000
  implements MigrationInterface
{
  name = 'HardenWebhookAutomationSecurity1734700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "automation_rules"
      ADD COLUMN IF NOT EXISTS "webhookSecretPrevious" varchar(128),
      ADD COLUMN IF NOT EXISTS "webhookSecretRotatedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "webhookSecretGraceUntil" timestamptz,
      ADD COLUMN IF NOT EXISTS "isApprovalRequired" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "approvedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "approvedByUserId" integer
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_automation_rules_approvedByUserId'
        ) THEN
          ALTER TABLE "automation_rules"
          ADD CONSTRAINT "FK_automation_rules_approvedByUserId"
          FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_automation_rules_approval"
      ON "automation_rules" ("isApprovalRequired", "approvedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_automation_rules_approval"
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_rules"
      DROP CONSTRAINT IF EXISTS "FK_automation_rules_approvedByUserId"
    `);

    await queryRunner.query(`
      ALTER TABLE "automation_rules"
      DROP COLUMN IF EXISTS "approvedByUserId",
      DROP COLUMN IF EXISTS "approvedAt",
      DROP COLUMN IF EXISTS "isApprovalRequired",
      DROP COLUMN IF EXISTS "webhookSecretGraceUntil",
      DROP COLUMN IF EXISTS "webhookSecretRotatedAt",
      DROP COLUMN IF EXISTS "webhookSecretPrevious"
    `);
  }
}
