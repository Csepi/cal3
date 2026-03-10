import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComplianceAndMfaControls1734800000000
  implements MigrationInterface
{
  name = 'AddComplianceAndMfaControls1734800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "mfaEnabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "mfaSecret" text,
      ADD COLUMN IF NOT EXISTS "mfaKeyVersion" varchar(32),
      ADD COLUMN IF NOT EXISTS "mfaRecoveryCodes" json,
      ADD COLUMN IF NOT EXISTS "mfaEnrolledAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "privacyPolicyAcceptedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" varchar(64),
      ADD COLUMN IF NOT EXISTS "sessionTimeoutMinutes" integer NOT NULL DEFAULT 480
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'ck_users_session_timeout_minutes'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "ck_users_session_timeout_minutes"
          CHECK ("sessionTimeoutMinutes" BETWEEN 5 AND 1440);
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_consents" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "consentType" varchar(64) NOT NULL,
        "policyVersion" varchar(64) NOT NULL,
        "decision" varchar(16) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "acceptedAt" timestamptz,
        "revokedAt" timestamptz,
        "source" varchar(64),
        "ip" varchar(64),
        "userAgent" varchar(255),
        "metadata" json
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_consents_user_id"
      ON "user_consents" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_consents_type"
      ON "user_consents" ("consentType")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_consents_user_type_created"
      ON "user_consents" ("userId", "consentType", "createdAt")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_subject_requests" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "requestType" varchar(16) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "reason" text,
        "handledByUserId" integer REFERENCES "users" ("id") ON DELETE SET NULL,
        "adminNotes" text,
        "completedAt" timestamptz,
        "payload" json,
        "metadata" json,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dsr_user_id"
      ON "data_subject_requests" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dsr_status_created"
      ON "data_subject_requests" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dsr_user_type_status"
      ON "data_subject_requests" ("userId", "requestType", "status")
    `);

    await queryRunner.query(`
      ALTER TABLE "app_log_settings"
      ADD COLUMN IF NOT EXISTS "auditRetentionDays" integer NOT NULL DEFAULT 2555
    `);
    await queryRunner.query(`
      UPDATE "app_log_settings"
      SET "auditRetentionDays" = GREATEST("auditRetentionDays", 2555)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_prevent_audit_mutation()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
      END;
      $$;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_immutable_audit_events ON "audit_events"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_immutable_audit_events
      BEFORE UPDATE OR DELETE ON "audit_events"
      FOR EACH ROW
      EXECUTE FUNCTION app_prevent_audit_mutation()
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'security_audit_log'
        ) THEN
          EXECUTE 'DROP TRIGGER IF EXISTS trg_immutable_security_audit_log ON "security_audit_log"';
          EXECUTE '
            CREATE TRIGGER trg_immutable_security_audit_log
            BEFORE UPDATE OR DELETE ON "security_audit_log"
            FOR EACH ROW
            EXECUTE FUNCTION app_prevent_audit_mutation()
          ';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'security_audit_log'
        ) THEN
          EXECUTE 'DROP TRIGGER IF EXISTS trg_immutable_security_audit_log ON "security_audit_log"';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_immutable_audit_events ON "audit_events"
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS app_prevent_audit_mutation()
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_dsr_user_type_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_dsr_status_created"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_dsr_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "data_subject_requests"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_user_consents_user_type_created"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_user_consents_type"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_user_consents_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_consents"
    `);

    await queryRunner.query(`
      ALTER TABLE "app_log_settings"
      DROP COLUMN IF EXISTS "auditRetentionDays"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "ck_users_session_timeout_minutes"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "sessionTimeoutMinutes",
      DROP COLUMN IF EXISTS "privacyPolicyVersion",
      DROP COLUMN IF EXISTS "privacyPolicyAcceptedAt",
      DROP COLUMN IF EXISTS "mfaEnrolledAt",
      DROP COLUMN IF EXISTS "mfaRecoveryCodes",
      DROP COLUMN IF EXISTS "mfaKeyVersion",
      DROP COLUMN IF EXISTS "mfaSecret",
      DROP COLUMN IF EXISTS "mfaEnabled"
    `);
  }
}
