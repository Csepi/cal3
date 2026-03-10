import { MigrationInterface, QueryRunner } from 'typeorm';

const DIRECT_ORG_TABLES = [
  'organisation_admins',
  'organisation_users',
  'organisation_resource_type_permissions',
  'organisation_calendar_permissions',
  'reservation_calendars',
  'resource_types',
  'resources',
  'reservations',
] as const;

const LEGACY_RLS_TABLES = [
  'organisations',
  'calendars',
  'events',
  'calendar_shares',
  'operating_hours',
  'reservation_calendar_roles',
  ...DIRECT_ORG_TABLES,
] as const;

const NEW_RLS_TABLES = [
  'audit_events',
  'security_audit_log',
  'api_keys',
  'auth_refresh_tokens',
  'calendar_groups',
  'calendar_sync_connections',
  'synced_calendars',
  'sync_event_mappings',
  'event_comments',
  'tasks',
  'task_labels',
  'task_label_assignments',
  'idempotency_records',
  'automation_rules',
  'automation_conditions',
  'automation_actions',
  'automation_audit_logs',
  'notification_threads',
  'notification_messages',
  'notification_deliveries',
  'notification_scope_mutes',
  'notification_inbox_rules',
  'notification_thread_states',
  'user_notification_preferences',
  'push_device_tokens',
  'agent_profiles',
  'agent_permissions',
  'agent_api_keys',
] as const;

const USER_OWNED_TABLES: ReadonlyArray<{
  table: string;
  ownerColumn: string;
}> = [
  { table: 'api_keys', ownerColumn: 'userId' },
  { table: 'auth_refresh_tokens', ownerColumn: 'userId' },
  { table: 'calendar_groups', ownerColumn: 'ownerId' },
  { table: 'calendar_sync_connections', ownerColumn: 'userId' },
  { table: 'task_labels', ownerColumn: 'userId' },
  { table: 'tasks', ownerColumn: 'ownerId' },
  { table: 'push_device_tokens', ownerColumn: 'userId' },
  { table: 'user_notification_preferences', ownerColumn: 'userId' },
  { table: 'notification_scope_mutes', ownerColumn: 'userId' },
  { table: 'notification_inbox_rules', ownerColumn: 'userId' },
  { table: 'notification_thread_states', ownerColumn: 'userId' },
  { table: 'notification_messages', ownerColumn: 'userId' },
  { table: 'agent_profiles', ownerColumn: 'userId' },
  { table: 'idempotency_records', ownerColumn: 'userId' },
] as const;

const NEW_AUDIT_TRIGGER_TABLES = [
  'api_keys',
  'auth_refresh_tokens',
  'calendar_groups',
  'calendar_sync_connections',
  'synced_calendars',
  'sync_event_mappings',
  'event_comments',
  'tasks',
  'task_labels',
  'task_label_assignments',
  'automation_rules',
  'automation_conditions',
  'automation_actions',
  'automation_audit_logs',
  'notification_threads',
  'notification_messages',
  'notification_deliveries',
  'notification_scope_mutes',
  'notification_inbox_rules',
  'notification_thread_states',
  'user_notification_preferences',
  'push_device_tokens',
  'agent_profiles',
  'agent_permissions',
  'agent_api_keys',
  'idempotency_records',
] as const;

const PERFORMANCE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_events_calendar_startdate_starttime ON "events" ("calendarId", "startDate", "startTime")`,
  `CREATE INDEX IF NOT EXISTS idx_events_calendar_created_at_desc ON "events" ("calendarId", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_org_status_start_time ON "reservations" ("organisationId", "status", "startTime")`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_org_start_end_time ON "reservations" ("organisationId", "startTime", "endTime")`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_owner_status_due_date ON "tasks" ("ownerId", "status", "dueDate")`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status_due_date ON "tasks" ("assigneeId", "status", "dueDate")`,
  `CREATE INDEX IF NOT EXISTS idx_task_labels_user_name ON "task_labels" ("userId", "name")`,
  `CREATE INDEX IF NOT EXISTS idx_automation_rules_owner_enabled ON "automation_rules" ("createdById", "isEnabled")`,
  `CREATE INDEX IF NOT EXISTS idx_automation_audit_logs_rule_executed_desc ON "automation_audit_logs" ("ruleId", "executedAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_calendar_sync_connections_user_provider ON "calendar_sync_connections" ("userId", "provider")`,
  `CREATE INDEX IF NOT EXISTS idx_synced_calendars_connection_local ON "synced_calendars" ("syncConnectionId", "localCalendarId")`,
  `CREATE INDEX IF NOT EXISTS idx_sync_event_mappings_local_event ON "sync_event_mappings" ("localEventId")`,
  `CREATE INDEX IF NOT EXISTS idx_event_comments_event_created_desc ON "event_comments" ("eventId", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_time ON "security_audit_log" (changed_by_user_id, changed_at DESC)`,
] as const;

