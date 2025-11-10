import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAuthRefreshTokens1731100000000
  implements MigrationInterface
{
  private readonly tableName = 'auth_refresh_tokens';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres =
      queryRunner.connection.options.type === 'postgres' ||
      queryRunner.connection.options.type === 'aurora-postgres';

    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: isPostgres ? 'uuid_generate_v4()' : 'uuid()',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'jti',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'tokenHash',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'expiresAt',
            type: 'timestamptz',
          },
          {
            name: 'revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revokedAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'revocationReason',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'replacedByTokenId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      this.tableName,
      new TableIndex({
        name: 'IDX_auth_refresh_token_hash',
        columnNames: ['tokenHash'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      this.tableName,
      new TableIndex({
        name: 'IDX_auth_refresh_user',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(this.tableName, 'IDX_auth_refresh_user');
    await queryRunner.dropIndex(this.tableName, 'IDX_auth_refresh_token_hash');

    const table = await queryRunner.getTable(this.tableName);
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('userId'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(this.tableName, foreignKey);
    }

    await queryRunner.dropTable(this.tableName);
  }
}
