import { Client } from 'pg';

interface HotspotQuery {
  name: string;
  sql: string;
  params: unknown[];
}

const QUERIES: HotspotQuery[] = [
  {
    name: 'events_by_calendar_date_window',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT e.*
      FROM events e
      WHERE e."calendarId" = $1
        AND e."startDate" BETWEEN $2::date AND $3::date
      ORDER BY e."startDate", e."startTime"
      LIMIT 100
    `,
    params: [1, '2026-01-01', '2026-12-31'],
  },
  {
    name: 'reservations_by_org_window',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT r.*
      FROM reservations r
      WHERE r."organisationId" = $1
        AND r."startTime" >= $2::timestamptz
        AND r."startTime" < $3::timestamptz
      ORDER BY r."startTime"
      LIMIT 200
    `,
    params: [1, '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'],
  },
  {
    name: 'tasks_by_owner_status_due_date',
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT t.*
      FROM tasks t
      WHERE t."ownerId" = $1
        AND t.status = $2
      ORDER BY t."dueDate" NULLS LAST, t."createdAt" DESC
      LIMIT 200
    `,
    params: [1, 'todo'],
  },
];

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

const readPlanMetrics = (planJson: unknown): Record<string, unknown> => {
  const root = Array.isArray(planJson) ? planJson[0] : null;
  const plan = root && typeof root === 'object' ? (root as Record<string, unknown>)['Plan'] : null;
  const top = plan && typeof plan === 'object' ? (plan as Record<string, unknown>) : null;

  return {
    nodeType: top?.['Node Type'] ?? 'unknown',
    startupCost: top?.['Startup Cost'] ?? null,
    totalCost: top?.['Total Cost'] ?? null,
    planRows: top?.['Plan Rows'] ?? null,
    actualRows: top?.['Actual Rows'] ?? null,
    actualTotalTime: top?.['Actual Total Time'] ?? null,
    sharedHitBlocks: top?.['Shared Hit Blocks'] ?? null,
    sharedReadBlocks: top?.['Shared Read Blocks'] ?? null,
  };
};

const main = async (): Promise<void> => {
  const client = buildClient();
  await client.connect();

  try {
    console.log('Query execution plan report');
    console.log('---------------------------');
    for (const query of QUERIES) {
      const result = await client.query<{ 'QUERY PLAN': unknown }>(
        query.sql,
        query.params,
      );
      const planJson = result.rows[0]?.['QUERY PLAN'];
      const metrics = readPlanMetrics(planJson);
      console.log(`\n${query.name}`);
      console.log(JSON.stringify(metrics, null, 2));
    }
  } finally {
    await client.end();
  }
};

void main().catch((error) => {
  console.error('Explain script failed:', error);
  process.exit(1);
});

