import type { DataSource, QueryRunner } from 'typeorm';
import { ParameterizedQueryService } from './parameterized-query.service';

describe('ParameterizedQueryService', () => {
  const createHarness = (
    databaseType: DataSource['options']['type'] = 'postgres',
  ) => {
    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      databaseConnection: {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      },
    } as unknown as jest.Mocked<QueryRunner> & {
      databaseConnection: {
        query: jest.Mock;
      };
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      options: {
        type: databaseType,
      },
    } as unknown as DataSource;

    const service = new ParameterizedQueryService(dataSource);
    return { service, queryRunner, dataSource };
  };

  it('executes parameterized query via queryRunner.query by default', async () => {
    const { service, queryRunner } = createHarness('sqlite');
    queryRunner.query.mockResolvedValue([{ value: 1 }]);

    const result = await service.query<{ value: number }>(
      'SELECT ? as value',
      [1],
    );

    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledWith('SELECT ? as value', [1]);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ value: 1 }]);
  });

  it('uses named prepared statements on postgres when statement key is supplied', async () => {
    const { service, queryRunner } = createHarness('postgres');
    queryRunner.databaseConnection.query.mockResolvedValue({
      rows: [{ current_database: 'cal3' }],
    });

    const result = await service.query<{ current_database: string }>(
      'SELECT current_database()',
      [],
      { statementKey: 'db_health' },
    );

    expect(queryRunner.databaseConnection.query).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('cal3_db_health_'),
        text: 'SELECT current_database()',
        values: [],
      }),
    );
    expect(queryRunner.query).not.toHaveBeenCalled();
    expect(result).toEqual([{ current_database: 'cal3' }]);
  });

  it('falls back to regular query when named statement execution fails', async () => {
    const { service, queryRunner } = createHarness('postgres');
    queryRunner.databaseConnection.query.mockRejectedValue(
      new Error('named statement failed'),
    );
    queryRunner.query.mockResolvedValue([{ ok: true }]);

    const result = await service.query<{ ok: boolean }>(
      'SELECT 1 as ok',
      [],
      { statementKey: 'fallback_case' },
    );

    expect(queryRunner.query).toHaveBeenCalledWith('SELECT 1 as ok', []);
    expect(result).toEqual([{ ok: true }]);
  });

  it('bounds prepared statement cache size', async () => {
    const { service } = createHarness('postgres');
    (service as unknown as { statementCacheLimit: number }).statementCacheLimit =
      3;

    await service.query('SELECT 1', [], { statementKey: 'one' });
    await service.query('SELECT 2', [], { statementKey: 'two' });
    await service.query('SELECT 3', [], { statementKey: 'three' });
    await service.query('SELECT 4', [], { statementKey: 'four' });

    expect(service.getCachedStatementCount()).toBeLessThanOrEqual(3);
  });
});
