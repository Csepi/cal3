const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '192.168.1.101',
    port: 5433,
    user: 'db_admin',
    password: 'Enter.Enter',
    database: 'cal3',
    ssl: false,
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "event_comments" (
        "id" SERIAL PRIMARY KEY,
        "eventId" integer NOT NULL,
        "reporterId" integer NOT NULL,
        "parentCommentId" integer,
        "templateKey" varchar(50),
        "content" text NOT NULL,
        "isFlagged" boolean NOT NULL DEFAULT false,
        "flaggedById" integer,
        "flaggedAt" timestamptz,
        "context" varchar(32) NOT NULL DEFAULT 'comment',
        "visibility" varchar(16) NOT NULL DEFAULT 'private',
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      );`,
    `CREATE INDEX IF NOT EXISTS "IDX_event_comments_event" ON "event_comments" ("eventId");`,
    `CREATE INDEX IF NOT EXISTS "IDX_event_comments_parent" ON "event_comments" ("parentCommentId");`,
    `CREATE INDEX IF NOT EXISTS "IDX_event_comments_reporter" ON "event_comments" ("reporterId");`,
    `CREATE INDEX IF NOT EXISTS "IDX_event_comments_flagged" ON "event_comments" ("isFlagged") WHERE "isFlagged" = true;`,
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_event_comments_event') THEN
         ALTER TABLE "event_comments"
         ADD CONSTRAINT "FK_event_comments_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_event_comments_reporter') THEN
         ALTER TABLE "event_comments"
         ADD CONSTRAINT "FK_event_comments_reporter" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_event_comments_parent') THEN
         ALTER TABLE "event_comments"
         ADD CONSTRAINT "FK_event_comments_parent" FOREIGN KEY ("parentCommentId") REFERENCES "event_comments"("id") ON DELETE CASCADE;
       END IF;
     END
     $$;`
  ];

  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('BEGIN');
    for (const sql of statements) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('event_comments table ensured successfully');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
