import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTables1731400000000 implements MigrationInterface {
  name = 'CreateTasksTables1731400000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      // Local dev often runs SQLite with synchronize=true, so skip structural migration there.
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "calendars"
      ADD COLUMN IF NOT EXISTS "isTasksCalendar" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "defaultTasksCalendarId" integer;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "tasksSettings" jsonb;
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "taskId" integer;
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "taskSyncedAt" timestamptz;
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "taskSyncChecksum" varchar(64);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "ownerId" integer NOT NULL,
        "title" varchar(240) NOT NULL,
        "body" text,
        "bodyFormat" varchar(20) NOT NULL DEFAULT 'markdown',
        "color" varchar(7) NOT NULL DEFAULT '#eab308',
        "priority" varchar(16) NOT NULL DEFAULT 'medium',
        "status" varchar(16) NOT NULL DEFAULT 'todo',
        "place" varchar(255),
        "dueDate" timestamptz,
        "dueEnd" timestamptz,
        "dueTimezone" varchar(100),
        "assigneeId" integer,
        "calendarEventId" integer,
        "lastSyncedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "CHK_tasks_priority" CHECK ("priority" IN ('high','medium','low')),
        CONSTRAINT "CHK_tasks_status" CHECK ("status" IN ('todo','in_progress','done'))
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "task_labels" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(64) NOT NULL,
        "color" varchar(7) NOT NULL DEFAULT '#3b82f6',
        "userId" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "task_label_assignments" (
        "taskId" integer NOT NULL,
        "labelId" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_task_label_assignments" PRIMARY KEY ("taskId","labelId")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tasks_owner" ON "tasks" ("ownerId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tasks_dueDate" ON "tasks" ("dueDate");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tasks_calendar_event" ON "tasks" ("calendarEventId") WHERE "calendarEventId" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_task_labels_user" ON "task_labels" ("userId");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_calendars_owner_tasks" ON "calendars" ("ownerId") WHERE "isTasksCalendar" = true;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_calendar_event" FOREIGN KEY ("calendarEventId") REFERENCES "events"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "task_labels"
      ADD CONSTRAINT "FK_task_labels_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "task_label_assignments"
      ADD CONSTRAINT "FK_task_label_assignments_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "task_label_assignments"
      ADD CONSTRAINT "FK_task_label_assignments_label" FOREIGN KEY ("labelId") REFERENCES "task_labels"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
      ON DELETE SET NULL
      DEFERRABLE INITIALLY IMMEDIATE;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_default_tasks_calendar" FOREIGN KEY ("defaultTasksCalendarId") REFERENCES "calendars"("id")
      ON DELETE SET NULL
      DEFERRABLE INITIALLY IMMEDIATE;
    `);

    await queryRunner.query(`
      INSERT INTO "calendars" (
        "name",
        "description",
        "color",
        "icon",
        "visibility",
        "isActive",
        "isReservationCalendar",
        "isTasksCalendar",
        "organisationId",
        "ownerId",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'Tasks',
        NULL,
        '#eab308',
        'brain',
        'private',
        true,
        false,
        true,
        NULL,
        u."id",
        NOW(),
        NOW()
      FROM "users" u
      WHERE NOT EXISTS (
        SELECT 1
        FROM "calendars" c
        WHERE c."ownerId" = u."id"
          AND c."isTasksCalendar" = true
      );
    `);

    await queryRunner.query(`
      WITH tasks_calendars AS (
        SELECT c."id", c."ownerId"
        FROM "calendars" c
        WHERE c."isTasksCalendar" = true
      )
      UPDATE "users" u
      SET "defaultTasksCalendarId" = tc."id"
      FROM tasks_calendars tc
      WHERE tc."ownerId" = u."id";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_default_tasks_calendar";
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_task";
    `);
    await queryRunner.query(`
      ALTER TABLE "task_label_assignments" DROP CONSTRAINT IF EXISTS "FK_task_label_assignments_label";
    `);
    await queryRunner.query(`
      ALTER TABLE "task_label_assignments" DROP CONSTRAINT IF EXISTS "FK_task_label_assignments_task";
    `);
    await queryRunner.query(`
      ALTER TABLE "task_labels" DROP CONSTRAINT IF EXISTS "FK_task_labels_user";
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_calendar_event";
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_assignee";
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_owner";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "task_label_assignments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task_labels";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks";`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_calendars_owner_tasks";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_labels_user";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_calendar_event";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_dueDate";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_owner";`);

    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "taskSyncChecksum";
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "taskSyncedAt";
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "taskId";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "tasksSettings";
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "defaultTasksCalendarId";
    `);

    await queryRunner.query(`
      ALTER TABLE "calendars" DROP COLUMN IF EXISTS "isTasksCalendar";
    `);
  }
}
