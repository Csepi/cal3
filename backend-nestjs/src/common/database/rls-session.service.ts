import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export interface RlsSessionContext {
  organisationId?: number | null;
  userId?: number | null;
  isSuperAdmin?: boolean;
}

@Injectable()
export class RlsSessionService {
  constructor(private readonly dataSource: DataSource) {}

  async withTenantContext<T>(
    context: RlsSessionContext,
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await this.setLocalTenantContext(runner, context);
      const result = await operation(runner.manager);
      await runner.commitTransaction();
      return result;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async setLocalTenantContext(
    runner: QueryRunner,
    context: RlsSessionContext,
  ): Promise<void> {
    await runner.query(
      `
      SELECT app_set_tenant_context($1::int, $2::int, $3::boolean)
    `,
      [
        context.organisationId ?? null,
        context.userId ?? null,
        context.isSuperAdmin ?? false,
      ],
    );
  }
}

