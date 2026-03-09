import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditEventsAndMonitoringSettings1734400000000
  implements MigrationInterface
{
  name = 'CreateAuditEventsAndMonitoringSettings1734400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id bigserial PRIMARY KEY,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        category varchar(32) NOT NULL,
        action varchar(160) NOT NULL,
        severity varchar(16) NOT NULL,
        outcome varchar(16) NOT NULL,
        "requestId" varchar(64) NULL,
        "userId" integer NULL,
        "organisationId" integer NULL,
        "resourceType" varchar(80) NULL,
        "resourceId" varchar(120) NULL,
        ip varchar(64) NULL,
        method varchar(10) NULL,
        path varchar(400) NULL,
        "errorCode" varchar(64) NULL,
        "errorMessage" text NULL,
        "beforeSnapshot" text NULL,
        "afterSnapshot" text NULL,
        metadata text NULL,
        fingerprint varchar(160) NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
      ON audit_events ("createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_category
      ON audit_events (category)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_action
      ON audit_events (action)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_severity
      ON audit_events (severity)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_request_id
      ON audit_events ("requestId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_user_id
      ON audit_events ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_org_id
      ON audit_events ("organisationId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_events_fingerprint
      ON audit_events (fingerprint)
    `);

    await queryRunner.query(`
      ALTER TABLE app_log_settings
      ADD COLUMN IF NOT EXISTS "realtimeCriticalAlertsEnabled" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE app_log_settings
      ADD COLUMN IF NOT EXISTS "errorRateAlertThresholdPerMinute" integer NOT NULL DEFAULT 25
    `);
    await queryRunner.query(`
      ALTER TABLE app_log_settings
      ADD COLUMN IF NOT EXISTS "p95LatencyAlertThresholdMs" integer NOT NULL DEFAULT 1500
    `);
    await queryRunner.query(`
      ALTER TABLE app_log_settings
      ADD COLUMN IF NOT EXISTS "metricsRetentionHours" integer NOT NULL DEFAULT 72
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE app_log_settings DROP COLUMN IF EXISTS "metricsRetentionHours"`,
    );
    await queryRunner.query(
      `ALTER TABLE app_log_settings DROP COLUMN IF EXISTS "p95LatencyAlertThresholdMs"`,
    );
    await queryRunner.query(
      `ALTER TABLE app_log_settings DROP COLUMN IF EXISTS "errorRateAlertThresholdPerMinute"`,
    );
    await queryRunner.query(
      `ALTER TABLE app_log_settings DROP COLUMN IF EXISTS "realtimeCriticalAlertsEnabled"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS audit_events`);
  }

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }
}
