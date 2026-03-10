import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateApiKeysTable1734500000000 implements MigrationInterface {
  name = 'CreateApiKeysTable1734500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('api_keys');
    if (exists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'api_keys',
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
            length: '120',
            isNullable: false,
          },
          {
            name: 'prefix',
            type: 'varchar',
            length: '18',
            isNullable: false,
          },
          {
            name: 'keyHash',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'lastFour',
            type: 'varchar',
            length: '8',
            isNullable: false,
          },
          {
            name: 'scopes',
            type: 'text',
            isNullable: false,
            default: `'["read"]'`,
          },
          {
            name: 'tier',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: `'user'`,
          },
          {
            name: 'isActive',
            type: 'boolean',
            isNullable: false,
            default: 'true',
          },
          {
            name: 'expiresAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            isNullable: true,
          },
          {
            name: 'rotateAfter',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            isNullable: true,
          },
          {
            name: 'lastUsedAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'int',
            isNullable: false,
            default: '0',
          },
          {
            name: 'revokedAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            default:
              queryRunner.connection.options.type === 'postgres'
                ? 'CURRENT_TIMESTAMP'
                : '(datetime(\'now\'))',
          },
          {
            name: 'updatedAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamptz'
                : 'datetime',
            default:
              queryRunner.connection.options.type === 'postgres'
                ? 'CURRENT_TIMESTAMP'
                : '(datetime(\'now\'))',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_prefix',
        columnNames: ['prefix'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_user_active',
        columnNames: ['userId', 'isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('api_keys');
    if (!exists) {
      return;
    }
    await queryRunner.dropTable('api_keys');
  }
}
