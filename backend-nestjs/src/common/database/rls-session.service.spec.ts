import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { RlsSessionService } from './rls-session.service';
import type { RequestContextService } from '../services/request-context.service';

describe('RlsSessionService', () => {
  let queryRunner: jest.Mocked<QueryRunner>;
  let dataSource: DataSource;
  let service: RlsSessionService;
  let requestContext: Pick<RequestContextService, 'getRequestId'>;

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      manager: {} as EntityManager,
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    requestContext = {
      getRequestId: jest.fn().mockReturnValue('req-123'),
    };

    service = new RlsSessionService(
      dataSource,
      requestContext as RequestContextService,
    );
  });

  it('applies tenant context before executing operation', async () => {
    await service.withTenantContext(
      { organisationId: 5, userId: 77, isSuperAdmin: false },
      async () => 'ok',
    );

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT app_set_request_context'),
      [5, 77, false, 'req-123', null],
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('falls back to legacy tenant context function when request context function is unavailable', async () => {
    queryRunner.query
      .mockRejectedValueOnce(new Error('function app_set_request_context does not exist'))
      .mockResolvedValueOnce(undefined);

    await service.withTenantContext(
      { organisationId: 4, userId: 10, isSuperAdmin: true },
      async () => 'ok',
    );

    expect(queryRunner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT app_set_request_context'),
      [4, 10, true, 'req-123', null],
    );
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('SELECT app_set_tenant_context'),
      [4, 10, true],
    );
  });

  it('rolls back transaction when operation fails', async () => {
    await expect(
      service.withTenantContext(
        { organisationId: 7, userId: 91, isSuperAdmin: true },
        async () => {
          throw new Error('boom');
        },
      ),
    ).rejects.toThrow('boom');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
