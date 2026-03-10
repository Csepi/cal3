import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrailService } from '../logging/audit-trail.service';
import { Calendar } from '../entities/calendar.entity';
import {
  DataSubjectRequest,
  type DataSubjectRequestStatus,
  type DataSubjectRequestType,
} from '../entities/data-subject-request.entity';
import { Event } from '../entities/event.entity';
import { Reservation } from '../entities/reservation.entity';
import { Task } from '../entities/task.entity';
import {
  UserConsent,
  type UserConsentDecision,
  type UserConsentType,
} from '../entities/user-consent.entity';
import { User } from '../entities/user.entity';
import {
  CreateDataSubjectRequestDto,
  DataSubjectRequestQueryDto,
  UpsertConsentDto,
  USER_CONSENT_TYPES,
} from './dto/compliance.dto';

interface RequestMetadata {
  ip?: string | null;
  userAgent?: string | null;
  source?: string | null;
}

const sortByCreatedDesc = <T extends { createdAt: Date }>(values: T[]): T[] =>
  [...values].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserConsent)
    private readonly consentRepository: Repository<UserConsent>,
    @InjectRepository(DataSubjectRequest)
    private readonly dsrRepository: Repository<DataSubjectRequest>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async getPersonalPrivacyReport(userId: number) {
    const user = await this.getUser(userId);
    const [calendarCount, eventCount, reservationCount, taskCount, consents] =
      await Promise.all([
        this.calendarRepository.count({ where: { ownerId: userId } }),
        this.eventRepository.count({ where: { createdById: userId } }),
        this.reservationRepository.count({ where: { createdBy: { id: userId } } }),
        this.taskRepository.count({ where: { ownerId: userId } }),
        this.getLatestConsents(userId),
      ]);

    const requests = await this.dsrRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    await this.auditTrailService.logSecurityEvent(
      'gdpr.access.report.generated',
      { userId },
      { userId, outcome: 'success' },
    );

    return {
      generatedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt?.toISOString() ?? null,
        privacyPolicyVersion: user.privacyPolicyVersion ?? null,
      },
      footprint: {
        ownedCalendars: calendarCount,
        createdEvents: eventCount,
        reservationsCreated: reservationCount,
        ownedTasks: taskCount,
      },
      consents,
      recentRequests: requests.map((request) => this.serializeRequest(request)),
    };
  }

  async exportPersonalData(userId: number) {
    const user = await this.getUser(userId);
    const [calendars, events, reservations, tasks, consents] = await Promise.all([
      this.calendarRepository.find({
        where: { ownerId: userId },
        order: { createdAt: 'DESC' },
        take: 500,
      }),
      this.eventRepository.find({
        where: { createdById: userId },
        order: { createdAt: 'DESC' },
        take: 2000,
      }),
      this.reservationRepository.find({
        where: { createdBy: { id: userId } },
        order: { createdAt: 'DESC' },
        take: 1000,
      }),
      this.taskRepository.find({
        where: { ownerId: userId },
        order: { createdAt: 'DESC' },
        take: 2000,
      }),
      this.consentRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 200,
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
        timezone: user.timezone,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      calendars: calendars.map((item) => ({
        id: item.id,
        name: item.name,
        color: item.color,
        visibility: item.visibility,
        createdAt: item.createdAt.toISOString(),
      })),
      events: events.map((item) => ({
        id: item.id,
        calendarId: item.calendarId,
        title: item.title,
        description: item.description,
        startDate: item.startDate,
        startTime: item.startTime,
        endDate: item.endDate,
        endTime: item.endTime,
        createdAt: item.createdAt.toISOString(),
      })),
      reservations: reservations.map((item) => ({
        id: item.id,
        status: item.status,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
        quantity: item.quantity,
        createdAt: item.createdAt.toISOString(),
      })),
      tasks: tasks.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      consents: consents.map((item) => ({
        id: item.id,
        type: item.consentType,
        decision: item.decision,
        policyVersion: item.policyVersion,
        createdAt: item.createdAt.toISOString(),
      })),
    };

    await this.createDataSubjectRequestInternal({
      userId,
      requestType: 'export',
      reason: 'self-service export',
      status: 'completed',
      payload: {
        exportCount: {
          calendars: payload.calendars.length,
          events: payload.events.length,
          reservations: payload.reservations.length,
          tasks: payload.tasks.length,
          consents: payload.consents.length,
        },
      },
      completedAt: new Date(),
    });

    await this.auditTrailService.logSecurityEvent(
      'gdpr.export.generated',
      { userId },
      { userId, outcome: 'success' },
    );

    return payload;
  }

  async createDataSubjectRequest(
    userId: number,
    dto: CreateDataSubjectRequestDto,
    metadata: RequestMetadata,
  ) {
    const user = await this.getUser(userId);
    const requestType = dto.requestType;

    if (
      requestType === 'delete' &&
      dto.confirmEmail &&
      dto.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new BadRequestException('confirmEmail does not match account email.');
    }

    if (requestType === 'delete') {
      const pending = await this.dsrRepository.count({
        where: {
          userId,
          requestType: 'delete',
          status: 'pending',
        },
      });
      if (pending > 0) {
        throw new BadRequestException(
          'A pending delete request already exists for this account.',
        );
      }
    }

    const request = await this.createDataSubjectRequestInternal({
      userId,
      requestType,
      reason: dto.reason,
      status: 'pending',
      metadata: {
        ip: metadata.ip ?? null,
        userAgent: metadata.userAgent ?? null,
        source: metadata.source ?? 'user-self-service',
      },
    });

    if (requestType === 'access') {
      request.status = 'completed';
      request.completedAt = new Date();
      request.payload = {
        action: 'access_report_available_via_api',
      };
      await this.dsrRepository.save(request);
    }

    await this.auditTrailService.logSecurityEvent(
      'gdpr.request.created',
      {
        userId,
        requestId: request.id,
        requestType: request.requestType,
        status: request.status,
      },
      {
        userId,
        outcome: 'success',
      },
    );

    return this.serializeRequest(request);
  }

  async listPersonalRequests(userId: number, query: DataSubjectRequestQueryDto) {
    const parsed = this.parseRequestQuery(query);
    const qb = this.dsrRepository
      .createQueryBuilder('request')
      .where('request.userId = :userId', { userId })
      .orderBy('request.createdAt', 'DESC')
      .skip(parsed.offset)
      .take(parsed.limit);

    if (parsed.requestTypes.length > 0) {
      qb.andWhere('request.requestType IN (:...requestTypes)', {
        requestTypes: parsed.requestTypes,
      });
    }
    if (parsed.statuses.length > 0) {
      qb.andWhere('request.status IN (:...statuses)', {
        statuses: parsed.statuses,
      });
    }

    const [items, count] = await qb.getManyAndCount();
    return {
      count,
      items: items.map((item) => this.serializeRequest(item)),
    };
  }

  async listDataSubjectRequests(query: DataSubjectRequestQueryDto) {
    const parsed = this.parseRequestQuery(query);
    const qb = this.dsrRepository
      .createQueryBuilder('request')
      .orderBy('request.createdAt', 'DESC')
      .skip(parsed.offset)
      .take(parsed.limit);

    if (parsed.requestTypes.length > 0) {
      qb.andWhere('request.requestType IN (:...requestTypes)', {
        requestTypes: parsed.requestTypes,
      });
    }
    if (parsed.statuses.length > 0) {
      qb.andWhere('request.status IN (:...statuses)', {
        statuses: parsed.statuses,
      });
    }
    if (parsed.search) {
      const search = `%${parsed.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(COALESCE(request.reason, \'\')) LIKE :search OR LOWER(COALESCE(request.adminNotes, \'\')) LIKE :search)',
        { search },
      );
    }

    const [items, count] = await qb.getManyAndCount();
    return {
      count,
      items: items.map((item) => this.serializeRequest(item)),
    };
  }

  async updateDataSubjectRequest(
    id: number,
    payload: {
      status: DataSubjectRequestStatus;
      adminNotes?: string;
      handledByUserId: number;
    },
  ) {
    const request = await this.dsrRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Data subject request not found.');
    }

    request.status = payload.status;
    request.adminNotes = payload.adminNotes ?? request.adminNotes ?? null;
    request.handledByUserId = payload.handledByUserId;
    if (payload.status === 'completed' || payload.status === 'rejected') {
      request.completedAt = new Date();
    }

    const saved = await this.dsrRepository.save(request);

    await this.auditTrailService.logSecurityEvent(
      'gdpr.request.updated',
      {
        requestId: saved.id,
        requestType: saved.requestType,
        status: saved.status,
        handledByUserId: payload.handledByUserId,
      },
      {
        userId: payload.handledByUserId,
        outcome: 'success',
      },
    );

    return this.serializeRequest(saved);
  }

  async upsertConsent(
    userId: number,
    consentType: UserConsentType,
    dto: UpsertConsentDto,
    metadata: RequestMetadata,
  ) {
    if (!USER_CONSENT_TYPES.includes(consentType)) {
      throw new BadRequestException(`Unsupported consent type: ${consentType}`);
    }

    const decision = dto.decision as UserConsentDecision;
    const now = new Date();
    const record = this.consentRepository.create({
      userId,
      consentType,
      policyVersion: dto.policyVersion,
      decision,
      acceptedAt: decision === 'accepted' ? now : null,
      revokedAt: decision === 'revoked' ? now : null,
      source: dto.source ?? metadata.source ?? 'self-service',
      ip: metadata.ip ?? null,
      userAgent: metadata.userAgent ?? null,
      metadata: dto.metadata ?? null,
    });

    const saved = await this.consentRepository.save(record);

    await this.auditTrailService.logSecurityEvent(
      'gdpr.consent.updated',
      {
        userId,
        consentType,
        decision,
        policyVersion: dto.policyVersion,
      },
      {
        userId,
        outcome: 'success',
      },
    );

    return this.serializeConsent(saved);
  }

  async acceptPrivacyPolicy(
    userId: number,
    version: string,
    metadata: RequestMetadata,
  ) {
    const user = await this.getUser(userId);
    user.privacyPolicyAcceptedAt = new Date();
    user.privacyPolicyVersion = version;
    await this.userRepository.save(user);

    const consent = await this.upsertConsent(
      userId,
      'privacy_policy',
      {
        decision: 'accepted',
        policyVersion: version,
        source: metadata.source ?? 'privacy-center',
      },
      metadata,
    );

    return {
      acceptedAt: user.privacyPolicyAcceptedAt.toISOString(),
      version: user.privacyPolicyVersion,
      consent,
    };
  }

  async listLatestConsents(userId: number) {
    return this.getLatestConsents(userId);
  }

  private async getLatestConsents(userId: number) {
    const all = await this.consentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    const sorted = sortByCreatedDesc(all);
    const latest = new Map<string, UserConsent>();
    sorted.forEach((item) => {
      if (!latest.has(item.consentType)) {
        latest.set(item.consentType, item);
      }
    });

    return Array.from(latest.values()).map((item) => this.serializeConsent(item));
  }

  private serializeConsent(item: UserConsent) {
    return {
      id: item.id,
      consentType: item.consentType,
      policyVersion: item.policyVersion,
      decision: item.decision,
      acceptedAt: item.acceptedAt?.toISOString() ?? null,
      revokedAt: item.revokedAt?.toISOString() ?? null,
      source: item.source ?? null,
      createdAt: item.createdAt.toISOString(),
      metadata: item.metadata ?? null,
    };
  }

  private serializeRequest(item: DataSubjectRequest) {
    return {
      id: item.id,
      userId: item.userId,
      requestType: item.requestType,
      status: item.status,
      reason: item.reason ?? null,
      adminNotes: item.adminNotes ?? null,
      handledByUserId: item.handledByUserId ?? null,
      completedAt: item.completedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      payload: item.payload ?? null,
      metadata: item.metadata ?? null,
    };
  }

  private parseRequestQuery(query: DataSubjectRequestQueryDto): {
    statuses: DataSubjectRequestStatus[];
    requestTypes: DataSubjectRequestType[];
    search?: string;
    offset: number;
    limit: number;
  } {
    const statuses = (query.statuses ?? []).filter(
      (entry): entry is DataSubjectRequestStatus =>
        entry === 'pending' ||
        entry === 'in_progress' ||
        entry === 'completed' ||
        entry === 'rejected',
    );
    const requestTypes = (query.requestTypes ?? []).filter(
      (entry): entry is DataSubjectRequestType =>
        entry === 'access' || entry === 'export' || entry === 'delete',
    );
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    const offset = Math.max(query.offset ?? 0, 0);

    return {
      statuses,
      requestTypes,
      search: query.search?.trim() || undefined,
      offset,
      limit,
    };
  }

  private async createDataSubjectRequestInternal(input: {
    userId: number;
    requestType: DataSubjectRequestType;
    reason?: string;
    status: DataSubjectRequestStatus;
    adminNotes?: string;
    handledByUserId?: number;
    completedAt?: Date | null;
    payload?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<DataSubjectRequest> {
    const request = this.dsrRepository.create({
      userId: input.userId,
      requestType: input.requestType,
      reason: input.reason ?? null,
      status: input.status,
      adminNotes: input.adminNotes ?? null,
      handledByUserId: input.handledByUserId ?? null,
      completedAt: input.completedAt ?? null,
      payload: input.payload ?? null,
      metadata: input.metadata ?? null,
    });
    return this.dsrRepository.save(request);
  }

  private async getUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }
}
