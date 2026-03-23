import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAutomationScheduledTriggers1736100000000
  implements MigrationInterface
{
  name = 'CreateAutomationScheduledTriggers1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres =
      queryRunner.connection.driver.options.type === 'postgres';
    const timestampType = isPostgres ? 'timestamptz' : 'datetime';

    await queryRunner.createTable(
      new Table({
        name: 'automation_scheduled_triggers',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ruleId',
            type: 'int',
          },
          {
            name: 'eventId',
            type: 'int',
          },
          {
            name: 'occurrenceId',
            type: 'varchar',
            length: '255',
            default: "''",
          },
          {
            name: 'scheduledAt',
            type: timestampType,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'scheduled'",
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'firedAt',
            type: timestampType,
            isNullable: true,
          },
          {
            name: 'cancelledAt',
            type: timestampType,
            isNullable: true,
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: timestampType,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: timestampType,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'automation_scheduled_triggers',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'automation_scheduled_triggers',
      new TableForeignKey({
        columnNames: ['eventId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'automation_scheduled_triggers',
      new TableIndex({
        name: 'idx_automation_scheduled_triggers_status_scheduledAt',
        columnNames: ['status', 'scheduledAt'],
      }),
    );

    await queryRunner.createIndex(
      'automation_scheduled_triggers',
      new TableIndex({
        name: 'idx_automation_scheduled_triggers_event_rule',
        columnNames: ['eventId', 'ruleId'],
      }),
    );

    await queryRunner.createIndex(
      'automation_scheduled_triggers',
      new TableIndex({
        name: 'uq_automation_scheduled_triggers_rule_event_occurrence',
        columnNames: ['ruleId', 'eventId', 'occurrenceId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'automation_scheduled_triggers',
      'uq_automation_scheduled_triggers_rule_event_occurrence',
    );
    await queryRunner.dropIndex(
      'automation_scheduled_triggers',
      'idx_automation_scheduled_triggers_event_rule',
    );
    await queryRunner.dropIndex(
      'automation_scheduled_triggers',
      'idx_automation_scheduled_triggers_status_scheduledAt',
    );
    await queryRunner.dropTable('automation_scheduled_triggers');
  }
}
