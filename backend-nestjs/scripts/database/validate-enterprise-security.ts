import { Client } from 'pg';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const REQUIRED_RLS_TABLES = [
  'audit_events',
  'api_keys',
  'auth_refresh_tokens',
  'tasks',
  'task_labels',
  'task_label_assignments',
  'automation_rules',
  'automation_conditions',
  'automation_actions',
  'automation_audit_logs',
  'notification_messages',
  'notification_deliveries',
  'agent_profiles',
  'agent_permissions',
  'agent_api_keys',
  'security_audit_log',
] as const;

const REQUIRED_FUNCTIONS = [
  'app_set_request_context',
  'app_has_user_access',
  'app_capture_query_performance',
  'app_refresh_reporting_views',
] as const;

const REQUIRED_MATERIALIZED_VIEWS = [
  'reporting_org_daily_reservation_stats',
  'reporting_user_task_status_summary',
] as const;

const REQUIRED_AUDIT_TRIGGERS = [
  'trg_audit_api_keys',
  'trg_audit_tasks',
  'trg_audit_task_labels',
  'trg_audit_notification_messages',
  'trg_audit_agent_profiles',
] as const;

const buildClient = (): Client =>
  new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'cal3',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : undefined,
  });

const main = async (): Promise<void> => {
  const client = buildClient();
  const results: CheckResult[] = [];

  await client.connect();

  try {
    for (const tableName of REQUIRED_RLS_TABLES) {
      const rlsRow = await client.query<{
        relrowsecurity: boolean;
        relforcerowsecurity: boolean;
      }>(
        `
        SELECT c.relrowsecurity, c.relforcerowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = $1
          AND c.relkind = 'r'
        `,
        [tableName],
      );

      if (rlsRow.rows.length === 0) {
        results.push({
          name: `RLS table ${tableName}`,
          ok: false,
          detail: 'Table missing',
        });
        continue;
      }

      const row = rlsRow.rows[0];
      const policyRows = await client.query<{ count: string }>(
        `
        SELECT COUNT(*)::text AS count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = $1
          AND policyname LIKE 'rls_%'
        `,
        [tableName],
      );

      const policyCount = Number.parseInt(policyRows.rows[0]?.count || '0', 10);
      const ok = Boolean(row.relrowsecurity && row.relforcerowsecurity && policyCount >= 4);
      results.push({
        name: `RLS table ${tableName}`,
        ok,
        detail: `enabled=${row.relrowsecurity} forced=${row.relforcerowsecurity} policies=${policyCount}`,
      });
    }

    for (const fnName of REQUIRED_FUNCTIONS) {
      const fnRow = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public'
            AND p.proname = $1
        ) AS exists
        `,
        [fnName],
      );
      const ok = Boolean(fnRow.rows[0]?.exists);
      results.push({
        name: `Function ${fnName}`,
        ok,
        detail: ok ? 'present' : 'missing',
      });
    }

    for (const viewName of REQUIRED_MATERIALIZED_VIEWS) {
      const viewRow = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM pg_matviews
          WHERE schemaname = 'public'
            AND matviewname = $1
        ) AS exists
        `,
        [viewName],
      );
      const ok = Boolean(viewRow.rows[0]?.exists);
      results.push({
        name: `Materialized view ${viewName}`,
        ok,
        detail: ok ? 'present' : 'missing',
      });
    }

    for (const triggerName of REQUIRED_AUDIT_TRIGGERS) {
      const triggerRow = await client.query<{ exists: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.triggers
          WHERE trigger_schema = 'public'
            AND trigger_name = $1
        ) AS exists
        `,
        [triggerName],
      );
      const ok = Boolean(triggerRow.rows[0]?.exists);
      results.push({
        name: `Trigger ${triggerName}`,
        ok,
        detail: ok ? 'present' : 'missing',
      });
    }
  } finally {
    await client.end();
  }

  let failed = 0;
  console.log('Enterprise DB security validation');
  console.log('--------------------------------');
  for (const result of results) {
    if (!result.ok) {
      failed += 1;
    }
    console.log(`${result.ok ? 'OK' : 'FAIL'} - ${result.name} (${result.detail})`);
  }

  if (failed > 0) {
    console.error(`Validation failed: ${failed} checks failed.`);
    process.exit(1);
  }

  console.log('Validation passed.');
};

void main().catch((error) => {
  console.error('Validation script failed:', error);
  process.exit(1);
});

