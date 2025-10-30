import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAutomationTables1730905200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create automation_rules table
    await queryRunner.createTable(
      new Table({
        name: 'automation_rules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'triggerType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'triggerConfig',
            type:
              queryRunner.connection.driver.options.type === 'postgres'
                ? 'json'
                : 'text',
            isNullable: true,
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'conditionLogic',
            type: 'varchar',
            length: '10',
            default: "'AND'",
          },
          {
            name: 'lastExecutedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'executionCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdById',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'automation_rules',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // 2. Create automation_conditions table
    await queryRunner.createTable(
      new Table({
        name: 'automation_conditions',
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
            name: 'field',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'operator',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'groupId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'logicOperator',
            type: 'varchar',
            length: '10',
            default: "'AND'",
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'automation_conditions',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      }),
    );

    // 3. Create automation_actions table
    await queryRunner.createTable(
      new Table({
        name: 'automation_actions',
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
            name: 'actionType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'actionConfig',
            type:
              queryRunner.connection.driver.options.type === 'postgres'
                ? 'json'
                : 'text',
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'automation_actions',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      }),
    );

    // 4. Create automation_audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'automation_audit_logs',
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
            isNullable: true,
          },
          {
            name: 'triggerType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'triggerContext',
            type:
              queryRunner.connection.driver.options.type === 'postgres'
                ? 'json'
                : 'text',
            isNullable: true,
          },
          {
            name: 'conditionsResult',
            type:
              queryRunner.connection.driver.options.type === 'postgres'
                ? 'json'
                : 'text',
          },
          {
            name: 'actionResults',
            type:
              queryRunner.connection.driver.options.type === 'postgres'
                ? 'json'
                : 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'int',
            default: 0,
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'automation_audit_logs',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'automation_audit_logs',
      new TableForeignKey({
        columnNames: ['eventId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'automation_rules',
      new TableIndex({
        name: 'idx_automation_rules_createdById',
        columnNames: ['createdById'],
      }),
    );

    await queryRunner.createIndex(
      'automation_rules',
      new TableIndex({
        name: 'idx_automation_rules_isEnabled',
        columnNames: ['isEnabled'],
      }),
    );

    await queryRunner.createIndex(
      'automation_rules',
      new TableIndex({
        name: 'idx_automation_rules_triggerType',
        columnNames: ['triggerType'],
      }),
    );

    await queryRunner.createIndex(
      'automation_conditions',
      new TableIndex({
        name: 'idx_automation_conditions_ruleId',
        columnNames: ['ruleId'],
      }),
    );

    await queryRunner.createIndex(
      'automation_actions',
      new TableIndex({
        name: 'idx_automation_actions_ruleId',
        columnNames: ['ruleId'],
      }),
    );

    await queryRunner.createIndex(
      'automation_audit_logs',
      new TableIndex({
        name: 'idx_automation_audit_logs_ruleId',
        columnNames: ['ruleId'],
      }),
    );

    await queryRunner.createIndex(
      'automation_audit_logs',
      new TableIndex({
        name: 'idx_automation_audit_logs_eventId',
        columnNames: ['eventId'],
      }),
    );

    await queryRunner.createIndex(
      'automation_audit_logs',
      new TableIndex({
        name: 'idx_automation_audit_logs_executedAt',
        columnNames: ['executedAt'],
      }),
    );

    await queryRunner.createIndex(
      'automation_audit_logs',
      new TableIndex({
        name: 'idx_audit_logs_rule_executed',
        columnNames: ['ruleId', 'executedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex(
      'automation_audit_logs',
      'idx_audit_logs_rule_executed',
    );
    await queryRunner.dropIndex(
      'automation_audit_logs',
      'idx_automation_audit_logs_executedAt',
    );
    await queryRunner.dropIndex(
      'automation_audit_logs',
      'idx_automation_audit_logs_eventId',
    );
    await queryRunner.dropIndex(
      'automation_audit_logs',
      'idx_automation_audit_logs_ruleId',
    );
    await queryRunner.dropIndex(
      'automation_actions',
      'idx_automation_actions_ruleId',
    );
    await queryRunner.dropIndex(
      'automation_conditions',
      'idx_automation_conditions_ruleId',
    );
    await queryRunner.dropIndex(
      'automation_rules',
      'idx_automation_rules_triggerType',
    );
    await queryRunner.dropIndex(
      'automation_rules',
      'idx_automation_rules_isEnabled',
    );
    await queryRunner.dropIndex(
      'automation_rules',
      'idx_automation_rules_createdById',
    );

    // Drop tables in reverse order
    await queryRunner.dropTable('automation_audit_logs');
    await queryRunner.dropTable('automation_actions');
    await queryRunner.dropTable('automation_conditions');
    await queryRunner.dropTable('automation_rules');
  }
}
