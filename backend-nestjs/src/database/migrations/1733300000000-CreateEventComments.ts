import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventComments1733300000000 implements MigrationInterface {
  name = 'CreateEventComments1733300000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      // SQLite/local dev uses synchronize=true
      return;
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_comments" (
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
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_comments_event" ON "event_comments" ("eventId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_comments_parent" ON "event_comments" ("parentCommentId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_comments_reporter" ON "event_comments" ("reporterId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_comments_flagged" ON "event_comments" ("isFlagged") WHERE "isFlagged" = true;
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comments"
      ADD CONSTRAINT "FK_event_comments_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "event_comments"
      ADD CONSTRAINT "FK_event_comments_reporter" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "event_comments"
      ADD CONSTRAINT "FK_event_comments_parent" FOREIGN KEY ("parentCommentId") REFERENCES "event_comments"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_parent";
    `);
    await queryRunner.query(`
      ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_reporter";
    `);
    await queryRunner.query(`
      ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_event";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_comments";`);
  }
}
