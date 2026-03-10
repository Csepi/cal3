import { UsersService } from './users.service';

describe('UsersService personal audit feed', () => {
  const userRepo = {} as never;
  const auditEventRepo = {
    createQueryBuilder: jest.fn(),
  } as never;
  const automationAuditRepo = {
    createQueryBuilder: jest.fn(),
  } as never;
  const auditTrailService = {
    query: jest.fn(),
  } as never;

  const buildCountQuery = (count: number) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    clone: jest.fn().mockImplementation(function clone(this: any) {
      return this;
    }),
    getCount: jest.fn().mockResolvedValue(count),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user-scoped events, automation runs, and summary counts', async () => {
    (auditTrailService.query as jest.Mock).mockResolvedValue({
      items: [{ id: 1, action: 'auth.login.success' }],
      count: 1,
    });

    const automationRunQuery = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 3,
          ruleId: 99,
          rule: { name: 'Rule 99', createdById: 5 },
          status: 'success',
          triggerType: 'webhook.incoming',
          executionTimeMs: 18,
          executedAt: new Date('2026-03-10T10:00:00.000Z'),
          executedByUserId: null,
        },
      ]),
      getCount: jest.fn().mockResolvedValue(1),
    };
    (automationAuditRepo.createQueryBuilder as jest.Mock).mockReturnValue(
      automationRunQuery,
    );

    const countQuery = buildCountQuery(2);
    (auditEventRepo.createQueryBuilder as jest.Mock).mockReturnValue(countQuery);

    const service = new UsersService(
      userRepo,
      auditEventRepo,
      automationAuditRepo,
      auditTrailService,
    );

    const result = await service.getPersonalAuditFeed(5, {
      limit: 50,
      offset: 0,
      includeAutomation: true,
    });

    expect(auditTrailService.query).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
      }),
    );
    expect(result.events).toHaveLength(1);
    expect(result.automationRuns).toHaveLength(1);
    expect(result.summary.totalEvents).toBe(2);
  });
});
