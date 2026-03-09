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

const AUDITED_TENANT_TABLES = [
  'organisations',
  'calendars',
  'events',
  'calendar_shares',
  'operating_hours',
  'reservation_calendar_roles',
  ...DIRECT_ORG_TABLES,
] as const;

export class EnableTenantRlsAndAudit1734300000000
  implements MigrationInterface
{
  name = 'EnableTenantRlsAndAudit1734300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_current_org_id()
      RETURNS integer
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        value text;
      BEGIN
        value := current_setting('app.current_org_id', true);
        IF value IS NULL OR value = '' OR value = '0' THEN
          RETURN NULL;
        END IF;
        RETURN value::integer;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_current_user_id()
      RETURNS integer
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        value text;
      BEGIN
        value := current_setting('app.current_user_id', true);
        IF value IS NULL OR value = '' OR value = '0' THEN
          RETURN NULL;
        END IF;
        RETURN value::integer;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_is_super_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT COALESCE(current_setting('app.current_is_super_admin', true), 'false')::boolean;
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
        PERFORM set_config('app.current_org_id', COALESCE(p_org_id, 0)::text, true);
        PERFORM set_config('app.current_user_id', COALESCE(p_user_id, 0)::text, true);
        PERFORM set_config('app.current_is_super_admin', COALESCE(p_is_super_admin, false)::text, true);
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_has_org_access(p_org_id integer)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      AS $$
        SELECT
          app_is_super_admin()
          OR (
            app_current_org_id() IS NOT NULL
            AND p_org_id IS NOT NULL
            AND app_current_org_id() = p_org_id
          );
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS security_audit_log (
        id bigserial PRIMARY KEY,
        table_name text NOT NULL,
        operation text NOT NULL,
        organisation_id integer NULL,
        changed_by_user_id integer NULL,
        row_old jsonb NULL,
        row_new jsonb NULL,
        request_id text NULL,
        txid bigint NOT NULL DEFAULT txid_current(),
        changed_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_security_audit_log_org_time
      ON security_audit_log (organisation_id, changed_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_time
      ON security_audit_log (table_name, changed_at DESC)
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
        org_id := NULL;

        IF payload_new IS NOT NULL AND payload_new ? 'organisationId' THEN
          org_id := NULLIF(payload_new->>'organisationId', '')::integer;
        ELSIF payload_old IS NOT NULL AND payload_old ? 'organisationId' THEN
          org_id := NULLIF(payload_old->>'organisationId', '')::integer;
        END IF;

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
          current_setting('app.request_id', true)
        );

        RETURN COALESCE(NEW, OLD);
      END;
      $$;
    `);

    for (const table of DIRECT_ORG_TABLES) {
      await this.enableRlsOnTable(queryRunner, table);
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_tenant_policy ON "${table}"`,
      );
      await queryRunner.query(`
        CREATE POLICY ${table}_tenant_policy ON "${table}"
        FOR ALL
        USING (app_has_org_access("organisationId"))
        WITH CHECK (app_has_org_access("organisationId"))
      `);
    }

    await this.enableRlsOnTable(queryRunner, 'organisations');
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_tenant_policy ON "organisations"`,
    );
    await queryRunner.query(`
      CREATE POLICY organisations_tenant_policy ON "organisations"
      FOR ALL
      USING (app_has_org_access("id"))
      WITH CHECK (app_has_org_access("id"))
    `);

    await this.enableRlsOnTable(queryRunner, 'calendars');
    await queryRunner.query(
      `DROP POLICY IF EXISTS calendars_tenant_policy ON "calendars"`,
    );
    await queryRunner.query(`
      CREATE POLICY calendars_tenant_policy ON "calendars"
      FOR ALL
      USING (
        app_is_super_admin()
        OR ("organisationId" IS NOT NULL AND app_has_org_access("organisationId"))
        OR (
          "organisationId" IS NULL
          AND app_current_user_id() IS NOT NULL
          AND "ownerId" = app_current_user_id()
        )
      )
      WITH CHECK (
        app_is_super_admin()
        OR ("organisationId" IS NOT NULL AND app_has_org_access("organisationId"))
        OR (
          "organisationId" IS NULL
          AND app_current_user_id() IS NOT NULL
          AND "ownerId" = app_current_user_id()
        )
      )
    `);

    await this.enableRlsOnTable(queryRunner, 'events');
    await queryRunner.query(`DROP POLICY IF EXISTS events_tenant_policy ON "events"`);
    await queryRunner.query(`
      CREATE POLICY events_tenant_policy ON "events"
      FOR ALL
      USING (
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
      )
      WITH CHECK (
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
      )
    `);

    await this.enableRlsOnTable(queryRunner, 'calendar_shares');
    await queryRunner.query(
      `DROP POLICY IF EXISTS calendar_shares_tenant_policy ON "calendar_shares"`,
    );
    await queryRunner.query(`
      CREATE POLICY calendar_shares_tenant_policy ON "calendar_shares"
      FOR ALL
      USING (
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
      )
      WITH CHECK (
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
      )
    `);

    await this.enableRlsOnTable(queryRunner, 'operating_hours');
    await queryRunner.query(
      `DROP POLICY IF EXISTS operating_hours_tenant_policy ON "operating_hours"`,
    );
    await queryRunner.query(`
      CREATE POLICY operating_hours_tenant_policy ON "operating_hours"
      FOR ALL
      USING (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "resource_types" rt
          WHERE rt."id" = "operating_hours"."resourceTypeId"
            AND app_has_org_access(rt."organisationId")
        )
      )
      WITH CHECK (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "resource_types" rt
          WHERE rt."id" = "operating_hours"."resourceTypeId"
            AND app_has_org_access(rt."organisationId")
        )
      )
    `);

    await this.enableRlsOnTable(queryRunner, 'reservation_calendar_roles');
    await queryRunner.query(`
      DROP POLICY IF EXISTS reservation_calendar_roles_tenant_policy ON "reservation_calendar_roles"
    `);
    await queryRunner.query(`
      CREATE POLICY reservation_calendar_roles_tenant_policy ON "reservation_calendar_roles"
      FOR ALL
      USING (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "reservation_calendars" rc
          WHERE rc."id" = "reservation_calendar_roles"."reservationCalendarId"
            AND app_has_org_access(rc."organisationId")
        )
      )
      WITH CHECK (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1
          FROM "reservation_calendars" rc
          WHERE rc."id" = "reservation_calendar_roles"."reservationCalendarId"
            AND app_has_org_access(rc."organisationId")
        )
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_secure_list_reservations(p_limit integer DEFAULT 100)
      RETURNS SETOF reservations
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT r.*
        FROM reservations r
        WHERE app_is_super_admin() OR app_has_org_access(r."organisationId")
        ORDER BY r."createdAt" DESC
        LIMIT GREATEST(p_limit, 1);
      $$;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_secure_list_resources(p_limit integer DEFAULT 100)
      RETURNS SETOF resources
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT r.*
        FROM resources r
        WHERE app_is_super_admin() OR app_has_org_access(r."organisationId")
        ORDER BY r."createdAt" DESC
        LIMIT GREATEST(p_limit, 1);
      $$;
    `);

    for (const table of AUDITED_TENANT_TABLES) {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    for (const table of AUDITED_TENANT_TABLES) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS trg_audit_${table} ON "${table}"`,
      );
    }

    await queryRunner.query(
      `DROP POLICY IF EXISTS reservation_calendar_roles_tenant_policy ON "reservation_calendar_roles"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS operating_hours_tenant_policy ON "operating_hours"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS calendar_shares_tenant_policy ON "calendar_shares"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS events_tenant_policy ON "events"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS calendars_tenant_policy ON "calendars"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_tenant_policy ON "organisations"`,
    );
    for (const table of DIRECT_ORG_TABLES) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_tenant_policy ON "${table}"`,
      );
    }

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_secure_list_resources(integer)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_secure_list_reservations(integer)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_write_security_audit_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS security_audit_log`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_has_org_access(integer)`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_set_tenant_context(integer, integer, boolean)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_is_super_admin()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_user_id()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_org_id()`);
  }

  private async enableRlsOnTable(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY`);
  }

  private isPostgres(queryRunner: QueryRunner): boolean {
    return (
      queryRunner.connection.options.type === 'postgres' ||
      queryRunner.connection.options.type === 'aurora-postgres'
    );
  }
}
