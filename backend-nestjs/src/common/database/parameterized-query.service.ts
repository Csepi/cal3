import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DataSource, QueryRunner } from 'typeorm';

export interface ParameterizedQueryOptions {
  statementKey?: string;
}

/**
 * Executes parameterized SQL queries and enables named prepared statements on
 * PostgreSQL connections when a statement key is provided.
 */
@Injectable()
export class ParameterizedQueryService {
  private readonly statementNames = new Map<string, string>();
  private readonly statementCacheLimit = 500;

  constructor(private readonly dataSource: DataSource) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: readonly unknown[] = [],
    options: ParameterizedQueryOptions = {},
  ): Promise<T[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const statementName = options.statementKey
        ? this.resolveStatementName(options.statementKey, sql)
        : undefined;

      if (statementName) {
        const rows = await this.executeNamedStatement<T>(
          queryRunner,
          statementName,
          sql,
          params,
        );
        if (rows) {
          return rows;
        }
      }

      const result = await queryRunner.query(sql, [...params]);
      return Array.isArray(result) ? (result as T[]) : ([result] as T[]);
    } finally {
      await queryRunner.release();
    }
  }

  getCachedStatementCount(): number {
    return this.statementNames.size;
  }

  private resolveStatementName(key: string, sql: string): string {
    const existing = this.statementNames.get(key);
    if (existing) {
      return existing;
    }

    if (this.statementNames.size >= this.statementCacheLimit) {
      const oldestKey = this.statementNames.keys().next().value as
        | string
        | undefined;
      if (oldestKey) {
        this.statementNames.delete(oldestKey);
      }
    }

    const hash = createHash('sha1').update(sql).digest('hex').slice(0, 12);
    const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    const statementName = `cal3_${normalizedKey}_${hash}`;
    this.statementNames.set(key, statementName);
    return statementName;
  }

  private async executeNamedStatement<T>(
    queryRunner: QueryRunner,
    statementName: string,
    sql: string,
    params: readonly unknown[],
  ): Promise<T[] | null> {
    const driverConnection = (
      queryRunner as QueryRunner & {
        databaseConnection?: {
          query?: (
            query:
              | string
              | { name: string; text: string; values: readonly unknown[] },
          ) => Promise<unknown>;
        };
      }
    ).databaseConnection;

    if (!driverConnection?.query || !this.isPostgres()) {
      return null;
    }

    try {
      const result = (await driverConnection.query({
        name: statementName,
        text: sql,
        values: params,
      })) as { rows?: T[] };
      return Array.isArray(result?.rows) ? result.rows : null;
    } catch {
      return null;
    }
  }

  private isPostgres(): boolean {
    return (
      this.dataSource.options.type === 'postgres' ||
      this.dataSource.options.type === 'aurora-postgres'
    );
  }
}

