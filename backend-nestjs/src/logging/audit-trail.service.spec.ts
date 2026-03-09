import { AuditTrailService } from './audit-trail.service';
import type { AuditEvent } from '../entities/audit-event.entity';

describe('AuditTrailService', () => {
  const create = jest.fn((value: Partial<AuditEvent>) => value as AuditEvent);
  const save = jest.fn(async (value: AuditEvent) => ({
    id: 1,
    createdAt: new Date(),
    ...value,
  }));
  const count = jest.fn(async () => 3);
  const deleteFn = jest.fn(async () => ({ affected: 7 }));
  const qbRows: Array<Array<{ code?: string; count: string; hour?: string }>> = [
    [{ code: 'INTERNAL_ERROR', count: '4' }],
    [{ hour: '2026-03-09 10:00', count: '2' }],
  ];
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest
      .fn()
      .mockImplementation(async () => qbRows.shift() ?? []),
  };
  const repository = {
    create,
    save,
    count,
    delete: deleteFn,
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const requestContext = {
    getContext: jest.fn(() => ({
      requestId: 'req-9',
      userId: 88,
      organisationId: 41,
      method: 'POST',
      path: '/api/events',
      ip: '127.0.0.1',
      resourceType: 'event',
      resourceId: '100',
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    qbRows.splice(
      0,
      qbRows.length,
      [{ code: 'INTERNAL_ERROR', count: '4' }],
      [{ hour: '2026-03-09 10:00', count: '2' }],
    );
  });

  it('captures context metadata and fingerprint when logging events', async () => {
    const service = new AuditTrailService(
      repository as never,
      requestContext as never,
    );

    await service.log({
      category: 'api_error',
      action: 'POST /api/events',
      errorCode: 'INTERNAL_ERROR',
      errorMessage: 'boom',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-9',
        userId: 88,
        organisationId: 41,
        method: 'POST',
        path: '/api/events',
      }),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('builds an aggregated error summary', async () => {
    const service = new AuditTrailService(
      repository as never,
      requestContext as never,
    );

    const summary = await service.getErrorSummary(12);
    expect(summary.criticalCount).toBe(3);
    expect(summary.failureCount).toBe(3);
    expect(summary.topErrorCodes[0]).toEqual({
      code: 'INTERNAL_ERROR',
      count: 4,
    });
    expect(summary.trend[0]).toEqual({
      hour: '2026-03-09 10:00',
      count: 2,
    });
  });
});
