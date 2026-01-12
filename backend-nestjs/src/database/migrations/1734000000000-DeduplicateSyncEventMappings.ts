import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateSyncEventMappings1734000000000
  implements MigrationInterface
{
  name = 'DeduplicateSyncEventMappings1734000000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          m.id AS mapping_id,
          m."localEventId" AS "localEventId",
          ROW_NUMBER() OVER (
            PARTITION BY m."syncedCalendarId", m."externalEventId"
            ORDER BY
              CASE
                WHEN e.title IS NULL OR e.title = 'Untitled Event' THEN 1
                ELSE 0
              END,
              e."updatedAt" DESC NULLS LAST,
              e."createdAt" DESC NULLS LAST,
              m.id DESC
          ) AS rn
        FROM "sync_event_mappings" m
        LEFT JOIN "events" e ON e.id = m."localEventId"
      ),
      to_remove AS (
        SELECT mapping_id, "localEventId"
        FROM ranked
        WHERE rn > 1
      )
      DELETE FROM "events"
      WHERE id IN (SELECT "localEventId" FROM to_remove);
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          m.id AS mapping_id,
          ROW_NUMBER() OVER (
            PARTITION BY m."syncedCalendarId", m."externalEventId"
            ORDER BY
              CASE
                WHEN e.title IS NULL OR e.title = 'Untitled Event' THEN 1
                ELSE 0
              END,
              e."updatedAt" DESC NULLS LAST,
              e."createdAt" DESC NULLS LAST,
              m.id DESC
          ) AS rn
        FROM "sync_event_mappings" m
        LEFT JOIN "events" e ON e.id = m."localEventId"
      )
      DELETE FROM "sync_event_mappings"
      WHERE id IN (SELECT mapping_id FROM ranked WHERE rn > 1);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sync_event_mappings_unique"
      ON "sync_event_mappings" ("syncedCalendarId", "externalEventId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_sync_event_mappings_unique";',
    );
  }
}
