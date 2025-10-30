import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateAgentTables1732905600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agent_profiles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: `'active'`,
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'agent_profiles',
      new TableIndex({
        name: 'IDX_agent_profiles_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'agent_profiles',
      new TableUnique({
        name: 'UQ_agent_profiles_user_name',
        columnNames: ['userId', 'name'],
      }),
    );

    await queryRunner.createForeignKey(
      'agent_profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'agent_permissions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'agentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'actionKey',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'scope',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'jsonb'
                : 'text',
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'agent_permissions',
      new TableIndex({
        name: 'IDX_agent_permissions_agentId',
        columnNames: ['agentId'],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'agent_permissions',
      new TableUnique({
        name: 'UQ_agent_permissions_agent_action',
        columnNames: ['agentId', 'actionKey'],
      }),
    );

    await queryRunner.createForeignKey(
      'agent_permissions',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedTableName: 'agent_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'agent_api_keys',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'agentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tokenId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'hashedKey',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'lastFour',
            type: 'varchar',
            length: '4',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'agent_api_keys',
      new TableIndex({
        name: 'IDX_agent_api_keys_agent_active',
        columnNames: ['agentId', 'isActive'],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'agent_api_keys',
      new TableUnique({
        name: 'UQ_agent_api_keys_tokenId',
        columnNames: ['tokenId'],
      }),
    );

    await queryRunner.createForeignKey(
      'agent_api_keys',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedTableName: 'agent_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agent_api_keys');
    await queryRunner.dropTable('agent_permissions');
    await queryRunner.dropTable('agent_profiles');
  }
}
