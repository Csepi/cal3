import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';
import { AuditEvent } from '../entities/audit-event.entity';
import { DataSubjectRequest } from '../entities/data-subject-request.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { User, UserRole } from '../entities/user.entity';
import { AuditTrailService } from '../logging/audit-trail.service';
import { FieldEncryptionService } from '../common/security/field-encryption.service';
import { ComplianceAuditExportQueryDto } from './dto/compliance.dto';

export interface ComplianceControlResult {
  id: string;
  framework: 'GDPR' | 'SOC2' | 'ISO27001' | 'ASVS';
  control: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  evidence: string;
}

const parseDate = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

@Injectable()
export class ComplianceReportingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LogSettings)
    private readonly logSettingsRepository: Repository<LogSettings>,
    @InjectRepository(DataSubjectRequest)
    private readonly dsrRepository: Repository<DataSubjectRequest>,
    @InjectRepository(OrganisationAdmin)
    private readonly orgAdminRepository: Repository<OrganisationAdmin>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    private readonly auditTrailService: AuditTrailService,
    private readonly fieldEncryptionService: FieldEncryptionService,
  ) {}

  async getDashboard() {
    const [userStats, dsrSummary, consentCoverage, mfaCoverage, settings, errorSummary] =
      await Promise.all([
        this.getUserStats(),
        this.getDsrSummary(),
        this.getConsentCoverage(),
        this.getMfaCoverage(),
        this.getLogSettings(),
        this.auditTrailService.getErrorSummary(24),
      ]);

    const controls = this.buildControls({
      userStats,
      dsrSummary,
      consentCoverage,
      mfaCoverage,
      settings,
      errorSummary,
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        users: userStats,
        dsr: dsrSummary,
        consent: consentCoverage,
        mfa: mfaCoverage,
        errorSummary,
      },
      settings: {
        appLogRetentionDays: settings.retentionDays,
        auditRetentionDays: settings.auditRetentionDays,
      },
      controls,
    };
  }

  async getAccessReviewReport() {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['id', 'email', 'username', 'role', 'isActive', 'mfaEnabled', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });

    const orgAdmins = await this.orgAdminRepository.find({
      relations: ['user'],
      order: { assignedAt: 'DESC' },
      take: 1000,
    });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentLoginRows = await this.auditEventRepository
      .createQueryBuilder('event')
      .select('event.userId', 'userId')
      .addSelect('MAX(event.createdAt)', 'lastLogin')
      .where('event.action = :action', { action: 'auth.login.success' })
      .groupBy('event.userId')
      .getRawMany<{ userId: string; lastLogin: string }>();

    const lastLoginByUser = new Map<number, string>();
    recentLoginRows.forEach((row) => {
      const id = Number(row.userId);
      if (Number.isFinite(id) && row.lastLogin) {
        lastLoginByUser.set(id, row.lastLogin);
      }
    });

    const staleUsers = await this.userRepository.find({
      where: {
        isActive: true,
        role: Not(UserRole.OBSERVER),
        updatedAt: MoreThanOrEqual(new Date('2000-01-01T00:00:00.000Z')),
      },
      select: ['id', 'email', 'username', 'role', 'isActive', 'mfaEnabled'],
      take: 5000,
    });

    const staleAccess = staleUsers
      .map((user) => {
        const lastLogin = lastLoginByUser.get(user.id);
        return {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          lastLoginAt: lastLogin ?? null,
        };
      })
      .filter((entry) => {
        if (!entry.lastLoginAt) {
          return true;
        }
        return new Date(entry.lastLoginAt).getTime() < ninetyDaysAgo.getTime();
      })
      .slice(0, 500);

    return {
      generatedAt: new Date().toISOString(),
      privilegedAccounts: admins.map((admin) => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        mfaEnabled: admin.mfaEnabled,
        updatedAt: admin.updatedAt.toISOString(),
        lastLoginAt: lastLoginByUser.get(admin.id) ?? null,
      })),
      organisationAdmins: orgAdmins.map((entry) => ({
        organisationId: entry.organisationId,
        userId: entry.userId,
        assignedAt: entry.assignedAt.toISOString(),
        user: entry.user
          ? {
              username: entry.user.username,
              email: entry.user.email,
              mfaEnabled: entry.user.mfaEnabled,
            }
          : null,
      })),
      staleAccessCandidates: staleAccess,
    };
  }

  async exportAuditEvents(query: ComplianceAuditExportQueryDto) {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const categories = (query.categories ?? []).filter(
      (entry): entry is
        | 'security'
        | 'permission'
        | 'mutation'
        | 'api_error'
        | 'frontend_error'
        | 'system' =>
        entry === 'security' ||
        entry === 'permission' ||
        entry === 'mutation' ||
        entry === 'api_error' ||
        entry === 'frontend_error' ||
        entry === 'system',
    );

    const events = await this.auditTrailService.query({
      categories: categories.length > 0 ? categories : undefined,
      from,
      to,
      limit: 5000,
      offset: 0,
    });

    const generatedAt = new Date().toISOString();
    if (query.format === 'csv') {
      return {
        format: 'csv',
        generatedAt,
        count: events.count,
        csv: this.toCsv(events.items),
      };
    }

    return {
      format: 'json',
      generatedAt,
      count: events.count,
      items: events.items,
    };
  }

  private async getUserStats() {
    const [total, active, admins] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return {
      total,
      active,
      admins,
    };
  }

  private async getDsrSummary() {
    const rows = await this.dsrRepository
      .createQueryBuilder('dsr')
      .select('dsr.requestType', 'requestType')
      .addSelect('dsr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dsr.requestType')
      .addGroupBy('dsr.status')
      .getRawMany<{ requestType: string; status: string; count: string }>();

    const matrix: Record<string, Record<string, number>> = {
      access: {},
      export: {},
      delete: {},
    };
    rows.forEach((row) => {
      const requestType =
        row.requestType === 'access' ||
        row.requestType === 'export' ||
        row.requestType === 'delete'
          ? row.requestType
          : null;
      if (!requestType) {
        return;
      }
      matrix[requestType][row.status] = Number(row.count);
    });

    return matrix;
  }

  private async getConsentCoverage() {
    const [acceptedPrivacy, totalUsers] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .where('user.privacyPolicyAcceptedAt IS NOT NULL')
        .getCount(),
      this.userRepository.count(),
    ]);

    return {
      acceptedPrivacyPolicy: acceptedPrivacy,
      totalUsers,
      ratio: totalUsers > 0 ? acceptedPrivacy / totalUsers : 0,
    };
  }

  private async getMfaCoverage() {
    const [enabledCount, totalUsers] = await Promise.all([
      this.userRepository.count({
        where: { mfaEnabled: true, isActive: true },
      }),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    return {
      enabledCount,
      totalUsers,
      ratio: totalUsers > 0 ? enabledCount / totalUsers : 0,
    };
  }

  private async getLogSettings(): Promise<LogSettings> {
    let settings = await this.logSettingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.logSettingsRepository.create({
        id: 1,
        retentionDays: 30,
        autoCleanupEnabled: true,
        realtimeCriticalAlertsEnabled: true,
        errorRateAlertThresholdPerMinute: 25,
        p95LatencyAlertThresholdMs: 1500,
        metricsRetentionHours: 72,
        auditRetentionDays: 2555,
      });
      settings = await this.logSettingsRepository.save(settings);
    }
    return settings;
  }

  private buildControls(input: {
    userStats: { total: number; active: number; admins: number };
    dsrSummary: Record<string, Record<string, number>>;
    consentCoverage: { acceptedPrivacyPolicy: number; totalUsers: number; ratio: number };
    mfaCoverage: { enabledCount: number; totalUsers: number; ratio: number };
    settings: LogSettings;
    errorSummary: {
      criticalCount: number;
      failureCount: number;
      topErrorCodes: Array<{ code: string; count: number }>;
      trend: Array<{ hour: string; count: number }>;
    };
  }): ComplianceControlResult[] {
    const controls: ComplianceControlResult[] = [];

    const hasDsrActivity =
      Object.values(input.dsrSummary).reduce(
        (acc, typeSummary) =>
          acc +
          Object.values(typeSummary).reduce((sum, value) => sum + value, 0),
        0,
      ) > 0;
    controls.push({
      id: 'gdpr-dsr',
      framework: 'GDPR',
      control: 'Data subject rights workflow (access/export/delete)',
      status: hasDsrActivity ? 'pass' : 'warn',
      detail: hasDsrActivity
        ? 'DSR records exist and are queryable.'
        : 'No DSR records found yet; process is available but unexercised.',
      evidence: 'data_subject_requests table + /api/compliance endpoints',
    });

    const consentRatio = input.consentCoverage.ratio;
    controls.push({
      id: 'gdpr-consent',
      framework: 'GDPR',
      control: 'Privacy policy acceptance and consent tracking',
      status: consentRatio >= 0.8 ? 'pass' : consentRatio >= 0.5 ? 'warn' : 'fail',
      detail: `Privacy policy acceptance ratio: ${(consentRatio * 100).toFixed(1)}%`,
      evidence: 'users.privacyPolicyAcceptedAt + user_consents',
    });

    controls.push({
      id: 'soc2-audit-retention',
      framework: 'SOC2',
      control: 'Audit retention >= 7 years',
      status: input.settings.auditRetentionDays >= 2555 ? 'pass' : 'fail',
      detail: `Configured audit retention: ${input.settings.auditRetentionDays} days`,
      evidence: 'app_log_settings.auditRetentionDays',
    });

    const mfaRatio = input.mfaCoverage.ratio;
    controls.push({
      id: 'iso-mfa',
      framework: 'ISO27001',
      control: 'MFA adoption for active users',
      status: mfaRatio >= 0.7 ? 'pass' : mfaRatio >= 0.4 ? 'warn' : 'fail',
      detail: `MFA enabled for ${(mfaRatio * 100).toFixed(1)}% of active users`,
      evidence: 'users.mfaEnabled + /api/auth/mfa/*',
    });

    const encryptionReady = this.fieldEncryptionService.isReady();
    controls.push({
      id: 'asvs-crypto-1',
      framework: 'ASVS',
      control: 'Sensitive field encryption with versioned keys',
      status: encryptionReady ? 'pass' : 'fail',
      detail: encryptionReady
        ? `Active key version: ${this.fieldEncryptionService.getActiveKeyVersion()}`
        : 'No encryption key available',
      evidence: 'FieldEncryptionService + user.mfaSecret',
    });

    controls.push({
      id: 'soc2-incident-detection',
      framework: 'SOC2',
      control: 'Critical incident visibility',
      status: input.errorSummary.criticalCount === 0 ? 'pass' : 'warn',
      detail: `${input.errorSummary.criticalCount} critical events in last 24h`,
      evidence: 'audit_events category api_error/security',
    });

    return controls;
  }

  private toCsv(items: AuditEvent[]): string {
    const header = [
      'id',
      'createdAt',
      'category',
      'action',
      'severity',
      'outcome',
      'userId',
      'organisationId',
      'requestId',
      'path',
      'errorCode',
      'errorMessage',
    ];
    const rows = items.map((event) =>
      [
        event.id,
        event.createdAt.toISOString(),
        event.category,
        event.action,
        event.severity,
        event.outcome,
        event.userId ?? '',
        event.organisationId ?? '',
        event.requestId ?? '',
        event.path ?? '',
        event.errorCode ?? '',
        event.errorMessage ?? '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    return [header.join(','), ...rows].join('\n');
  }
}
