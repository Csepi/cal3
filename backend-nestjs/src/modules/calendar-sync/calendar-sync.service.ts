import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
  SyncProvider,
  SyncStatus,
} from '../../entities/calendar-sync.entity';
import { User } from '../../entities/user.entity';
import { Calendar } from '../../entities/calendar.entity';
import { Event, RecurrenceType } from '../../entities/event.entity';
import {
  CalendarSyncStatusDto,
  SyncCalendarsDto,
  SyncedCalendarInfoDto,
  ProviderSyncStatusDto,
} from '../../dto/calendar-sync.dto';
import { ConfigurationService } from '../../configuration/configuration.service';
import { DomainEventBus } from '../../common/events/domain-events';
import { ModuleRef } from '@nestjs/core';
import { CalendarSyncOAuthService } from './oauth.service';
import { CalendarSyncMapperService } from './mapper.service';
import {
  CalendarSyncProviderService,
  ExternalEventsResult,
} from './provider.service';

import { logError } from '../../common/errors/error-logger';
import { buildErrorContext } from '../../common/errors/error-context';

@Injectable()
export class CalendarSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly activeSyncConnectionIds = new Set<number>();
  private readonly unsubscribeHandlers: Array<() => void> = [];

  constructor(
    @InjectRepository(CalendarSyncConnection)
    private syncConnectionRepository: Repository<CalendarSyncConnection>,
    @InjectRepository(SyncedCalendar)
    private syncedCalendarRepository: Repository<SyncedCalendar>,
    @InjectRepository(SyncEventMapping)
    private syncEventMappingRepository: Repository<SyncEventMapping>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly configurationService: ConfigurationService,
    private readonly domainEventBus: DomainEventBus,
    private readonly moduleRef: ModuleRef,
    private readonly oauthService: CalendarSyncOAuthService,
    private readonly mapperService: CalendarSyncMapperService,
    private readonly providerService: CalendarSyncProviderService,
  ) {}

  onModuleInit() {
    this.automationService = this.resolveAutomationService();
    this.unsubscribeHandlers.push(
      this.domainEventBus.on('calendar.event.created', (event: Event) => {
        this.handleLocalEventCreated(event).catch((err) =>
          this.logger.warn(
            `Calendar sync create failed for event ${event.id}: ${err.message}`,
          ),
        );
      }),
    );
    this.unsubscribeHandlers.push(
      this.domainEventBus.on('calendar.event.updated', (event: Event) => {
        this.handleLocalEventUpdated(event).catch((err) =>
          this.logger.warn(
            `Calendar sync update failed for event ${event.id}: ${err.message}`,
          ),
        );
      }),
    );
    this.unsubscribeHandlers.push(
      this.domainEventBus.on('calendar.event.deleted', (event: Event) => {
        this.handleLocalEventDeleted(event).catch((err) =>
          this.logger.warn(
            `Calendar sync delete failed for event ${event.id}: ${err.message}`,
          ),
        );
      }),
    );
  }

  onModuleDestroy() {
    this.unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  }

  private automationService?: any;

  private resolveAutomationService(): any | null {
    try {
      const token = require('../../automation/automation.service').AutomationService;
      return this.moduleRef.get(token, { strict: false });
    } catch {
      return null;
    }
  }

  async getSyncStatus(userId: number): Promise<CalendarSyncStatusDto> {
    const allProviders = [SyncProvider.GOOGLE, SyncProvider.MICROSOFT];
    const providerStatuses: ProviderSyncStatusDto[] = [];

    for (const provider of allProviders) {
      const syncConnection = await this.syncConnectionRepository.findOne({
        where: { userId, provider, status: SyncStatus.ACTIVE },
      });

      if (!syncConnection) {
        // Provider not connected
        providerStatuses.push({
          provider,
          isConnected: false,
          calendars: [],
          syncedCalendars: [],
        });
      } else {
        // Provider connected
        const externalCalendars =
          await this.providerService.getExternalCalendars(syncConnection);

        // Get synced calendars
        const syncedCalendars = await this.syncedCalendarRepository.find({
          where: { syncConnectionId: syncConnection.id },
          relations: ['localCalendar'],
        });

        const syncedCalendarInfos: SyncedCalendarInfoDto[] =
          syncedCalendars.map((sc) => ({
            localName: sc.localCalendar.name,
            externalId: sc.externalCalendarId,
            externalName: sc.externalCalendarName,
            provider: syncConnection.provider,
            lastSync: sc.lastSyncAt?.toISOString() || 'Never',
            bidirectionalSync: sc.bidirectionalSync,
          }));

        providerStatuses.push({
          provider,
          isConnected: true,
          calendars: externalCalendars,
          syncedCalendars: syncedCalendarInfos,
        });
      }
    }

    return {
      providers: providerStatuses,
    };
  }

  async getAuthUrl(provider: SyncProvider, userId: number): Promise<string> {
    return this.oauthService.getAuthUrl(provider, userId);
  }

  async handleOAuthCallback(
    provider: SyncProvider,
    code: string,
    userId: number,
  ): Promise<void> {
    await this.oauthService.handleOAuthCallback(provider, code, userId);
  }

  async syncCalendars(
    userId: number,
    syncData: SyncCalendarsDto,
  ): Promise<void> {
    const syncConnection = await this.syncConnectionRepository.findOne({
      where: { userId, provider: syncData.provider, status: SyncStatus.ACTIVE },
    });

    if (!syncConnection) {
      throw new NotFoundException('No active sync connection found');
    }

    for (const calendarData of syncData.calendars) {
      const existingSyncedCalendar = await this.syncedCalendarRepository.findOne(
        {
          where: {
            syncConnectionId: syncConnection.id,
            externalCalendarId: calendarData.externalId,
          },
          relations: ['localCalendar'],
        },
      );

      if (existingSyncedCalendar) {
        existingSyncedCalendar.bidirectionalSync =
          calendarData.bidirectionalSync ??
          existingSyncedCalendar.bidirectionalSync ??
          true;

        if (
          calendarData.localName &&
          existingSyncedCalendar.localCalendar?.name !== calendarData.localName
        ) {
          existingSyncedCalendar.localCalendar.name = calendarData.localName;
          await this.calendarRepository.save(
            existingSyncedCalendar.localCalendar,
          );
        }

        await this.syncedCalendarRepository.save(existingSyncedCalendar);
        continue;
      }

      // Create local calendar
      const localCalendar = this.calendarRepository.create({
        name: calendarData.localName,
        description: `Synced from ${syncData.provider}`,
        color: '#3b82f6', // Default blue
        ownerId: userId,
      });

      const savedLocalCalendar =
        await this.calendarRepository.save(localCalendar);

      // Create sync mapping with automation trigger settings
      const syncedCalendar = this.syncedCalendarRepository.create({
        syncConnectionId: syncConnection.id,
        localCalendarId: savedLocalCalendar.id,
        externalCalendarId: calendarData.externalId,
        externalCalendarName: await this.providerService.getExternalCalendarName(
          syncConnection,
          calendarData.externalId,
        ),
        bidirectionalSync: calendarData.bidirectionalSync ?? true,
      });

      await this.syncedCalendarRepository.save(syncedCalendar);
    }

    // Trigger initial sync with automation settings
    await this.performSync(syncConnection, {
      triggerAutomationRules: syncData.calendars.some(
        (cal) => cal.triggerAutomationRules,
      ),
      selectedRuleIds: syncData.calendars.flatMap(
        (cal) => cal.selectedRuleIds || [],
      ),
    });
  }

  async disconnect(userId: number): Promise<void> {
    const syncConnections = await this.syncConnectionRepository.find({
      where: { userId },
    });

    for (const connection of syncConnections) {
      await this.deleteSyncedCalendars(connection);
      connection.status = SyncStatus.INACTIVE;
      connection.accessToken = null;
      connection.refreshToken = null;
      connection.tokenExpiresAt = null;
      connection.lastSyncAt = null;
      await this.syncConnectionRepository.save(connection);
    }
  }

  async disconnectProvider(
    userId: number,
    provider: SyncProvider,
  ): Promise<void> {
    const syncConnection = await this.syncConnectionRepository.findOne({
      where: { userId, provider },
    });

    if (syncConnection) {
      await this.deleteSyncedCalendars(syncConnection);
      syncConnection.status = SyncStatus.INACTIVE;
      syncConnection.accessToken = null;
      syncConnection.refreshToken = null;
      syncConnection.tokenExpiresAt = null;
      syncConnection.lastSyncAt = null;
      await this.syncConnectionRepository.save(syncConnection);
    }
  }

  async forceSync(userId: number): Promise<void> {
    const syncConnections = await this.syncConnectionRepository.find({
      where: { userId, status: SyncStatus.ACTIVE },
    });

    if (syncConnections.length === 0) {
      throw new NotFoundException('No active sync connection found');
    }

    for (const syncConnection of syncConnections) {
      await this.performSync(syncConnection, { triggerAutomationRules: false });
    }
  }

  async syncAllActiveConnections(): Promise<void> {
    const connections = await this.syncConnectionRepository.find({
      where: { status: SyncStatus.ACTIVE },
    });

    const intervalMinutes = this.getSyncIntervalMinutes();
    const now = Date.now();

    for (const connection of connections) {
      if (connection.lastSyncAt) {
        const diffMinutes =
          (now - connection.lastSyncAt.getTime()) / (60 * 1000);
        if (diffMinutes < intervalMinutes) {
          continue;
        }
      }

      try {
        await this.performSync(connection, { triggerAutomationRules: false });
      } catch (error) {
        logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
        this.logger.error(
          `[syncAllActiveConnections] Failed syncing connection ${connection.id}:`,
          error.stack,
        );
      }
    }
  }

  async handleLocalEventCreated(event: Event): Promise<void> {
    if (!this.isSyncableLocalEvent(event)) {
      return;
    }

    const syncedCalendars = await this.syncedCalendarRepository.find({
      where: { localCalendarId: event.calendarId, bidirectionalSync: true },
      relations: ['syncConnection'],
    });

    for (const syncedCalendar of syncedCalendars) {
      if (syncedCalendar.syncConnection.status !== SyncStatus.ACTIVE) {
        continue;
      }

      const existingMapping = await this.syncEventMappingRepository.findOne({
        where: {
          syncedCalendarId: syncedCalendar.id,
          localEventId: event.id,
        },
      });

      if (existingMapping) {
        continue;
      }

      try {
        await this.createExternalEventFromLocal(
          syncedCalendar.syncConnection,
          syncedCalendar,
          event,
        );
      } catch (error) {
        logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
        this.logger.warn(
          `[handleLocalEventCreated] Failed to create external event for local event ${event.id}: ${error.message}`,
        );
      }
    }
  }

  async handleLocalEventUpdated(event: Event): Promise<void> {
    if (!this.isSyncableLocalEvent(event)) {
      return;
    }

    const syncedCalendars = await this.syncedCalendarRepository.find({
      where: { localCalendarId: event.calendarId, bidirectionalSync: true },
      relations: ['syncConnection'],
    });

    for (const syncedCalendar of syncedCalendars) {
      if (syncedCalendar.syncConnection.status !== SyncStatus.ACTIVE) {
        continue;
      }

      const existingMapping = await this.syncEventMappingRepository.findOne({
        where: {
          syncedCalendarId: syncedCalendar.id,
          localEventId: event.id,
        },
      });

      try {
        if (!existingMapping) {
          await this.createExternalEventFromLocal(
            syncedCalendar.syncConnection,
            syncedCalendar,
            event,
          );
          continue;
        }

        await this.updateExternalEventFromLocal(
          syncedCalendar.syncConnection,
          syncedCalendar,
          event,
          existingMapping,
        );
      } catch (error) {
        logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
        this.logger.warn(
          `[handleLocalEventUpdated] Failed to update external event for local event ${event.id}: ${error.message}`,
        );
      }
    }
  }

  async handleLocalEventDeleted(event: Event): Promise<void> {
    const syncedCalendars = await this.syncedCalendarRepository.find({
      where: { localCalendarId: event.calendarId, bidirectionalSync: true },
      relations: ['syncConnection'],
    });

    for (const syncedCalendar of syncedCalendars) {
      if (syncedCalendar.syncConnection.status !== SyncStatus.ACTIVE) {
        continue;
      }

      const existingMapping = await this.syncEventMappingRepository.findOne({
        where: {
          syncedCalendarId: syncedCalendar.id,
          localEventId: event.id,
        },
      });

      if (!existingMapping) {
        continue;
      }

      try {
        await this.deleteExternalEvent(
          syncedCalendar.syncConnection,
          syncedCalendar,
          existingMapping.externalEventId,
        );
      } catch (error) {
        logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
        this.logger.warn(
          `[handleLocalEventDeleted] Failed to delete external event for local event ${event.id}: ${error.message}`,
        );
      } finally {
        await this.syncEventMappingRepository.delete({
          id: existingMapping.id,
        });
      }
    }
  }

  private async deleteSyncedCalendars(
    syncConnection: CalendarSyncConnection,
  ): Promise<void> {
    const syncedCalendars = await this.syncedCalendarRepository.find({
      where: { syncConnectionId: syncConnection.id },
      relations: ['localCalendar'],
    });

    if (syncedCalendars.length === 0) {
      return;
    }

    const calendarIds = syncedCalendars
      .map((syncedCalendar) => syncedCalendar.localCalendarId)
      .filter(Boolean);

    const syncedCalendarIds = syncedCalendars.map((calendar) => calendar.id);

    if (calendarIds.length > 0) {
      await this.calendarRepository.delete({ id: In(calendarIds) });
    }

    if (syncedCalendarIds.length > 0) {
      await this.syncEventMappingRepository.delete({
        syncedCalendarId: In(syncedCalendarIds),
      });
      await this.syncedCalendarRepository.delete({
        id: In(syncedCalendarIds),
      });
    }
  }

  private getNumberConfig(key: string, fallback: number): number {
    const raw = this.configurationService.getValue(key);
    if (!raw) {
      return fallback;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private getSyncWindow(): { startDate: Date; endDate: Date } {
    const lookbackDays = this.getNumberConfig(
      'CALENDAR_SYNC_LOOKBACK_DAYS',
      90,
    );
    const lookaheadDays = this.getNumberConfig(
      'CALENDAR_SYNC_LOOKAHEAD_DAYS',
      365,
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + lookaheadDays);

    return { startDate, endDate };
  }

  private getSyncIntervalMinutes(): number {
    return this.getNumberConfig('CALENDAR_SYNC_POLL_INTERVAL_MINUTES', 5);
  }

  private isSyncableLocalEvent(event: Event): boolean {
    if (!event) {
      return false;
    }

    if (event.recurrenceType !== RecurrenceType.NONE && !event.parentEventId) {
      // Skip recurrence templates; sync instances instead.
      return false;
    }

    return true;
  }

  private async performSync(
    syncConnection: CalendarSyncConnection,
    automationSettings?: {
      triggerAutomationRules?: boolean;
      selectedRuleIds?: number[];
    },
  ): Promise<void> {
    const lockKey = syncConnection.id;
    if (this.activeSyncConnectionIds.has(lockKey)) {
      this.logger.warn(
        `[performSync] Sync already running for provider: ${syncConnection.provider}, user: ${syncConnection.userId}; skipping`,
      );
      return;
    }

    this.activeSyncConnectionIds.add(lockKey);
    try {
      this.logger.log(
        `[performSync] Starting sync for provider: ${syncConnection.provider}, user: ${syncConnection.userId}`,
      );

      // Get all synced calendars for this connection
      const syncedCalendars = await this.syncedCalendarRepository.find({
        where: { syncConnectionId: syncConnection.id },
        relations: ['localCalendar'],
      });

      this.logger.log(
        `[performSync] Found ${syncedCalendars.length} synced calendars`,
      );

      for (const syncedCalendar of syncedCalendars) {
        try {
          this.logger.log(
            `[performSync] Syncing calendar: ${syncedCalendar.externalCalendarName} (${syncedCalendar.externalCalendarId})`,
          );
          await this.syncCalendarEvents(
            syncConnection,
            syncedCalendar,
            automationSettings,
          );
        } catch (error) {
          logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
          this.logger.error(
            `[performSync] Error syncing calendar ${syncedCalendar.externalCalendarId}:`,
            error.stack,
          );
        }
      }

      syncConnection.lastSyncAt = new Date();
      await this.syncConnectionRepository.save(syncConnection);
      this.logger.log(
        `[performSync] Sync completed for provider: ${syncConnection.provider}`,
      );
    } finally {
      this.activeSyncConnectionIds.delete(lockKey);
    }
  }

  private async syncCalendarEvents(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    automationSettings?: {
      triggerAutomationRules?: boolean;
      selectedRuleIds?: number[];
    },
  ): Promise<void> {
    this.logger.log(
      `[syncCalendarEvents] Fetching events for calendar: ${syncedCalendar.externalCalendarId}`,
    );

    const userTimezone = await this.getUserTimezone(syncConnection.userId);
    const touchedLocalEventIds = new Set<number>();

    let externalResult: ExternalEventsResult = {
      events: [],
      deletedEventIds: [],
    };

    if (syncConnection.provider === SyncProvider.MICROSOFT) {
      externalResult = await this.providerService.fetchMicrosoftCalendarEvents(
        syncConnection,
        syncedCalendar.externalCalendarId,
        userTimezone,
        syncedCalendar.syncToken,
      );
    } else if (syncConnection.provider === SyncProvider.GOOGLE) {
      externalResult = await this.providerService.fetchGoogleCalendarEvents(
        syncConnection,
        syncedCalendar.externalCalendarId,
        syncedCalendar.syncToken,
      );
    }

    const { events: externalEvents, deletedEventIds, nextSyncToken } =
      externalResult;

    this.logger.log(
      `[syncCalendarEvents] Found ${externalEvents.length} external events (${deletedEventIds.length} deletions)`,
    );

    // Get existing event mappings
    const existingMappings = await this.syncEventMappingRepository.find({
      where: { syncedCalendarId: syncedCalendar.id },
    });

    const mappingByExternalId = new Map(
      existingMappings.map((m) => [m.externalEventId, m]),
    );

    for (const deletedEventId of deletedEventIds) {
      const mapping = mappingByExternalId.get(deletedEventId);
      if (!mapping) {
        continue;
      }

      await this.deleteLocalEventFromExternal(mapping);
      touchedLocalEventIds.add(mapping.localEventId);
      mappingByExternalId.delete(deletedEventId);
    }

    for (const externalEvent of externalEvents) {
      const mapping = mappingByExternalId.get(externalEvent.id);

      if (!mapping) {
        try {
          const createdEvent = await this.createLocalEventFromExternal(
            syncConnection,
            syncedCalendar,
            externalEvent,
            automationSettings,
            userTimezone,
          );
          if (createdEvent) {
            touchedLocalEventIds.add(createdEvent.id);
          }
        } catch (error) {
          logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
          this.logger.error(
            `[syncCalendarEvents] Error creating local event from external event ${externalEvent.id}:`,
            error.stack,
          );
        }
      } else {
        const externalUpdatedAt = this.getExternalLastModified(externalEvent);
        const lastExternalSync = mapping.lastModifiedExternal;
        const lastLocalChange = mapping.lastModifiedLocal;

        if (
          (lastExternalSync && externalUpdatedAt <= lastExternalSync) ||
          (lastLocalChange && externalUpdatedAt <= lastLocalChange)
        ) {
          continue;
        }

        try {
          const updatedEvent = await this.updateLocalEventFromExternal(
            syncConnection,
            syncedCalendar,
            externalEvent,
            mapping,
            userTimezone,
          );
          if (updatedEvent) {
            touchedLocalEventIds.add(updatedEvent.id);
          }
        } catch (error) {
          logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
          this.logger.error(
            `[syncCalendarEvents] Error updating local event from external event ${externalEvent.id}:`,
            error.stack,
          );
        }
      }
    }

    if (nextSyncToken) {
      syncedCalendar.syncToken = nextSyncToken;
    }

    // Update lastSyncAt for this calendar
    syncedCalendar.lastSyncAt = new Date();
    await this.syncedCalendarRepository.save(syncedCalendar);

    if (syncedCalendar.bidirectionalSync) {
      await this.syncLocalCalendarChanges(
        syncConnection,
        syncedCalendar,
        touchedLocalEventIds,
      );
    }
  }

  private async syncLocalCalendarChanges(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    skipEventIds: Set<number>,
  ): Promise<void> {
    const { startDate, endDate } = this.getSyncWindow();

    const [localEvents, localEventIds, existingMappings] = await Promise.all([
      this.eventRepository
        .createQueryBuilder('event')
        .where('event.calendarId = :calendarId', {
          calendarId: syncedCalendar.localCalendarId,
        })
        .andWhere('event.startDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getMany(),
      this.eventRepository.find({
        where: { calendarId: syncedCalendar.localCalendarId },
        select: ['id'],
      }),
      this.syncEventMappingRepository.find({
        where: { syncedCalendarId: syncedCalendar.id },
      }),
    ]);

    const localIdSet = new Set(localEventIds.map((event) => event.id));
    const mappingByLocalId = new Map(
      existingMappings.map((mapping) => [mapping.localEventId, mapping]),
    );

    for (const localEvent of localEvents) {
      if (skipEventIds.has(localEvent.id)) {
        continue;
      }

      if (!this.isSyncableLocalEvent(localEvent)) {
        continue;
      }

      const mapping = mappingByLocalId.get(localEvent.id);
      if (!mapping) {
        try {
          await this.createExternalEventFromLocal(
            syncConnection,
            syncedCalendar,
            localEvent,
          );
        } catch (error) {
          logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
          this.logger.warn(
            `[syncLocalCalendarChanges] Failed to create external event for local event ${localEvent.id}: ${error.message}`,
          );
        }
        continue;
      }

      const lastLocalSync = mapping.lastModifiedLocal ?? new Date(0);
      const lastExternalSync = mapping.lastModifiedExternal ?? new Date(0);
      const localUpdatedAt = localEvent.updatedAt ?? localEvent.createdAt;

      if (
        localUpdatedAt > lastLocalSync &&
        localUpdatedAt > lastExternalSync
      ) {
        try {
          await this.updateExternalEventFromLocal(
            syncConnection,
            syncedCalendar,
            localEvent,
            mapping,
          );
        } catch (error) {
          logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
          this.logger.warn(
            `[syncLocalCalendarChanges] Failed to update external event for local event ${localEvent.id}: ${error.message}`,
          );
        }
      }
    }

    for (const mapping of existingMappings) {
      if (localIdSet.has(mapping.localEventId)) {
        continue;
      }

      try {
        await this.deleteExternalEvent(
          syncConnection,
          syncedCalendar,
          mapping.externalEventId,
        );
      } catch (error) {
        logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
        this.logger.warn(
          `[syncLocalCalendarChanges] Failed to delete external event ${mapping.externalEventId}: ${error.message}`,
        );
      } finally {
        await this.syncEventMappingRepository.delete({ id: mapping.id });
      }
    }
  }

  private async createExternalEventFromLocal(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    localEvent: Event,
  ): Promise<void> {
    const userTimezone = await this.getUserTimezone(syncConnection.userId);
    const payload = this.providerService.buildExternalEventPayload(
      syncConnection.provider,
      localEvent,
      userTimezone,
    );

    if (!payload) {
      return;
    }

    const encodedCalendarId = encodeURIComponent(
      syncedCalendar.externalCalendarId,
    );
    const url =
      syncConnection.provider === SyncProvider.GOOGLE
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`
        : `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}/events`;

    const response = await this.providerService.fetchWithAuth(syncConnection, url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `[createExternalEventFromLocal] Failed to create external event for local event ${localEvent.id}: ${response.status} - ${errorText}`,
      );
      return;
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : null;
    if (!data?.id) {
      return;
    }

    const mapping = this.syncEventMappingRepository.create({
      syncedCalendarId: syncedCalendar.id,
      localEventId: localEvent.id,
      externalEventId: data.id,
      lastModifiedLocal: localEvent.updatedAt ?? new Date(),
      lastModifiedExternal: this.getExternalLastModified(data),
    });

    await this.syncEventMappingRepository.save(mapping);
  }

  private async updateExternalEventFromLocal(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    localEvent: Event,
    existingMapping: SyncEventMapping,
  ): Promise<void> {
    const userTimezone = await this.getUserTimezone(syncConnection.userId);
    const payload = this.providerService.buildExternalEventPayload(
      syncConnection.provider,
      localEvent,
      userTimezone,
    );

    if (!payload) {
      return;
    }

    const encodedCalendarId = encodeURIComponent(
      syncedCalendar.externalCalendarId,
    );
    const encodedExternalEventId = encodeURIComponent(
      existingMapping.externalEventId,
    );
    const url =
      syncConnection.provider === SyncProvider.GOOGLE
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodedExternalEventId}`
        : `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}/events/${encodedExternalEventId}`;

    const response = await this.providerService.fetchWithAuth(syncConnection, url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `[updateExternalEventFromLocal] Failed to update external event for local event ${localEvent.id}: ${response.status} - ${errorText}`,
      );
      return;
    }

    let data: any = null;
    const responseText = await response.text();
    if (responseText) {
      data = JSON.parse(responseText);
    }

    existingMapping.lastModifiedLocal = localEvent.updatedAt ?? new Date();
    if (data) {
      existingMapping.lastModifiedExternal = this.getExternalLastModified(data);
    }
    await this.syncEventMappingRepository.save(existingMapping);
  }

  private async deleteExternalEvent(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    externalEventId: string,
  ): Promise<void> {
    const encodedCalendarId = encodeURIComponent(
      syncedCalendar.externalCalendarId,
    );
    const encodedExternalEventId = encodeURIComponent(externalEventId);
    const url =
      syncConnection.provider === SyncProvider.GOOGLE
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodedExternalEventId}`
        : `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}/events/${encodedExternalEventId}`;

    const response = await this.providerService.fetchWithAuth(syncConnection, url, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      this.logger.warn(
        `[deleteExternalEvent] Failed to delete external event ${externalEventId}: ${response.status} - ${errorText}`,
      );
    }
  }

  private async deleteLocalEventFromExternal(
    mapping: SyncEventMapping,
  ): Promise<void> {
    const localEvent = await this.eventRepository.findOne({
      where: { id: mapping.localEventId },
    });

    if (localEvent) {
      await this.eventRepository.remove(localEvent);
    }

    await this.syncEventMappingRepository.delete({ id: mapping.id });
  }

  private async getUserTimezone(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['timezone'],
    });
    return this.mapperService.getSafeUserTimezone(user?.timezone);
  }

  private getExternalLastModified(externalEvent: any): Date {
    const source =
      externalEvent?.lastModifiedDateTime || externalEvent?.updated || null;
    const parsed = source ? new Date(source) : new Date();
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private isUniqueConstraintViolation(error: any): boolean {
    const code = error?.code || error?.driverError?.code;
    return code === '23505';
  }

  private needsMicrosoftEventDetails(externalEvent: any): boolean {
    if (!externalEvent) {
      return false;
    }

    const subject = externalEvent.subject;
    const hasSubject =
      typeof subject === 'string' ? subject.trim().length > 0 : !!subject;

    const bodyContent =
      typeof externalEvent.body?.content === 'string'
        ? externalEvent.body.content.trim()
        : '';
    const bodyPreview =
      typeof externalEvent.bodyPreview === 'string'
        ? externalEvent.bodyPreview.trim()
        : '';

    if (!hasSubject) return true;
    if (!bodyContent && bodyPreview) return true;
    if (bodyPreview && bodyContent && bodyPreview.length >= 200) {
      return bodyContent.length <= bodyPreview.length;
    }

    return false;
  }

  private async createLocalEventFromExternal(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    externalEvent: any,
    automationSettings?: {
      triggerAutomationRules?: boolean;
      selectedRuleIds?: number[];
    },
    userTimezone?: string,
  ): Promise<Event | null> {
    const resolvedUserTimezone =
      userTimezone ||
      (await this.getUserTimezone(syncConnection.userId)) ||
      'UTC';

    let eventSource = externalEvent;
    if (
      syncConnection.provider === SyncProvider.MICROSOFT &&
      this.needsMicrosoftEventDetails(externalEvent) &&
      externalEvent?.id
    ) {
      this.logger.warn(
        `[createLocalEventFromExternal] Missing event details for event ${externalEvent.id}; fetching full details`,
      );
      const details = await this.providerService.fetchMicrosoftEventDetails(
        syncConnection,
        syncedCalendar.externalCalendarId,
        externalEvent.id,
        resolvedUserTimezone,
      );
      if (details) {
        eventSource = { ...externalEvent, ...details };
      }
    }

    this.logger.log(
      `[createLocalEventFromExternal] Creating local event from external: ${eventSource.id} - ${eventSource.subject || eventSource.summary}`,
    );

    const eventData = this.mapperService.buildLocalEventData(
      syncConnection.provider,
      eventSource,
      resolvedUserTimezone,
    );

    // Create the local event
    const localEvent = this.eventRepository.create({
      ...eventData,
      calendarId: syncedCalendar.localCalendarId,
      createdById: syncConnection.userId,
      color: syncedCalendar.localCalendar.color,
    });

    const savedEvent = (await this.eventRepository.save(
      localEvent,
    )) as unknown as Event;

    // Create event mapping
    const eventMapping = this.syncEventMappingRepository.create({
      syncedCalendarId: syncedCalendar.id,
      localEventId: savedEvent.id,
      externalEventId: eventSource.id,
      lastModifiedExternal: new Date(
        this.getExternalLastModified(eventSource),
      ),
      lastModifiedLocal: savedEvent.updatedAt ?? new Date(),
    });

    try {
      await this.syncEventMappingRepository.save(eventMapping);
    } catch (error) {
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      if (this.isUniqueConstraintViolation(error)) {
        this.logger.warn(
          `[createLocalEventFromExternal] Duplicate mapping for external event ${eventSource.id}; removing local event ${savedEvent.id}`,
        );
        await this.eventRepository.delete({ id: savedEvent.id });
        return null;
      }
      throw error;
    }

    // Trigger automation rules for calendar.imported only if enabled
    if (automationSettings?.triggerAutomationRules) {
      this.triggerCalendarImportRules(
        savedEvent,
        syncConnection.userId,
        automationSettings.selectedRuleIds,
      ).catch((err) => this.logger.error('Automation trigger error:', err));
    }

    this.logger.log(
      `[createLocalEventFromExternal] Created local event ID: ${savedEvent.id} mapped to external ID: ${externalEvent.id}`,
    );

    return savedEvent;
  }

  private async updateLocalEventFromExternal(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    externalEvent: any,
    existingMapping: SyncEventMapping,
    userTimezone: string,
  ): Promise<Event | null> {
    const localEvent = await this.eventRepository.findOne({
      where: { id: existingMapping.localEventId },
    });

    if (!localEvent) {
      // Mapping is stale; recreate event and mapping
      const recreatedEvent = await this.createLocalEventFromExternal(
        syncConnection,
        syncedCalendar,
        externalEvent,
        undefined,
        userTimezone,
      );
      return recreatedEvent;
    }

    let eventSource = externalEvent;
    if (
      syncConnection.provider === SyncProvider.MICROSOFT &&
      this.needsMicrosoftEventDetails(externalEvent) &&
      externalEvent?.id
    ) {
      this.logger.warn(
        `[updateLocalEventFromExternal] Missing event details for event ${externalEvent.id}; fetching full details`,
      );
      const details = await this.providerService.fetchMicrosoftEventDetails(
        syncConnection,
        syncedCalendar.externalCalendarId,
        externalEvent.id,
        userTimezone,
      );
      if (details) {
        eventSource = { ...externalEvent, ...details };
      }
    }

    const eventData = this.mapperService.buildLocalEventData(
      syncConnection.provider,
      eventSource,
      userTimezone,
    );

    const before = {
      startDate: localEvent.startDate,
      startTime: localEvent.startTime,
      endDate: localEvent.endDate,
      endTime: localEvent.endTime,
    };

    for (const [key, value] of Object.entries(eventData)) {
      if (value !== undefined) {
        (localEvent as any)[key] = value as any;
      }
    }

    await this.eventRepository.save(localEvent);

    existingMapping.lastModifiedExternal = this.getExternalLastModified(
      externalEvent,
    );
    existingMapping.lastModifiedLocal = localEvent.updatedAt ?? new Date();
    await this.syncEventMappingRepository.save(existingMapping);

    this.logger.log(
      `[updateLocalEventFromExternal] Updated local event ID: ${
        localEvent.id
      } from external ID: ${externalEvent.id}; start ${before.startTime} -> ${
        localEvent.startTime
      }, end ${before.endTime} -> ${localEvent.endTime}`,
    );

    return localEvent;
  }

  /**
   * Trigger automation rules for calendar import events
   * Executes asynchronously without blocking the sync flow
   * Triggers event.created, event.updated, and calendar.imported rules
   */
  private async triggerCalendarImportRules(
    event: Event,
    userId: number,
    selectedRuleIds?: number[],
  ): Promise<void> {
    if (!this.automationService) {
      return; // Automation service not available (optional dependency)
    }

    try {
      // Load event with calendar relationship
      const fullEvent = await this.eventRepository.findOne({
        where: { id: event.id },
        relations: ['calendar'],
      });

      if (!fullEvent) return;

      // Collect all rules to execute
      let allRules: any[] = [];

      // Get event.created rules (since we're creating events during import)
      const createdRules = await this.automationService.findRulesByTrigger?.(
        'event.created',
        userId,
      );
      if (createdRules && createdRules.length > 0) {
        allRules = allRules.concat(createdRules);
      }

      // Get calendar.imported rules (specific to import)
      const importedRules = await this.automationService.findRulesByTrigger?.(
        'calendar.imported',
        userId,
      );
      if (importedRules && importedRules.length > 0) {
        allRules = allRules.concat(importedRules);
      }

      if (allRules.length === 0) return;

      // Filter rules if specific rule IDs are provided
      const rulesToExecute =
        selectedRuleIds && selectedRuleIds.length > 0
          ? allRules.filter((rule) => selectedRuleIds.includes(rule.id))
          : allRules;

      if (rulesToExecute.length === 0) return;

      this.logger.log(
        `[triggerCalendarImportRules] Executing ${rulesToExecute.length} automation rules for imported event ${event.id} (${rulesToExecute.map((r) => r.triggerType).join(', ')})`,
      );

      // Execute each rule asynchronously
      for (const rule of rulesToExecute) {
        this.automationService
          .executeRuleOnEvent(rule, fullEvent)
          .catch((error: Error) => {
            this.logger.error(
              `Failed to execute automation rule ${rule.id} (${rule.triggerType}) on imported event ${event.id}:`,
              error.message,
            );
          });
      }
    } catch (error) {
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      this.logger.error(
        'Error triggering calendar import automation rules:',
        error,
      );
    }
  }
}


