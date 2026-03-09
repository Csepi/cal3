import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { RlsSessionService } from './rls-session.service';

describe('RlsSessionService', () => {
  let queryRunner: jest.Mocked<QueryRunner>;
  let dataSource: DataSource;
  let service: RlsSessionService;

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

    service = new RlsSessionService(dataSource);
  });

  it('applies tenant context before executing operation', async () => {
    await service.withTenantContext(
      { organisationId: 5, userId: 77, isSuperAdmin: false },
      async () => 'ok',
    );

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT app_set_tenant_context'),
      [5, 77, false],
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
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

