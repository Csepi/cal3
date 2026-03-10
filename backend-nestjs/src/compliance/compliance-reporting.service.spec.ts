import { ComplianceReportingService } from './compliance-reporting.service';

describe('ComplianceReportingService', () => {
  const userRepository = {
    count: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const logSettingsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const dsrRepository = {
    createQueryBuilder: jest.fn(),
  };
  const orgAdminRepository = {
    find: jest.fn(),
  };
  const auditEventRepository = {
    createQueryBuilder: jest.fn(),
  };
  const auditTrailService = {
    getErrorSummary: jest.fn(),
    query: jest.fn(),
  };
  const fieldEncryptionService = {
    isReady: jest.fn(),
    getActiveKeyVersion: jest.fn(),
  };

  let service: ComplianceReportingService;

  beforeEach(() => {
    jest.clearAllMocks();

    dsrRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { requestType: 'delete', status: 'pending', count: '2' },
      ]),
    });

    auditEventRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { userId: '1', lastLogin: new Date().toISOString() },
      ]),
    });

    userRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(18),
    });

    userRepository.count
      .mockResolvedValueOnce(20) // total
      .mockResolvedValueOnce(16) // active
      .mockResolvedValueOnce(2) // admins
      .mockResolvedValueOnce(20) // total users for consent
      .mockResolvedValueOnce(10) // mfa enabled
      .mockResolvedValueOnce(16); // active users for mfa

    logSettingsRepository.findOne.mockResolvedValue({
      id: 1,
      retentionDays: 30,
      auditRetentionDays: 2555,
      autoCleanupEnabled: true,
      realtimeCriticalAlertsEnabled: true,
      errorRateAlertThresholdPerMinute: 25,
      p95LatencyAlertThresholdMs: 1500,
      metricsRetentionHours: 72,
      updatedAt: new Date(),
    });

    auditTrailService.getErrorSummary.mockResolvedValue({
      criticalCount: 0,
      failureCount: 2,
      topErrorCodes: [{ code: 'AUTH_401', count: 2 }],
      trend: [],
    });

    fieldEncryptionService.isReady.mockReturnValue(true);
    fieldEncryptionService.getActiveKeyVersion.mockReturnValue('v1');

    service = new ComplianceReportingService(
      userRepository as any,
      logSettingsRepository as any,
      dsrRepository as any,
      orgAdminRepository as any,
      auditEventRepository as any,
      auditTrailService as any,
      fieldEncryptionService as any,
    );
  });

  it('returns dashboard with controls', async () => {
    const dashboard = await service.getDashboard();

    expect(dashboard.controls.length).toBeGreaterThan(0);
    expect(dashboard.controls.some((control) => control.id === 'soc2-audit-retention')).toBe(true);
  });
});
