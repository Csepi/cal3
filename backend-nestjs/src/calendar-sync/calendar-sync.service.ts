import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
  SyncProvider,
  SyncStatus,
} from '../entities/calendar-sync.entity';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event, RecurrenceType } from '../entities/event.entity';
import {
  CalendarSyncStatusDto,
  SyncCalendarsDto,
  ExternalCalendarDto,
  SyncedCalendarInfoDto,
  ProviderSyncStatusDto,
} from '../dto/calendar-sync.dto';
import { ConfigurationService } from '../configuration/configuration.service';

type ExternalEventsResult = {
  events: any[];
  deletedEventIds: string[];
  nextSyncToken?: string;
};

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly activeSyncConnectionIds = new Set<number>();

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
    @Inject(
      forwardRef(
        () => require('../automation/automation.service').AutomationService,
      ),
    )
    private automationService?: any,
  ) {}

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
          await this.getExternalCalendars(syncConnection);

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
    // Generate state parameter for security with calendar-sync identifier and user ID
    const state = `calendar-sync-${userId}-${Math.random().toString(36).substring(2, 15)}`;

    if (provider === SyncProvider.GOOGLE) {
      const clientId =
        this.configurationService.getValue('GOOGLE_CLIENT_ID') || '';
      const redirectUri =
        this.configurationService.getValue(
          'GOOGLE_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/google`;
      const scope =
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile';

      return (
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`
      );
    } else if (provider === SyncProvider.MICROSOFT) {
      const clientId =
        this.configurationService.getValue('MICROSOFT_CLIENT_ID') || '';
      const redirectUri =
        this.configurationService.getValue(
          'MICROSOFT_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/microsoft`;
      const scope =
        'https://graph.microsoft.com/calendars.readwrite offline_access';

      return (
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `response_mode=query&` +
        `state=${state}`
      );
    }

    throw new BadRequestException('Unsupported provider');
  }

  async handleOAuthCallback(
    provider: SyncProvider,
    code: string,
    userId: number,
  ): Promise<void> {
    this.logger.log(
      `[handleOAuthCallback] Starting OAuth callback for provider: ${provider}, userId: ${userId}`,
    );

    try {
      // Exchange code for tokens
      this.logger.log(
        `[handleOAuthCallback] Exchanging authorization code for tokens...`,
      );
      const tokens = await this.exchangeCodeForTokens(provider, code);
      this.logger.log(
        `[handleOAuthCallback] Successfully received tokens for user: ${tokens.userId}`,
      );

      // Store or update sync connection
      this.logger.log(
        `[handleOAuthCallback] Looking for existing sync connection for userId: ${userId}, provider: ${provider}`,
      );
      let syncConnection = await this.syncConnectionRepository.findOne({
        where: { userId, provider },
      });

      if (syncConnection) {
        this.logger.log(
          `[handleOAuthCallback] Updating existing sync connection with ID: ${syncConnection.id}`,
        );
        syncConnection.accessToken = tokens.accessToken;
        if (tokens.refreshToken) {
          syncConnection.refreshToken = tokens.refreshToken;
        }
        syncConnection.tokenExpiresAt = tokens.expiresAt;
        syncConnection.status = SyncStatus.ACTIVE;
      } else {
        this.logger.log(
          `[handleOAuthCallback] Creating new sync connection for userId: ${userId}`,
        );
        syncConnection = this.syncConnectionRepository.create({
          userId,
          provider,
          providerUserId: tokens.userId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          status: SyncStatus.ACTIVE,
        });
      }

      this.logger.log(
        `[handleOAuthCallback] Saving sync connection to database...`,
      );
      await this.syncConnectionRepository.save(syncConnection);
      this.logger.log(
        `[handleOAuthCallback] OAuth callback completed successfully for provider: ${provider}`,
      );
    } catch (error) {
      this.logger.error(
        `[handleOAuthCallback] Error in OAuth callback for provider ${provider}:`,
        error.stack,
      );
      throw error;
    }
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
        externalCalendarName: await this.getExternalCalendarName(
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

  private getMicrosoftSyncWindow(): { startDate: Date; endDate: Date } {
    const { startDate, endDate } = this.getSyncWindow();
    const maxWindowDays = 365;
    const maxWindowMs = maxWindowDays * 24 * 60 * 60 * 1000;
    const windowMs = endDate.getTime() - startDate.getTime();

    if (windowMs <= maxWindowMs) {
      return { startDate, endDate };
    }

    const cappedStartDate = new Date(endDate.getTime() - maxWindowMs);
    return { startDate: cappedStartDate, endDate };
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

  private async ensureValidAccessToken(
    syncConnection: CalendarSyncConnection,
  ): Promise<CalendarSyncConnection> {
    if (!syncConnection?.tokenExpiresAt) {
      return syncConnection;
    }

    const expiresAt = new Date(syncConnection.tokenExpiresAt).getTime();
    const now = Date.now();
    const bufferMs = 60 * 1000;

    if (expiresAt - now > bufferMs) {
      return syncConnection;
    }

    if (!syncConnection.refreshToken) {
      this.logger.warn(
        `[ensureValidAccessToken] Missing refresh token for connection ${syncConnection.id}`,
      );
      return syncConnection;
    }

    return this.refreshAccessToken(syncConnection);
  }

  private async refreshAccessToken(
    syncConnection: CalendarSyncConnection,
  ): Promise<CalendarSyncConnection> {
    if (!syncConnection.refreshToken) {
      return syncConnection;
    }

    let tokenUrl = '';
    let tokenRequestParams: Record<string, string> = {};

    if (syncConnection.provider === SyncProvider.GOOGLE) {
      tokenUrl = 'https://oauth2.googleapis.com/token';
      tokenRequestParams = {
        client_id: this.configurationService.getValue('GOOGLE_CLIENT_ID') || '',
        client_secret:
          this.configurationService.getValue('GOOGLE_CLIENT_SECRET') || '',
        refresh_token: syncConnection.refreshToken,
        grant_type: 'refresh_token',
      };
    } else if (syncConnection.provider === SyncProvider.MICROSOFT) {
      const tenant =
        this.configurationService.getValue('MICROSOFT_TENANT_ID') || 'common';
      tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
      tokenRequestParams = {
        client_id:
          this.configurationService.getValue('MICROSOFT_CLIENT_ID') || '',
        client_secret:
          this.configurationService.getValue('MICROSOFT_CLIENT_SECRET') || '',
        refresh_token: syncConnection.refreshToken,
        grant_type: 'refresh_token',
        scope:
          'https://graph.microsoft.com/calendars.readwrite offline_access',
      };
    }

    if (!tokenUrl) {
      return syncConnection;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `[refreshAccessToken] Failed to refresh tokens for connection ${syncConnection.id}: ${response.status} - ${errorText}`,
      );
      return syncConnection;
    }

    const data = await response.json();
    if (!data.access_token) {
      this.logger.error(
        `[refreshAccessToken] Missing access token in refresh response for connection ${syncConnection.id}`,
      );
      return syncConnection;
    }

    syncConnection.accessToken = data.access_token;
    if (data.refresh_token) {
      syncConnection.refreshToken = data.refresh_token;
    }
    if (data.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      syncConnection.tokenExpiresAt = expiresAt;
    }

    await this.syncConnectionRepository.save(syncConnection);
    return syncConnection;
  }

  private async fetchWithAuth(
    syncConnection: CalendarSyncConnection,
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const currentConnection = await this.ensureValidAccessToken(syncConnection);
    const headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${currentConnection.accessToken}`,
    };

    const response = await fetch(url, { ...init, headers });
    if (response.status !== 401) {
      return response;
    }

    if (!currentConnection.refreshToken) {
      return response;
    }

    const refreshed = await this.refreshAccessToken(currentConnection);
    const retryHeaders = {
      ...(init.headers || {}),
      Authorization: `Bearer ${refreshed.accessToken}`,
    };

    return fetch(url, { ...init, headers: retryHeaders });
  }

  private async getExternalCalendars(
    syncConnection: CalendarSyncConnection,
  ): Promise<ExternalCalendarDto[]> {
    try {
      if (syncConnection.provider === SyncProvider.GOOGLE) {
        const response = await this.fetchWithAuth(
          syncConnection,
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          { headers: {} },
        );

        if (!response.ok) {
          console.error(
            'Failed to fetch Google calendars:',
            response.statusText,
          );
          return [];
        }

        const data = await response.json();
        return (
          data.items?.map((calendar) => ({
            id: calendar.id,
            name: calendar.summary,
            description: calendar.description,
            primary: calendar.primary || false,
            accessRole: calendar.accessRole,
          })) || []
        );
      } else if (syncConnection.provider === SyncProvider.MICROSOFT) {
        const response = await this.fetchWithAuth(
          syncConnection,
          'https://graph.microsoft.com/v1.0/me/calendars',
          { headers: {} },
        );

        if (!response.ok) {
          console.error(
            'Failed to fetch Microsoft calendars:',
            response.statusText,
          );
          return [];
        }

        const data = await response.json();
        return (
          data.value?.map((calendar) => ({
            id: calendar.id,
            name: calendar.name,
            description: calendar.description,
            primary: calendar.isDefaultCalendar || false,
          })) || []
        );
      }
    } catch (error) {
      console.error('Error fetching external calendars:', error);
    }

    return [];
  }

  private async exchangeCodeForTokens(
    provider: SyncProvider,
    code: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    userId: string;
  }> {
    this.logger.log(
      `[exchangeCodeForTokens] Starting token exchange for provider: ${provider}`,
    );

    if (provider === SyncProvider.GOOGLE) {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const redirectUri =
        this.configurationService.getValue(
          'GOOGLE_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/google`;
      const clientId =
        this.configurationService.getValue('GOOGLE_CLIENT_ID') || '';
      const clientSecret =
        this.configurationService.getValue('GOOGLE_CLIENT_SECRET') || '';

      this.logger.log(
        `[exchangeCodeForTokens] Google - Using redirect URI: ${redirectUri}`,
      );
      this.logger.log(
        `[exchangeCodeForTokens] Google - Client ID: ${clientId.substring(0, 10)}...`,
      );

      const tokenRequestParams = {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };

      this.logger.log(
        `[exchangeCodeForTokens] Google - Making token request to: ${tokenUrl}`,
      );

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestParams),
      });

      this.logger.log(
        `[exchangeCodeForTokens] Google - Token response status: ${response.status}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[exchangeCodeForTokens] Google - Token exchange failed: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.logger.log(
        `[exchangeCodeForTokens] Google - Token exchange successful, expires_in: ${data.expires_in}`,
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      // Get user info
      this.logger.log(`[exchangeCodeForTokens] Google - Fetching user info...`);
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.error(
          `[exchangeCodeForTokens] Google - User info fetch failed: ${userInfoResponse.status} - ${errorText}`,
        );
        throw new BadRequestException('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      this.logger.log(
        `[exchangeCodeForTokens] Google - User info received for user: ${userInfo.id}`,
      );

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt,
        userId: userInfo.id,
      };
    } else if (provider === SyncProvider.MICROSOFT) {
      const tokenUrl =
        'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const redirectUri =
        this.configurationService.getValue(
          'MICROSOFT_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/microsoft`;
      const clientId =
        this.configurationService.getValue('MICROSOFT_CLIENT_ID') || '';
      const clientSecret =
        this.configurationService.getValue('MICROSOFT_CLIENT_SECRET') || '';

      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Using redirect URI: ${redirectUri}`,
      );
      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Client ID: ${clientId.substring(0, 10)}...`,
      );

      const tokenRequestParams = {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };

      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Making token request to: ${tokenUrl}`,
      );

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestParams),
      });

      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Token response status: ${response.status}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[exchangeCodeForTokens] Microsoft - Token exchange failed: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Token exchange successful, expires_in: ${data.expires_in}`,
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      // Get user info
      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - Fetching user info...`,
      );
      const userInfoResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.error(
          `[exchangeCodeForTokens] Microsoft - User info fetch failed: ${userInfoResponse.status} - ${errorText}`,
        );
        throw new BadRequestException('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      this.logger.log(
        `[exchangeCodeForTokens] Microsoft - User info received for user: ${userInfo.id}`,
      );

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt,
        userId: userInfo.id,
      };
    }

    this.logger.error(
      `[exchangeCodeForTokens] Unsupported provider: ${provider}`,
    );
    throw new BadRequestException('Unsupported provider');
  }

  private async getExternalCalendarName(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
  ): Promise<string> {
    const encodedCalendarId = encodeURIComponent(calendarId);
    try {
      if (syncConnection.provider === SyncProvider.GOOGLE) {
        const response = await this.fetchWithAuth(
          syncConnection,
          `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}`,
          { headers: {} },
        );

        if (response.ok) {
          const data = await response.json();
          return data.summary || `Calendar ${calendarId}`;
        }
      } else if (syncConnection.provider === SyncProvider.MICROSOFT) {
        const response = await this.fetchWithAuth(
          syncConnection,
          `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}`,
          { headers: {} },
        );

        if (response.ok) {
          const data = await response.json();
          return data.name || `Calendar ${calendarId}`;
        }
      }
    } catch (error) {
      console.error('Error fetching calendar name:', error);
    }

    return `External Calendar ${calendarId}`;
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
      externalResult = await this.fetchMicrosoftCalendarEvents(
        syncConnection,
        syncedCalendar.externalCalendarId,
        userTimezone,
        syncedCalendar.syncToken,
      );
    } else if (syncConnection.provider === SyncProvider.GOOGLE) {
      externalResult = await this.fetchGoogleCalendarEvents(
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

  private async fetchMicrosoftCalendarEvents(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    userTimezone: string,
    syncToken?: string | null,
  ): Promise<ExternalEventsResult> {
    const { startDate, endDate } = this.getMicrosoftSyncWindow();
    const deletedEventIds: string[] = [];
    const events: any[] = [];

    const hasTopParam = (value?: string | null): boolean =>
      !!value && /(\$top=|%24top=)/i.test(value);
    const hasSelectParam = (value?: string | null): boolean =>
      !!value && /(\$select=|%24select=)/i.test(value);
    const sanitizeDeltaUrl = (value?: string | null): string | undefined => {
      if (!value) return undefined;

      try {
        const parsed = new URL(value);
        if (parsed.searchParams.has('$top')) {
          parsed.searchParams.delete('$top');
          return parsed.toString();
        }
        return value;
      } catch {
        const cleaned = value.replace(
          /([?&])(?:%24|\$)top=[^&]*&?/gi,
          '$1',
        );
        return cleaned.replace(/[?&]$/, '');
      }
    };

    const encodedCalendarId = encodeURIComponent(calendarId);
    const baseUrl = `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}/calendarView/delta`;
    const selectFields = [
      'id',
      'subject',
      'body',
      'bodyPreview',
      'location',
      'isAllDay',
      'start',
      'end',
      'seriesMasterId',
      'originalStart',
      'originalStartTimeZone',
      'originalEndTimeZone',
      'lastModifiedDateTime',
    ];
    const initialParams = new URLSearchParams({
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      $select: selectFields.join(','),
    });

    let effectiveSyncToken = sanitizeDeltaUrl(syncToken);
    if (hasTopParam(effectiveSyncToken)) {
      this.logger.warn(
        `[fetchMicrosoftCalendarEvents] Sync token contains $top; clearing token to avoid Graph errors`,
      );
      effectiveSyncToken = undefined;
    }
    if (effectiveSyncToken && !hasSelectParam(effectiveSyncToken)) {
      this.logger.warn(
        `[fetchMicrosoftCalendarEvents] Sync token missing $select; clearing token to refresh event bodies for calendar ${calendarId}`,
      );
      effectiveSyncToken = undefined;
    }

    let nextUrl: string | undefined =
      effectiveSyncToken || `${baseUrl}?${initialParams.toString()}`;
    let deltaLink: string | undefined;
    const preferTimeZone = this.getMicrosoftTimeZone(userTimezone);
    const preferParts = [
      'odata.maxpagesize=1000',
      'outlook.body-content-type="text"',
    ];
    if (preferTimeZone) {
      preferParts.unshift(`outlook.timezone="${preferTimeZone}"`);
    }
    const headers: Record<string, string> = {
      Prefer: preferParts.join(', '),
    };

    try {
      while (nextUrl) {
        const sanitizedNextUrl = sanitizeDeltaUrl(nextUrl) || nextUrl;
        const response = await this.fetchWithAuth(syncConnection, sanitizedNextUrl, {
          headers,
        });

        if (response.status === 410 && syncToken) {
          this.logger.warn(
            `[fetchMicrosoftCalendarEvents] Delta token expired for calendar ${calendarId}, performing full sync`,
          );
          return this.fetchMicrosoftCalendarEvents(
            syncConnection,
            calendarId,
            userTimezone,
          );
        }

        if (!response.ok) {
          const errorText = await response.text();
          const errorSuffix = errorText ? ` - ${errorText}` : '';
          const hasTopError =
            response.status === 400 &&
            errorText.includes('ErrorInvalidUrlQuery') &&
            errorText.includes('$top');
          if (hasTopError && effectiveSyncToken) {
            this.logger.warn(
              `[fetchMicrosoftCalendarEvents] Graph rejected $top in delta token; retrying full sync`,
            );
            return this.fetchMicrosoftCalendarEvents(
              syncConnection,
              calendarId,
              userTimezone,
            );
          }
          this.logger.error(
            `[fetchMicrosoftCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}${errorSuffix}`,
          );
          break;
        }

        const data = await response.json();
        const values = data.value || [];
        for (const item of values) {
          if (item['@removed']) {
            deletedEventIds.push(item.id);
            continue;
          }
          events.push(item);
        }

        nextUrl = sanitizeDeltaUrl(data['@odata.nextLink']);
        if (data['@odata.deltaLink']) {
          deltaLink = sanitizeDeltaUrl(data['@odata.deltaLink']);
        }
      }
    } catch (error) {
      this.logger.error(`[fetchMicrosoftCalendarEvents] Error:`, error.stack);
    }

    if (events.length > 0 || deletedEventIds.length > 0) {
      this.logger.log(
        `[fetchMicrosoftCalendarEvents] Fetched ${events.length} events (${deletedEventIds.length} deletions) for calendar ${calendarId}`,
      );
    }

    return {
      events,
      deletedEventIds,
      nextSyncToken: deltaLink || effectiveSyncToken || undefined,
    };
  }

  private async fetchGoogleCalendarEvents(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    syncToken?: string | null,
  ): Promise<ExternalEventsResult> {
    const { startDate, endDate } = this.getSyncWindow();
    const events: any[] = [];
    const deletedEventIds: string[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;

    const baseParams = new URLSearchParams({
      maxResults: '2500',
      singleEvents: 'true',
      showDeleted: 'true',
    });

    if (syncToken) {
      baseParams.set('syncToken', syncToken);
    } else {
      baseParams.set('timeMin', startDate.toISOString());
      baseParams.set('timeMax', endDate.toISOString());
      baseParams.set('orderBy', 'startTime');
    }

    try {
      do {
        const params = new URLSearchParams(baseParams);
        if (pageToken) {
          params.set('pageToken', pageToken);
        }

        const response = await this.fetchWithAuth(
          syncConnection,
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
          { headers: {} },
        );

        if (response.status === 410 && syncToken) {
          this.logger.warn(
            `[fetchGoogleCalendarEvents] Sync token expired for calendar ${calendarId}, performing full sync`,
          );
          return this.fetchGoogleCalendarEvents(
            syncConnection,
            calendarId,
          );
        }

        if (!response.ok) {
          this.logger.error(
            `[fetchGoogleCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}`,
          );
          break;
        }

        const data = await response.json();
        const items = data.items || [];

        for (const item of items) {
          if (item.status === 'cancelled') {
            deletedEventIds.push(item.id);
            continue;
          }
          events.push(item);
        }

        pageToken = data.nextPageToken;
        if (data.nextSyncToken) {
          nextSyncToken = data.nextSyncToken;
        }
      } while (pageToken);
    } catch (error) {
      this.logger.error(`[fetchGoogleCalendarEvents] Error:`, error.stack);
    }

    if (events.length > 0 || deletedEventIds.length > 0) {
      this.logger.log(
        `[fetchGoogleCalendarEvents] Fetched ${events.length} events (${deletedEventIds.length} deletions) for calendar ${calendarId}`,
      );
    }

    return { events, deletedEventIds, nextSyncToken };
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
    const payload = this.buildExternalEventPayload(
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

    const response = await this.fetchWithAuth(syncConnection, url, {
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
    const payload = this.buildExternalEventPayload(
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

    const response = await this.fetchWithAuth(syncConnection, url, {
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

    const response = await this.fetchWithAuth(syncConnection, url, {
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

  private buildExternalEventPayload(
    provider: SyncProvider,
    localEvent: Event,
    userTimezone: string,
  ): Record<string, any> | null {
    const { startDateTime, endDateTime, startDate, endDate } =
      this.buildEventDateRange(localEvent, userTimezone);

    if (localEvent.isAllDay && (!startDate || !endDate)) {
      return null;
    }

    if (!localEvent.isAllDay && (!startDateTime || !endDateTime)) {
      return null;
    }

    if (provider === SyncProvider.GOOGLE) {
      return {
        summary: localEvent.title,
        description: localEvent.description || '',
        location: localEvent.location || '',
        start: localEvent.isAllDay
          ? { date: startDate }
          : { dateTime: startDateTime, timeZone: userTimezone },
        end: localEvent.isAllDay
          ? { date: endDate }
          : { dateTime: endDateTime, timeZone: userTimezone },
      };
    }

    if (provider === SyncProvider.MICROSOFT) {
      const microsoftTimezone =
        this.getMicrosoftTimeZone(userTimezone) || userTimezone;
      const payload: any = {
        subject: localEvent.title,
        body: {
          contentType: 'HTML',
          content: localEvent.description || '',
        },
        isAllDay: localEvent.isAllDay,
        start: localEvent.isAllDay
          ? { dateTime: startDateTime, timeZone: microsoftTimezone }
          : { dateTime: startDateTime, timeZone: microsoftTimezone },
        end: localEvent.isAllDay
          ? { dateTime: endDateTime, timeZone: microsoftTimezone }
          : { dateTime: endDateTime, timeZone: microsoftTimezone },
      };

      if (localEvent.location) {
        payload.location = { displayName: localEvent.location };
      }

      return payload;
    }

    return null;
  }

  private buildEventDateRange(
    localEvent: Event,
    userTimezone: string,
  ): {
    startDateTime?: string;
    endDateTime?: string;
    startDate?: string;
    endDate?: string;
  } {
    if (localEvent.isAllDay) {
      const start = DateTime.fromJSDate(localEvent.startDate, {
        zone: userTimezone,
      }).startOf('day');
      const rawEndDate = localEvent.endDate || localEvent.startDate;
      const end = DateTime.fromJSDate(rawEndDate, {
        zone: userTimezone,
      })
        .startOf('day')
        .plus({ days: 1 });

      return {
        startDateTime: start.toISO() || undefined,
        endDateTime: end.toISO() || undefined,
        startDate: start.toISODate() || undefined,
        endDate: end.toISODate() || undefined,
      };
    }

    const startTime = this.parseTimeValue(localEvent.startTime);
    const endTime = this.parseTimeValue(localEvent.endTime);

    let start = DateTime.fromJSDate(localEvent.startDate, {
      zone: userTimezone,
    });
    if (startTime) {
      start = start.set({
        hour: startTime.hours,
        minute: startTime.minutes,
        second: 0,
        millisecond: 0,
      });
    }

    let endBase = localEvent.endDate || localEvent.startDate;
    let end = DateTime.fromJSDate(endBase, { zone: userTimezone });
    if (endTime) {
      end = end.set({
        hour: endTime.hours,
        minute: endTime.minutes,
        second: 0,
        millisecond: 0,
      });
    } else if (start.isValid) {
      end = start.plus({ minutes: 60 });
    }

    return {
      startDateTime: start.isValid ? start.toISO() || undefined : undefined,
      endDateTime: end.isValid ? end.toISO() || undefined : undefined,
    };
  }

  private parseTimeValue(
    timeValue: string | null,
  ): { hours: number; minutes: number } | null {
    if (!timeValue) {
      return null;
    }

    const [hours, minutes] = timeValue.split(':').map((value) => Number(value));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return { hours, minutes };
  }

  private async getUserTimezone(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['timezone'],
    });
    return this.getSafeUserTimezone(user?.timezone);
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

  private async fetchMicrosoftEventDetails(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    eventId: string,
    userTimezone: string,
  ): Promise<any | null> {
    const encodedCalendarId = encodeURIComponent(calendarId);
    const encodedEventId = encodeURIComponent(eventId);
    const selectFields = [
      'subject',
      'body',
      'bodyPreview',
      'location',
      'isAllDay',
      'start',
      'end',
      'organizer',
      'attendees',
      'sensitivity',
      'showAs',
    ];

    const url = `https://graph.microsoft.com/v1.0/me/calendars/${encodedCalendarId}/events/${encodedEventId}?$select=${selectFields.join(',')}`;
    const preferParts: string[] = ['outlook.body-content-type="text"'];
    const preferTimeZone = this.getMicrosoftTimeZone(userTimezone);
    if (preferTimeZone) {
      preferParts.unshift(`outlook.timezone="${preferTimeZone}"`);
    }

    try {
      const response = await this.fetchWithAuth(syncConnection, url, {
        headers: {
          Prefer: preferParts.join(', '),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(
          `[fetchMicrosoftEventDetails] Failed to fetch event ${eventId}: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `[fetchMicrosoftEventDetails] Error fetching event ${eventId}:`,
        error.stack,
      );
      return null;
    }
  }

  private buildLocalEventData(
    syncConnection: CalendarSyncConnection,
    externalEvent: any,
    userTimezone: string,
  ): Partial<Event> {
    let eventData: any = {};

    if (syncConnection.provider === SyncProvider.MICROSOFT) {
      eventData = {
        title: externalEvent.subject || 'Untitled Event',
        description:
          externalEvent.body?.content || externalEvent.bodyPreview || '',
        location: externalEvent.location?.displayName || '',
        isAllDay: externalEvent.isAllDay || false,
      };

      if (externalEvent.start) {
        if (externalEvent.isAllDay) {
          eventData.startDate = new Date(
            externalEvent.start.dateTime || externalEvent.start.date,
          );
          eventData.startTime = null;
        } else {
          const start = this.convertToUserDateTime(
            externalEvent.start.dateTime,
            userTimezone,
            [
              externalEvent.start.timeZone,
              externalEvent.originalStartTimeZone,
              externalEvent.originalEndTimeZone,
            ],
          );
          if (start) {
            eventData.startDate = start.datePart;
            eventData.startTime = start.timePart;
          }
        }
      }

      eventData.recurrenceType = RecurrenceType.NONE;

      if (externalEvent.seriesMasterId) {
        eventData.recurrenceId = externalEvent.seriesMasterId;
        if (externalEvent.originalStart) {
          eventData.originalDate = new Date(externalEvent.originalStart);
        }
      }

      if (externalEvent.end) {
        if (externalEvent.isAllDay) {
          const rawEndDate =
            externalEvent.end.dateTime || externalEvent.end.date;
          eventData.endDate = this.normalizeAllDayEndDate(rawEndDate);
          eventData.endTime = null;
        } else {
          const end = this.convertToUserDateTime(
            externalEvent.end.dateTime,
            userTimezone,
            [
              externalEvent.end.timeZone,
              externalEvent.originalEndTimeZone,
              externalEvent.originalStartTimeZone,
            ],
          );
          if (end) {
            eventData.endDate = end.datePart;
            eventData.endTime = end.timePart;
          }
        }
      }
    } else if (syncConnection.provider === SyncProvider.GOOGLE) {
      eventData = {
        title: externalEvent.summary || 'Untitled Event',
        description: externalEvent.description || '',
        location: externalEvent.location || '',
      };

      eventData.recurrenceType = RecurrenceType.NONE;

      if (externalEvent.recurringEventId) {
        eventData.recurrenceId = externalEvent.recurringEventId;
        if (externalEvent.originalStartTime) {
          eventData.originalDate = new Date(
            externalEvent.originalStartTime.dateTime ||
              externalEvent.originalStartTime.date,
          );
        }
      }

      if (externalEvent.start) {
        if (externalEvent.start.date) {
          eventData.isAllDay = true;
          eventData.startDate = new Date(externalEvent.start.date);
          eventData.startTime = null;
        } else if (externalEvent.start.dateTime) {
          eventData.isAllDay = false;
          const start = this.convertToUserDateTime(
            externalEvent.start.dateTime,
            userTimezone,
            [externalEvent.start.timeZone],
          );
          if (start) {
            eventData.startDate = start.datePart;
            eventData.startTime = start.timePart;
          }
        }
      }

      if (externalEvent.end) {
        if (externalEvent.end.date) {
          eventData.endDate = this.normalizeAllDayEndDate(
            externalEvent.end.date,
          );
          eventData.endTime = null;
        } else if (externalEvent.end.dateTime) {
          const end = this.convertToUserDateTime(
            externalEvent.end.dateTime,
            userTimezone,
            [externalEvent.end.timeZone],
          );
          if (end) {
            eventData.endDate = end.datePart;
            eventData.endTime = end.timePart;
          }
        }
      }
    }

    return eventData;
  }

  private normalizeAllDayEndDate(
    rawDate: string | Date | undefined,
  ): Date | null {
    if (!rawDate) {
      return null;
    }

    const parsed =
      rawDate instanceof Date ? new Date(rawDate) : new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setDate(parsed.getDate() - 1);
    return parsed;
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
      const details = await this.fetchMicrosoftEventDetails(
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

    const eventData = this.buildLocalEventData(
      syncConnection,
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
      const details = await this.fetchMicrosoftEventDetails(
        syncConnection,
        syncedCalendar.externalCalendarId,
        externalEvent.id,
        userTimezone,
      );
      if (details) {
        eventSource = { ...externalEvent, ...details };
      }
    }

    const eventData = this.buildLocalEventData(
      syncConnection,
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

  private getSafeUserTimezone(timeZone?: string): string {
    const fallback = 'UTC';
    if (!timeZone) return fallback;

    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
      return timeZone;
    } catch (error) {
      this.logger.warn(
        `[calendar-sync] Invalid user timezone "${timeZone}", falling back to ${fallback}`,
      );
      return fallback;
    }
  }

  private getMicrosoftTimeZone(timeZone: string): string | undefined {
    if (!timeZone) return undefined;
    const trimmed = timeZone.trim();
    if (!trimmed) return undefined;

    const windowsFromIana = this.mapIanaToWindows(trimmed);
    if (windowsFromIana) {
      return windowsFromIana;
    }

    if (this.mapWindowsToIana(trimmed)) {
      return trimmed;
    }

    return undefined;
  }

  private resolveTimeZone(timeZone?: string): string | undefined {
    if (!timeZone) return undefined;

    const trimmed = timeZone.trim();
    const mapped = this.mapWindowsToIana(trimmed);
    const candidate = mapped || trimmed;

    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(
        new Date(),
      );
      return candidate;
    } catch {
      return undefined;
    }
  }

  private convertToUserDateTime(
    rawDateTime: string | undefined,
    userTimezone: string,
    preferredSourceTimezones: (string | undefined)[],
  ): { datePart: string; timePart: string } | null {
    if (!rawDateTime) return null;

    const sourceZone =
      preferredSourceTimezones
        .map((tz) => this.resolveTimeZone(tz))
        .find((tz): tz is string => !!tz) || 'UTC';

    const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(rawDateTime);

    let sourceDateTime = DateTime.fromISO(rawDateTime, {
      zone: hasOffset ? undefined : sourceZone,
      setZone: true,
    });

    if (!sourceDateTime.isValid) {
      sourceDateTime = DateTime.fromJSDate(new Date(rawDateTime)).setZone(
        sourceZone,
      );
    }

    const userDateTime = sourceDateTime.setZone(userTimezone);
    if (!userDateTime.isValid) return null;

    return {
      datePart: userDateTime.toISODate(),
      timePart: userDateTime.toFormat('HH:mm'),
    };
  }

  private mapWindowsToIana(timeZone: string): string | undefined {
    const normalized = timeZone.toLowerCase();
    const windowsToIana: Record<string, string> = {
      utc: 'UTC',
      'w. europe standard time': 'Europe/Berlin',
      'central europe standard time': 'Europe/Budapest',
      'central european standard time': 'Europe/Warsaw',
      'romance standard time': 'Europe/Paris',
      'gmt standard time': 'Europe/London',
      'greenwich standard time': 'Etc/Greenwich',
      'e. europe standard time': 'Europe/Bucharest',
      'eastern standard time': 'America/New_York',
      'pacific standard time': 'America/Los_Angeles',
      'mountain standard time': 'America/Denver',
      'china standard time': 'Asia/Shanghai',
      'tokyo standard time': 'Asia/Tokyo',
      'india standard time': 'Asia/Kolkata',
    };

    return windowsToIana[normalized];
  }

  private mapIanaToWindows(timeZone: string): string | undefined {
    const normalized = timeZone.toLowerCase();
    const ianaToWindows: Record<string, string> = {
      utc: 'UTC',
      'europe/berlin': 'W. Europe Standard Time',
      'europe/budapest': 'Central Europe Standard Time',
      'europe/warsaw': 'Central European Standard Time',
      'europe/paris': 'Romance Standard Time',
      'europe/london': 'GMT Standard Time',
      'etc/greenwich': 'Greenwich Standard Time',
      'europe/bucharest': 'E. Europe Standard Time',
      'america/new_york': 'Eastern Standard Time',
      'america/los_angeles': 'Pacific Standard Time',
      'america/denver': 'Mountain Standard Time',
      'asia/shanghai': 'China Standard Time',
      'asia/tokyo': 'Tokyo Standard Time',
      'asia/kolkata': 'India Standard Time',
    };

    return ianaToWindows[normalized];
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
      this.logger.error(
        'Error triggering calendar import automation rules:',
        error,
      );
    }
  }
}
