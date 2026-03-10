import { Injectable, Optional } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { RequestContextService } from '../services/request-context.service';

export interface RlsSessionContext {
  organisationId?: number | null;
  userId?: number | null;
  isSuperAdmin?: boolean;
  requestId?: string | null;
  encryptionKey?: string | null;
}

@Injectable()
export class RlsSessionService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly requestContext?: RequestContextService,
  ) {}

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
    const requestId = context.requestId ?? this.requestContext?.getRequestId() ?? null;

    try {
      await runner.query(
        `
        SELECT app_set_request_context($1::int, $2::int, $3::boolean, $4::text, $5::text)
      `,
        [
          context.organisationId ?? null,
          context.userId ?? null,
          context.isSuperAdmin ?? false,
          requestId,
          context.encryptionKey ?? null,
        ],
      );
      return;
    } catch {
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
}