export class EnterpriseSecurityOptimization1734600000000
  implements MigrationInterface
{
  name = 'EnterpriseSecurityOptimization1734600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await this.enableExtensions(queryRunner);
    await this.createHelperFunctions(queryRunner);
    await this.configureRoleSeparation(queryRunner);
    await this.configureSensitiveColumnEncryption(queryRunner);
    await this.enableRlsCoverage(queryRunner);
    await this.configureAuditTriggerCoverage(queryRunner);
    await this.createIntegrityConstraints(queryRunner);
    await this.createPerformanceIndexes(queryRunner);
    await this.createMaterializedViews(queryRunner);
    await this.createQueryPerformanceObjects(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS app_capture_query_performance(integer)
    `);
    await this.safeDropTable(queryRunner, 'query_performance_snapshots');
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS app_refresh_reporting_views(boolean)
    `);
    await this.safeDropMaterializedView(
      queryRunner,
      'reporting_user_task_status_summary',
    );
    await this.safeDropMaterializedView(
      queryRunner,
      'reporting_org_daily_reservation_stats',
    );

    await this.dropIndexIfExists(
      queryRunner,
      'idx_security_audit_log_user_time',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_event_comments_event_created_desc',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_sync_event_mappings_local_event',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_synced_calendars_connection_local',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_calendar_sync_connections_user_provider',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_automation_audit_logs_rule_executed_desc',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_automation_rules_owner_enabled',
    );
    await this.dropIndexIfExists(queryRunner, 'idx_task_labels_user_name');
    await this.dropIndexIfExists(queryRunner, 'idx_tasks_assignee_status_due_date');
    await this.dropIndexIfExists(queryRunner, 'idx_tasks_owner_status_due_date');
    await this.dropIndexIfExists(
      queryRunner,
      'idx_reservations_org_start_end_time',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_reservations_org_status_start_time',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_events_calendar_created_at_desc',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'idx_events_calendar_startdate_starttime',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'ux_notification_scope_mutes_user_scope',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'ux_user_notification_preferences_user_event',
    );

    await this.dropConstraintIfExists(
      queryRunner,
      'security_audit_log',
      'ck_security_audit_log_operation',
    );
    await this.dropConstraintIfExists(
      queryRunner,
      'notification_deliveries',
      'ck_notification_deliveries_attempt_count_non_negative',
    );
    await this.dropConstraintIfExists(
      queryRunner,
      'reservations',
      'ck_reservations_time_range',
    );
    await this.dropConstraintIfExists(queryRunner, 'tasks', 'ck_tasks_due_range');

    for (const table of NEW_AUDIT_TRIGGER_TABLES) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS trg_audit_${table} ON "${table}"`,
      );
    }

    for (const table of [...LEGACY_RLS_TABLES, ...NEW_RLS_TABLES]) {
      await this.dropCrudPolicies(queryRunner, table);
    }

    for (const table of NEW_RLS_TABLES) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY`,
      );
    }
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_encrypt_calendar_sync_connections
      ON "calendar_sync_connections"
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_encrypt_push_device_tokens
      ON "push_device_tokens"
    `);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_encrypt_sensitive_columns()`);

    if (await this.tableHasColumn(queryRunner, 'calendar_sync_connections', 'accessTokenEncrypted')) {
      await queryRunner.query(`
        ALTER TABLE "calendar_sync_connections"
        DROP COLUMN "accessTokenEncrypted"
      `);
    }
    if (await this.tableHasColumn(queryRunner, 'calendar_sync_connections', 'refreshTokenEncrypted')) {
      await queryRunner.query(`
        ALTER TABLE "calendar_sync_connections"
        DROP COLUMN "refreshTokenEncrypted"
      `);
    }
    if (await this.tableHasColumn(queryRunner, 'push_device_tokens', 'tokenEncrypted')) {
      await queryRunner.query(`
        ALTER TABLE "push_device_tokens"
        DROP COLUMN "tokenEncrypted"
      `);
    }

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_secure_list_notification_messages(integer)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_secure_list_tasks(integer)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_decrypt_text(bytea)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_encrypt_text(text)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_get_encryption_key()`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_set_request_context(integer, integer, boolean, text, text)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_has_user_access(integer)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_request_id()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_resolve_org_id(text, jsonb, jsonb)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_try_int(text)`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_readonly') THEN
          REVOKE ALL PRIVILEGES ON SCHEMA public FROM cal3_app_readonly;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_readwrite') THEN
          REVOKE ALL PRIVILEGES ON SCHEMA public FROM cal3_app_readwrite;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_admin') THEN
          REVOKE ALL PRIVILEGES ON SCHEMA public FROM cal3_app_admin;
        END IF;
      END;
      $$;
    `);
  }

  private async enableExtensions(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'pgcrypto extension unavailable: %', SQLERRM;
      END;
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'pg_stat_statements extension unavailable: %', SQLERRM;
      END;
      $$;
    `);
  }

  private async createHelperFunctions(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_current_request_id()
      RETURNS text
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        value text;
      BEGIN
        value := current_setting('app.request_id', true);
        IF value IS NULL OR value = '' THEN
          RETURN NULL;
        END IF;
        RETURN value;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_has_user_access(p_user_id integer)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT
          app_is_super_admin()
          OR (
            app_current_user_id() IS NOT NULL
            AND p_user_id IS NOT NULL
            AND app_current_user_id() = p_user_id
          );
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_set_request_context(
        p_org_id integer,
        p_user_id integer,
        p_is_super_admin boolean DEFAULT false,
        p_request_id text DEFAULT NULL,
        p_encryption_key text DEFAULT NULL
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        PERFORM set_config('app.current_org_id', COALESCE(p_org_id, 0)::text, true);
        PERFORM set_config('app.current_user_id', COALESCE(p_user_id, 0)::text, true);
        PERFORM set_config('app.current_is_super_admin', COALESCE(p_is_super_admin, false)::text, true);
        PERFORM set_config('app.request_id', COALESCE(NULLIF(p_request_id, ''), ''), true);
        IF p_encryption_key IS NOT NULL AND p_encryption_key <> '' THEN
          PERFORM set_config('app.encryption_key', p_encryption_key, true);
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_set_tenant_context(
        p_org_id integer,
        p_user_id integer,
        p_is_super_admin boolean DEFAULT false
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        PERFORM app_set_request_context(p_org_id, p_user_id, p_is_super_admin, NULL, NULL);
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_try_int(p_value text)
      RETURNS integer
      LANGUAGE plpgsql
      IMMUTABLE
      AS $$
      BEGIN
        IF p_value IS NULL OR p_value = '' THEN
          RETURN NULL;
        END IF;
        RETURN p_value::integer;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_resolve_org_id(
        p_table text,
        p_old jsonb,
        p_new jsonb
      )
      RETURNS integer
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        value_org integer;
        value_id integer;
      BEGIN
        value_org := app_try_int(COALESCE(p_new->>'organisationId', p_old->>'organisationId'));
        IF value_org IS NOT NULL THEN
          RETURN value_org;
        END IF;

        IF p_table = 'events' THEN
          SELECT c."organisationId"
          INTO value_org
          FROM "calendars" c
          WHERE c."id" = app_try_int(COALESCE(p_new->>'calendarId', p_old->>'calendarId'));
          RETURN value_org;
        END IF;

        IF p_table = 'calendar_shares' THEN
          SELECT c."organisationId"
          INTO value_org
          FROM "calendars" c
          WHERE c."id" = app_try_int(COALESCE(p_new->>'calendarId', p_old->>'calendarId'));
          RETURN value_org;
        END IF;

        IF p_table = 'event_comments' THEN
          SELECT c."organisationId"
          INTO value_org
          FROM "events" e
          JOIN "calendars" c ON c."id" = e."calendarId"
          WHERE e."id" = app_try_int(COALESCE(p_new->>'eventId', p_old->>'eventId'));
          RETURN value_org;
        END IF;

        IF p_table = 'operating_hours' THEN
          SELECT rt."organisationId"
          INTO value_org
          FROM "resource_types" rt
          WHERE rt."id" = app_try_int(COALESCE(p_new->>'resourceTypeId', p_old->>'resourceTypeId'));
          RETURN value_org;
        END IF;

        IF p_table = 'reservation_calendar_roles' THEN
          SELECT rc."organisationId"
          INTO value_org
          FROM "reservation_calendars" rc
          WHERE rc."id" = app_try_int(COALESCE(p_new->>'reservationCalendarId', p_old->>'reservationCalendarId'));
          RETURN value_org;
        END IF;

        IF p_table = 'resources' THEN
          value_id := app_try_int(COALESCE(p_new->>'resourceTypeId', p_old->>'resourceTypeId'));
          IF value_id IS NOT NULL THEN
            SELECT rt."organisationId"
            INTO value_org
            FROM "resource_types" rt
            WHERE rt."id" = value_id;
            RETURN value_org;
          END IF;
        END IF;

        RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_get_encryption_key()
      RETURNS text
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        value text;
      BEGIN
        value := current_setting('app.encryption_key', true);
        IF value IS NULL OR value = '' THEN
          RETURN NULL;
        END IF;
        RETURN value;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_encrypt_text(p_value text)
      RETURNS bytea
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        key_value text;
      BEGIN
        IF p_value IS NULL THEN
          RETURN NULL;
        END IF;

        key_value := app_get_encryption_key();
        IF key_value IS NULL THEN
          RETURN NULL;
        END IF;

        RETURN pgp_sym_encrypt(p_value, key_value, 'cipher-algo=aes256');
      EXCEPTION
        WHEN undefined_function THEN
          RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_decrypt_text(p_value bytea)
      RETURNS text
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        key_value text;
      BEGIN
        IF p_value IS NULL THEN
          RETURN NULL;
        END IF;

        key_value := app_get_encryption_key();
        IF key_value IS NULL THEN
          RETURN NULL;
        END IF;

        RETURN pgp_sym_decrypt(p_value, key_value);
      EXCEPTION
        WHEN undefined_function THEN
          RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_write_security_audit_log()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      DECLARE
        payload_new jsonb;
        payload_old jsonb;
        org_id integer;
      BEGIN
        payload_new := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
        payload_old := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END;
        org_id := app_resolve_org_id(TG_TABLE_NAME, payload_old, payload_new);

        INSERT INTO security_audit_log (
          table_name,
          operation,
          organisation_id,
          changed_by_user_id,
          row_old,
          row_new,
          request_id
        ) VALUES (
          TG_TABLE_NAME,
          TG_OP,
          org_id,
          app_current_user_id(),
          payload_old,
          payload_new,
          app_current_request_id()
        );

        RETURN COALESCE(NEW, OLD);
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_secure_list_tasks(p_limit integer DEFAULT 100)
      RETURNS SETOF tasks
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT t.*
        FROM tasks t
        WHERE app_is_super_admin() OR app_has_user_access(t."ownerId")
        ORDER BY t."updatedAt" DESC
        LIMIT GREATEST(p_limit, 1);
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_secure_list_notification_messages(
        p_limit integer DEFAULT 100
      )
      RETURNS SETOF notification_messages
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT nm.*
        FROM notification_messages nm
        WHERE app_is_super_admin() OR app_has_user_access(nm."userId")
        ORDER BY nm."createdAt" DESC
        LIMIT GREATEST(p_limit, 1);
      $$;
    `);
  }

  private async configureRoleSeparation(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_readonly') THEN
          CREATE ROLE cal3_app_readonly NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_readwrite') THEN
          CREATE ROLE cal3_app_readwrite NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cal3_app_admin') THEN
          CREATE ROLE cal3_app_admin NOLOGIN;
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      GRANT USAGE ON SCHEMA public TO cal3_app_readonly, cal3_app_readwrite, cal3_app_admin;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO cal3_app_readonly;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cal3_app_readwrite;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cal3_app_admin;

      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cal3_app_readonly;
      GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO cal3_app_readwrite;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cal3_app_admin;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO cal3_app_readonly;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cal3_app_readwrite;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO cal3_app_admin;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cal3_app_readonly;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO cal3_app_readwrite;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO cal3_app_admin;
    `);
  }

  private async configureSensitiveColumnEncryption(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await this.tableExists(queryRunner, 'calendar_sync_connections')) {
      if (
        !(await this.tableHasColumn(
          queryRunner,
          'calendar_sync_connections',
          'accessTokenEncrypted',
        ))
      ) {
        await queryRunner.query(`
          ALTER TABLE "calendar_sync_connections"
          ADD COLUMN "accessTokenEncrypted" bytea NULL
        `);
      }
      if (
        !(await this.tableHasColumn(
          queryRunner,
          'calendar_sync_connections',
          'refreshTokenEncrypted',
        ))
      ) {
        await queryRunner.query(`
          ALTER TABLE "calendar_sync_connections"
          ADD COLUMN "refreshTokenEncrypted" bytea NULL
        `);
      }
    }

    if (await this.tableExists(queryRunner, 'push_device_tokens')) {
      if (
        !(await this.tableHasColumn(
          queryRunner,
          'push_device_tokens',
          'tokenEncrypted',
        ))
      ) {
        await queryRunner.query(`
          ALTER TABLE "push_device_tokens"
          ADD COLUMN "tokenEncrypted" bytea NULL
        `);
      }
    }

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_encrypt_sensitive_columns()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF TG_TABLE_NAME = 'calendar_sync_connections' THEN
          NEW."accessTokenEncrypted" := app_encrypt_text(NEW."accessToken");
          NEW."refreshTokenEncrypted" := app_encrypt_text(NEW."refreshToken");
        ELSIF TG_TABLE_NAME = 'push_device_tokens' THEN
          NEW."tokenEncrypted" := app_encrypt_text(NEW."token");
        END IF;
        RETURN NEW;
      END;
      $$;
    `);

    if (await this.tableExists(queryRunner, 'calendar_sync_connections')) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS trg_encrypt_calendar_sync_connections
        ON "calendar_sync_connections"
      `);
      await queryRunner.query(`
        CREATE TRIGGER trg_encrypt_calendar_sync_connections
        BEFORE INSERT OR UPDATE ON "calendar_sync_connections"
        FOR EACH ROW EXECUTE FUNCTION app_encrypt_sensitive_columns()
      `);
    }

    if (await this.tableExists(queryRunner, 'push_device_tokens')) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS trg_encrypt_push_device_tokens
        ON "push_device_tokens"
      `);
      await queryRunner.query(`
        CREATE TRIGGER trg_encrypt_push_device_tokens
        BEFORE INSERT OR UPDATE ON "push_device_tokens"
        FOR EACH ROW EXECUTE FUNCTION app_encrypt_sensitive_columns()
      `);
    }
  }

  private async enableRlsCoverage(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...LEGACY_RLS_TABLES, ...NEW_RLS_TABLES]) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }

    const directOrgExpression =
      'app_is_super_admin() OR app_has_org_access("organisationId")';
    for (const table of DIRECT_ORG_TABLES) {
      await this.applyCrudPolicies(queryRunner, table, directOrgExpression);
    }

    await this.applyCrudPolicies(
      queryRunner,
      'organisations',
      'app_is_super_admin() OR app_has_org_access("id")',
    );

    const calendarExpression = `
      app_is_super_admin()
      OR ("organisationId" IS NOT NULL AND app_has_org_access("organisationId"))
      OR (
        "organisationId" IS NULL
        AND app_current_user_id() IS NOT NULL
        AND "ownerId" = app_current_user_id()
      )
    `;
    await this.applyCrudPolicies(queryRunner, 'calendars', calendarExpression);

    const eventExpression = `
      app_is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM "calendars" c
        WHERE c."id" = "events"."calendarId"
          AND (
            (c."organisationId" IS NOT NULL AND app_has_org_access(c."organisationId"))
            OR (c."organisationId" IS NULL AND c."ownerId" = app_current_user_id())
          )
      )
    `;
    await this.applyCrudPolicies(queryRunner, 'events', eventExpression);

    const calendarSharesExpression = `
      app_is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM "calendars" c
        WHERE c."id" = "calendar_shares"."calendarId"
          AND (
            (c."organisationId" IS NOT NULL AND app_has_org_access(c."organisationId"))
            OR (c."organisationId" IS NULL AND c."ownerId" = app_current_user_id())
          )
      )
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'calendar_shares',
      calendarSharesExpression,
    );

    const operatingHoursExpression = `
      app_is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM "resource_types" rt
        WHERE rt."id" = "operating_hours"."resourceTypeId"
          AND app_has_org_access(rt."organisationId")
      )
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'operating_hours',
      operatingHoursExpression,
    );

    const reservationCalendarRoleExpression = `
      app_is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM "reservation_calendars" rc
        WHERE rc."id" = "reservation_calendar_roles"."reservationCalendarId"
          AND app_has_org_access(rc."organisationId")
      )
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'reservation_calendar_roles',
      reservationCalendarRoleExpression,
    );

    const auditEventsExpression = `
      app_is_super_admin()
      OR ("organisationId" IS NOT NULL AND app_has_org_access("organisationId"))
      OR ("organisationId" IS NULL AND "userId" IS NOT NULL AND app_has_user_access("userId"))
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'audit_events',
      auditEventsExpression,
    );

    const securityAuditExpression = `
      app_is_super_admin()
      OR (organisation_id IS NOT NULL AND app_has_org_access(organisation_id))
      OR (organisation_id IS NULL AND changed_by_user_id IS NOT NULL AND app_has_user_access(changed_by_user_id))
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'security_audit_log',
      securityAuditExpression,
    );

    for (const config of USER_OWNED_TABLES) {
      await this.applyCrudPolicies(
        queryRunner,
        config.table,
        `app_is_super_admin() OR app_has_user_access("${config.ownerColumn}")`,
      );
    }

    await this.applyCrudPolicies(
      queryRunner,
      'task_label_assignments',
      `
        app_is_super_admin()
        OR (
          EXISTS (
            SELECT 1
            FROM "tasks" t
            WHERE t."id" = "task_label_assignments"."taskId"
              AND app_has_user_access(t."ownerId")
          )
          AND EXISTS (
            SELECT 1
            FROM "task_labels" tl
            WHERE tl."id" = "task_label_assignments"."labelId"
              AND app_has_user_access(tl."userId")
          )
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'synced_calendars',
      `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "calendar_sync_connections" csc
          WHERE csc."id" = "synced_calendars"."syncConnectionId"
            AND app_has_user_access(csc."userId")
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'sync_event_mappings',
      `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "synced_calendars" sc
          JOIN "calendar_sync_connections" csc
            ON csc."id" = sc."syncConnectionId"
          WHERE sc."id" = "sync_event_mappings"."syncedCalendarId"
            AND app_has_user_access(csc."userId")
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'event_comments',
      `
        app_is_super_admin()
        OR app_has_user_access("reporterId")
        OR EXISTS (
          SELECT 1
          FROM "events" e
          JOIN "calendars" c ON c."id" = e."calendarId"
          WHERE e."id" = "event_comments"."eventId"
            AND (
              (c."organisationId" IS NOT NULL AND app_has_org_access(c."organisationId"))
              OR (c."organisationId" IS NULL AND c."ownerId" = app_current_user_id())
            )
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'automation_rules',
      `
        app_is_super_admin()
        OR app_has_user_access("createdById")
      `,
    );

    const automationScopedExpression = `
      app_is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM "automation_rules" ar
        WHERE ar."id" = "PLACEHOLDER"."ruleId"
          AND app_has_user_access(ar."createdById")
      )
    `;
    await this.applyCrudPolicies(
      queryRunner,
      'automation_conditions',
      automationScopedExpression.replace(/PLACEHOLDER/g, 'automation_conditions'),
    );
    await this.applyCrudPolicies(
      queryRunner,
      'automation_actions',
      automationScopedExpression.replace(/PLACEHOLDER/g, 'automation_actions'),
    );
    await this.applyCrudPolicies(
      queryRunner,
      'automation_audit_logs',
      automationScopedExpression.replace(/PLACEHOLDER/g, 'automation_audit_logs'),
    );

    await this.applyCrudPolicies(
      queryRunner,
      'notification_deliveries',
      `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "notification_messages" nm
          WHERE nm."id" = "notification_deliveries"."notificationId"
            AND app_has_user_access(nm."userId")
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'agent_permissions',
      `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "agent_profiles" ap
          WHERE ap."id" = "agent_permissions"."agentId"
            AND app_has_user_access(ap."userId")
        )
      `,
    );

    await this.applyCrudPolicies(
      queryRunner,
      'agent_api_keys',
      `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "agent_profiles" ap
          WHERE ap."id" = "agent_api_keys"."agentId"
            AND app_has_user_access(ap."userId")
        )
      `,
    );

    if (await this.tableExists(queryRunner, 'notification_threads')) {
      const usingExpression = `
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "notification_messages" nm
          WHERE nm."threadId" = "notification_threads"."id"
            AND app_has_user_access(nm."userId")
        )
      `;
      await this.dropCrudPolicies(queryRunner, 'notification_threads');
      await queryRunner.query(`
        CREATE POLICY rls_notification_threads_select
        ON "notification_threads"
        FOR SELECT
        USING (${usingExpression})
      `);
      await queryRunner.query(`
        CREATE POLICY rls_notification_threads_insert
        ON "notification_threads"
        FOR INSERT
        WITH CHECK (app_is_super_admin() OR app_current_user_id() IS NOT NULL)
      `);
      await queryRunner.query(`
        CREATE POLICY rls_notification_threads_update
        ON "notification_threads"
        FOR UPDATE
        USING (${usingExpression})
        WITH CHECK (${usingExpression})
      `);
      await queryRunner.query(`
        CREATE POLICY rls_notification_threads_delete
        ON "notification_threads"
        FOR DELETE
        USING (${usingExpression})
      `);
    }
  }

  private async configureAuditTriggerCoverage(
    queryRunner: QueryRunner,
  ): Promise<void> {
    for (const table of NEW_AUDIT_TRIGGER_TABLES) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS trg_audit_${table} ON "${table}"`,
      );
      await queryRunner.query(`
        CREATE TRIGGER trg_audit_${table}
        AFTER INSERT OR UPDATE OR DELETE ON "${table}"
        FOR EACH ROW EXECUTE FUNCTION app_write_security_audit_log()
      `);
    }
  }

  private async createIntegrityConstraints(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await this.tableExists(queryRunner, 'tasks')) {
      await this.addCheckConstraintIfMissing(
        queryRunner,
        'tasks',
        'ck_tasks_due_range',
        `"dueEnd" IS NULL OR "dueDate" IS NULL OR "dueEnd" >= "dueDate"`,
      );
    }

    if (await this.tableExists(queryRunner, 'reservations')) {
      await this.addCheckConstraintIfMissing(
        queryRunner,
        'reservations',
        'ck_reservations_time_range',
        `"endTime" > "startTime"`,
      );
    }

    if (await this.tableExists(queryRunner, 'notification_deliveries')) {
      await this.addCheckConstraintIfMissing(
        queryRunner,
        'notification_deliveries',
        'ck_notification_deliveries_attempt_count_non_negative',
        `"attemptCount" >= 0`,
      );
    }

    if (await this.tableExists(queryRunner, 'security_audit_log')) {
      await this.addCheckConstraintIfMissing(
        queryRunner,
        'security_audit_log',
        'ck_security_audit_log_operation',
        `operation IN ('INSERT', 'UPDATE', 'DELETE')`,
      );
    }

    if (await this.tableExists(queryRunner, 'user_notification_preferences')) {
      await queryRunner.query(`
        DELETE FROM "user_notification_preferences" a
        USING "user_notification_preferences" b
        WHERE a."id" < b."id"
          AND a."userId" = b."userId"
          AND a."eventType" = b."eventType"
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_user_notification_preferences_user_event
        ON "user_notification_preferences" ("userId", "eventType")
      `);
    }

    if (await this.tableExists(queryRunner, 'notification_scope_mutes')) {
      await queryRunner.query(`
        DELETE FROM "notification_scope_mutes" a
        USING "notification_scope_mutes" b
        WHERE a."id" < b."id"
          AND a."userId" = b."userId"
          AND a."scopeType" = b."scopeType"
          AND a."scopeId" = b."scopeId"
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_notification_scope_mutes_user_scope
        ON "notification_scope_mutes" ("userId", "scopeType", "scopeId")
      `);
    }
  }

  private async createPerformanceIndexes(queryRunner: QueryRunner): Promise<void> {
    for (const statement of PERFORMANCE_INDEXES) {
      await queryRunner.query(statement);
    }
  }

  private async createMaterializedViews(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.reporting_org_daily_reservation_stats') IS NULL THEN
          EXECUTE '
            CREATE MATERIALIZED VIEW reporting_org_daily_reservation_stats AS
            SELECT
              r."organisationId"::int AS organisation_id,
              date_trunc(''day'', r."startTime")::date AS day_bucket,
              COUNT(*)::bigint AS total_reservations,
              COUNT(*) FILTER (WHERE r.status = ''confirmed'')::bigint AS confirmed_reservations,
              COUNT(*) FILTER (WHERE r.status = ''cancelled'')::bigint AS cancelled_reservations,
              COUNT(DISTINCT r."resourceId")::bigint AS distinct_resources
            FROM "reservations" r
            WHERE r."organisationId" IS NOT NULL
            GROUP BY r."organisationId", date_trunc(''day'', r."startTime")::date
          ';
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_reporting_org_daily_reservation_stats
      ON reporting_org_daily_reservation_stats (organisation_id, day_bucket)
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.reporting_user_task_status_summary') IS NULL THEN
          EXECUTE '
            CREATE MATERIALIZED VIEW reporting_user_task_status_summary AS
            SELECT
              t."ownerId"::int AS owner_id,
              t.status::text AS status,
              COUNT(*)::bigint AS task_count,
              COUNT(*) FILTER (
                WHERE t."dueDate" IS NOT NULL
                  AND t."dueDate" < now()
                  AND t.status <> ''done''
              )::bigint AS overdue_count
            FROM "tasks" t
            GROUP BY t."ownerId", t.status
          ';
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_reporting_user_task_status_summary
      ON reporting_user_task_status_summary (owner_id, status)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_refresh_reporting_views(
        p_concurrently boolean DEFAULT true
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF p_concurrently THEN
          REFRESH MATERIALIZED VIEW CONCURRENTLY reporting_org_daily_reservation_stats;
          REFRESH MATERIALIZED VIEW CONCURRENTLY reporting_user_task_status_summary;
        ELSE
          REFRESH MATERIALIZED VIEW reporting_org_daily_reservation_stats;
          REFRESH MATERIALIZED VIEW reporting_user_task_status_summary;
        END IF;
      END;
      $$;
    `);
  }

  private async createQueryPerformanceObjects(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS query_performance_snapshots (
        id bigserial PRIMARY KEY,
        captured_at timestamptz NOT NULL DEFAULT now(),
        query_id text NOT NULL,
        calls bigint NOT NULL,
        total_exec_time_ms numeric(14, 3) NOT NULL,
        mean_exec_time_ms numeric(14, 3) NOT NULL,
        rows_returned bigint NOT NULL,
        query_sample text NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_query_performance_snapshots_captured
      ON query_performance_snapshots (captured_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_query_performance_snapshots_mean_exec
      ON query_performance_snapshots (mean_exec_time_ms DESC)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_capture_query_performance(
        p_limit integer DEFAULT 50
      )
      RETURNS integer
      LANGUAGE plpgsql
      AS $$
      DECLARE
        inserted_count integer := 0;
      BEGIN
        IF to_regclass('public.pg_stat_statements') IS NULL THEN
          RETURN 0;
        END IF;

        INSERT INTO query_performance_snapshots (
          query_id,
          calls,
          total_exec_time_ms,
          mean_exec_time_ms,
          rows_returned,
          query_sample
        )
        SELECT
          pgss.queryid::text,
          pgss.calls,
          pgss.total_exec_time,
          pgss.mean_exec_time,
          pgss.rows,
          left(regexp_replace(pgss.query, '\\s+', ' ', 'g'), 1200)
        FROM pg_stat_statements pgss
        ORDER BY pgss.mean_exec_time DESC
        LIMIT GREATEST(p_limit, 1);

        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RETURN inserted_count;
      END;
      $$;
    `);
  }

  private async applyCrudPolicies(
    queryRunner: QueryRunner,
    tableName: string,
    usingExpression: string,
    withCheckExpression?: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, tableName))) {
      return;
    }

    const checkExpression = withCheckExpression ?? usingExpression;
    await this.dropCrudPolicies(queryRunner, tableName);

    await queryRunner.query(`
      CREATE POLICY rls_${tableName}_select
      ON "${tableName}"
      FOR SELECT
      USING (${usingExpression})
    `);
    await queryRunner.query(`
      CREATE POLICY rls_${tableName}_insert
      ON "${tableName}"
      FOR INSERT
      WITH CHECK (${checkExpression})
    `);
    await queryRunner.query(`
      CREATE POLICY rls_${tableName}_update
      ON "${tableName}"
      FOR UPDATE
      USING (${usingExpression})
      WITH CHECK (${checkExpression})
    `);
    await queryRunner.query(`
      CREATE POLICY rls_${tableName}_delete
      ON "${tableName}"
      FOR DELETE
      USING (${usingExpression})
    `);
  }

  private async dropCrudPolicies(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, tableName))) {
      return;
    }
    await queryRunner.query(`
      DROP POLICY IF EXISTS rls_${tableName}_select ON "${tableName}"
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS rls_${tableName}_insert ON "${tableName}"
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS rls_${tableName}_update ON "${tableName}"
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS rls_${tableName}_delete ON "${tableName}"
    `);
  }

  private async addCheckConstraintIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
    predicate: string,
  ): Promise<void> {
    if (await this.constraintExists(queryRunner, tableName, constraintName)) {
      return;
    }
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ADD CONSTRAINT ${constraintName}
      CHECK (${predicate}) NOT VALID
    `);
  }

  private async dropConstraintIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, tableName))) {
      return;
    }
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      DROP CONSTRAINT IF EXISTS ${constraintName}
    `);
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    indexName: string,
  ): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "${indexName}"`);
  }

  private async safeDropMaterializedView(
    queryRunner: QueryRunner,
    viewName: string,
  ): Promise<void> {
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "${viewName}"`);
  }

  private async safeDropTable(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "${tableName}"`);
  }

  private async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT to_regclass($1) AS table_name`,
      [`public.${tableName}`],
    )) as Array<{ table_name: string | null }>;
    return Boolean(rows?.[0]?.table_name);
  }

  private async tableHasColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1
      `,
      [tableName, columnName],
    )) as Array<{ '?column?': number }>;
    return rows.length > 0;
  }

  private async constraintExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = $1
        AND constraint_name = $2
      LIMIT 1
      `,
      [tableName, constraintName],
    )) as Array<{ '?column?': number }>;
    return rows.length > 0;
  }

  private isPostgres(queryRunner: QueryRunner): boolean {
    return (
      queryRunner.connection.options.type === 'postgres' ||
      queryRunner.connection.options.type === 'aurora-postgres'
    );
  }
}
