import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarSyncConnection, SyncedCalendar, SyncEventMapping, SyncProvider, SyncStatus } from '../entities/calendar-sync.entity';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event, RecurrenceType } from '../entities/event.entity';
import { CalendarSyncStatusDto, SyncCalendarsDto, ExternalCalendarDto, SyncedCalendarInfoDto, ProviderSyncStatusDto } from '../dto/calendar-sync.dto';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

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
    @Inject(forwardRef(() => require('../automation/automation.service').AutomationService))
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
        const externalCalendars = await this.getExternalCalendars(syncConnection);

        // Get synced calendars
        const syncedCalendars = await this.syncedCalendarRepository.find({
          where: { syncConnectionId: syncConnection.id },
          relations: ['localCalendar'],
        });

        const syncedCalendarInfos: SyncedCalendarInfoDto[] = syncedCalendars.map(sc => ({
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
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_CALENDAR_SYNC_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:8081'}/api/calendar-sync/callback/google`;
      const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile';

      return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;
    } else if (provider === SyncProvider.MICROSOFT) {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = process.env.MICROSOFT_CALENDAR_SYNC_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:8081'}/api/calendar-sync/callback/microsoft`;
      const scope = 'https://graph.microsoft.com/calendars.readwrite offline_access';

      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `response_mode=query&` +
        `state=${state}`;
    }

    throw new BadRequestException('Unsupported provider');
  }

  async handleOAuthCallback(provider: SyncProvider, code: string, userId: number): Promise<void> {
    this.logger.log(`[handleOAuthCallback] Starting OAuth callback for provider: ${provider}, userId: ${userId}`);

    try {
      // Exchange code for tokens
      this.logger.log(`[handleOAuthCallback] Exchanging authorization code for tokens...`);
      const tokens = await this.exchangeCodeForTokens(provider, code);
      this.logger.log(`[handleOAuthCallback] Successfully received tokens for user: ${tokens.userId}`);

      // Store or update sync connection
      this.logger.log(`[handleOAuthCallback] Looking for existing sync connection for userId: ${userId}, provider: ${provider}`);
      let syncConnection = await this.syncConnectionRepository.findOne({
        where: { userId, provider },
      });

      if (syncConnection) {
        this.logger.log(`[handleOAuthCallback] Updating existing sync connection with ID: ${syncConnection.id}`);
        syncConnection.accessToken = tokens.accessToken;
        syncConnection.refreshToken = tokens.refreshToken;
        syncConnection.tokenExpiresAt = tokens.expiresAt;
        syncConnection.status = SyncStatus.ACTIVE;
      } else {
        this.logger.log(`[handleOAuthCallback] Creating new sync connection for userId: ${userId}`);
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

      this.logger.log(`[handleOAuthCallback] Saving sync connection to database...`);
      await this.syncConnectionRepository.save(syncConnection);
      this.logger.log(`[handleOAuthCallback] OAuth callback completed successfully for provider: ${provider}`);
    } catch (error) {
      this.logger.error(`[handleOAuthCallback] Error in OAuth callback for provider ${provider}:`, error.stack);
      throw error;
    }
  }

  async syncCalendars(userId: number, syncData: SyncCalendarsDto): Promise<void> {
    const syncConnection = await this.syncConnectionRepository.findOne({
      where: { userId, provider: syncData.provider, status: SyncStatus.ACTIVE },
    });

    if (!syncConnection) {
      throw new NotFoundException('No active sync connection found');
    }

    for (const calendarData of syncData.calendars) {
      // Create local calendar
      const localCalendar = this.calendarRepository.create({
        name: calendarData.localName,
        description: `Synced from ${syncData.provider}`,
        color: '#3b82f6', // Default blue
        ownerId: userId,
      });

      const savedLocalCalendar = await this.calendarRepository.save(localCalendar);

      // Create sync mapping with automation trigger settings
      const syncedCalendar = this.syncedCalendarRepository.create({
        syncConnectionId: syncConnection.id,
        localCalendarId: savedLocalCalendar.id,
        externalCalendarId: calendarData.externalId,
        externalCalendarName: await this.getExternalCalendarName(syncConnection, calendarData.externalId),
        bidirectionalSync: calendarData.bidirectionalSync || true,
      });

      await this.syncedCalendarRepository.save(syncedCalendar);
    }

    // Trigger initial sync with automation settings
    await this.performSync(syncConnection, {
      triggerAutomationRules: syncData.calendars.some(cal => cal.triggerAutomationRules),
      selectedRuleIds: syncData.calendars.flatMap(cal => cal.selectedRuleIds || []),
    });
  }

  async disconnect(userId: number): Promise<void> {
    const syncConnections = await this.syncConnectionRepository.find({
      where: { userId },
    });

    for (const connection of syncConnections) {
      connection.status = SyncStatus.INACTIVE;
      await this.syncConnectionRepository.save(connection);
    }
  }

  async disconnectProvider(userId: number, provider: SyncProvider): Promise<void> {
    const syncConnection = await this.syncConnectionRepository.findOne({
      where: { userId, provider },
    });

    if (syncConnection) {
      syncConnection.status = SyncStatus.INACTIVE;
      await this.syncConnectionRepository.save(syncConnection);
    }
  }

  async forceSync(userId: number): Promise<void> {
    const syncConnection = await this.syncConnectionRepository.findOne({
      where: { userId, status: SyncStatus.ACTIVE },
    });

    if (!syncConnection) {
      throw new NotFoundException('No active sync connection found');
    }

    await this.performSync(syncConnection, { triggerAutomationRules: false });
  }

  private async getExternalCalendars(syncConnection: CalendarSyncConnection): Promise<ExternalCalendarDto[]> {
    try {
      if (syncConnection.provider === SyncProvider.GOOGLE) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            Authorization: `Bearer ${syncConnection.accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch Google calendars:', response.statusText);
          return [];
        }

        const data = await response.json();
        return data.items?.map(calendar => ({
          id: calendar.id,
          name: calendar.summary,
          description: calendar.description,
          primary: calendar.primary || false,
          accessRole: calendar.accessRole,
        })) || [];
      } else if (syncConnection.provider === SyncProvider.MICROSOFT) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
          headers: {
            Authorization: `Bearer ${syncConnection.accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch Microsoft calendars:', response.statusText);
          return [];
        }

        const data = await response.json();
        return data.value?.map(calendar => ({
          id: calendar.id,
          name: calendar.name,
          description: calendar.description,
          primary: calendar.isDefaultCalendar || false,
        })) || [];
      }
    } catch (error) {
      console.error('Error fetching external calendars:', error);
    }

    return [];
  }

  private async exchangeCodeForTokens(provider: SyncProvider, code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    userId: string;
  }> {
    this.logger.log(`[exchangeCodeForTokens] Starting token exchange for provider: ${provider}`);

    if (provider === SyncProvider.GOOGLE) {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const redirectUri = process.env.GOOGLE_CALENDAR_SYNC_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:8081'}/api/calendar-sync/callback/google`;

      this.logger.log(`[exchangeCodeForTokens] Google - Using redirect URI: ${redirectUri}`);
      this.logger.log(`[exchangeCodeForTokens] Google - Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 10)}...`);

      const tokenRequestParams = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };

      this.logger.log(`[exchangeCodeForTokens] Google - Making token request to: ${tokenUrl}`);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestParams),
      });

      this.logger.log(`[exchangeCodeForTokens] Google - Token response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[exchangeCodeForTokens] Google - Token exchange failed: ${response.status} - ${errorText}`);
        throw new BadRequestException('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.logger.log(`[exchangeCodeForTokens] Google - Token exchange successful, expires_in: ${data.expires_in}`);

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      // Get user info
      this.logger.log(`[exchangeCodeForTokens] Google - Fetching user info...`);
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.error(`[exchangeCodeForTokens] Google - User info fetch failed: ${userInfoResponse.status} - ${errorText}`);
        throw new BadRequestException('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      this.logger.log(`[exchangeCodeForTokens] Google - User info received for user: ${userInfo.id}`);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        userId: userInfo.id,
      };
    } else if (provider === SyncProvider.MICROSOFT) {
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const redirectUri = process.env.MICROSOFT_CALENDAR_SYNC_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:8081'}/api/calendar-sync/callback/microsoft`;

      this.logger.log(`[exchangeCodeForTokens] Microsoft - Using redirect URI: ${redirectUri}`);
      this.logger.log(`[exchangeCodeForTokens] Microsoft - Client ID: ${process.env.MICROSOFT_CLIENT_ID?.substring(0, 10)}...`);

      const tokenRequestParams = {
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };

      this.logger.log(`[exchangeCodeForTokens] Microsoft - Making token request to: ${tokenUrl}`);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestParams),
      });

      this.logger.log(`[exchangeCodeForTokens] Microsoft - Token response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[exchangeCodeForTokens] Microsoft - Token exchange failed: ${response.status} - ${errorText}`);
        throw new BadRequestException('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.logger.log(`[exchangeCodeForTokens] Microsoft - Token exchange successful, expires_in: ${data.expires_in}`);

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      // Get user info
      this.logger.log(`[exchangeCodeForTokens] Microsoft - Fetching user info...`);
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.error(`[exchangeCodeForTokens] Microsoft - User info fetch failed: ${userInfoResponse.status} - ${errorText}`);
        throw new BadRequestException('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      this.logger.log(`[exchangeCodeForTokens] Microsoft - User info received for user: ${userInfo.id}`);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        userId: userInfo.id,
      };
    }

    this.logger.error(`[exchangeCodeForTokens] Unsupported provider: ${provider}`);
    throw new BadRequestException('Unsupported provider');
  }

  private async getExternalCalendarName(syncConnection: CalendarSyncConnection, calendarId: string): Promise<string> {
    try {
      if (syncConnection.provider === SyncProvider.GOOGLE) {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`, {
          headers: {
            Authorization: `Bearer ${syncConnection.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.summary || `Calendar ${calendarId}`;
        }
      } else if (syncConnection.provider === SyncProvider.MICROSOFT) {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${calendarId}`, {
          headers: {
            Authorization: `Bearer ${syncConnection.accessToken}`,
          },
        });

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
    automationSettings?: { triggerAutomationRules?: boolean; selectedRuleIds?: number[] }
  ): Promise<void> {
    this.logger.log(`[performSync] Starting sync for provider: ${syncConnection.provider}, user: ${syncConnection.userId}`);

    // Get all synced calendars for this connection
    const syncedCalendars = await this.syncedCalendarRepository.find({
      where: { syncConnectionId: syncConnection.id },
      relations: ['localCalendar'],
    });

    this.logger.log(`[performSync] Found ${syncedCalendars.length} synced calendars`);

    for (const syncedCalendar of syncedCalendars) {
      try {
        this.logger.log(`[performSync] Syncing calendar: ${syncedCalendar.externalCalendarName} (${syncedCalendar.externalCalendarId})`);
        await this.syncCalendarEvents(syncConnection, syncedCalendar, automationSettings);
      } catch (error) {
        this.logger.error(`[performSync] Error syncing calendar ${syncedCalendar.externalCalendarId}:`, error.stack);
      }
    }

    syncConnection.lastSyncAt = new Date();
    await this.syncConnectionRepository.save(syncConnection);
    this.logger.log(`[performSync] Sync completed for provider: ${syncConnection.provider}`);
  }

  private async syncCalendarEvents(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    automationSettings?: { triggerAutomationRules?: boolean; selectedRuleIds?: number[] }
  ): Promise<void> {
    this.logger.log(`[syncCalendarEvents] Fetching events for calendar: ${syncedCalendar.externalCalendarId}`);

    let externalEvents: any[] = [];

    if (syncConnection.provider === SyncProvider.MICROSOFT) {
      externalEvents = await this.fetchMicrosoftCalendarEvents(syncConnection, syncedCalendar.externalCalendarId);
    } else if (syncConnection.provider === SyncProvider.GOOGLE) {
      externalEvents = await this.fetchGoogleCalendarEvents(syncConnection, syncedCalendar.externalCalendarId);
    }

    this.logger.log(`[syncCalendarEvents] Found ${externalEvents.length} external events`);

    // Get existing event mappings
    const existingMappings = await this.syncEventMappingRepository.find({
      where: { syncedCalendarId: syncedCalendar.id },
    });

    const mappedExternalIds = new Set(existingMappings.map(m => m.externalEventId));

    // Create new events that don't exist locally
    for (const externalEvent of externalEvents) {
      if (!mappedExternalIds.has(externalEvent.id)) {
        try {
          await this.createLocalEventFromExternal(syncConnection, syncedCalendar, externalEvent, automationSettings);
        } catch (error) {
          this.logger.error(`[syncCalendarEvents] Error creating local event from external event ${externalEvent.id}:`, error.stack);
        }
      }
    }

    // Update lastSyncAt for this calendar
    syncedCalendar.lastSyncAt = new Date();
    await this.syncedCalendarRepository.save(syncedCalendar);
  }

  private async fetchMicrosoftCalendarEvents(syncConnection: CalendarSyncConnection, calendarId: string): Promise<any[]> {
    try {
      // Set date range: 30 days ago to 365 days in the future
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365);

      const queryParams = new URLSearchParams({
        '$filter': `start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`,
        '$orderby': 'start/dateTime',
        '$top': '1000' // Limit to 1000 events to avoid performance issues
      });

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${syncConnection.accessToken}`,
        },
      });

      if (!response.ok) {
        this.logger.error(`[fetchMicrosoftCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      this.logger.log(`[fetchMicrosoftCalendarEvents] Fetched ${data.value?.length || 0} events for calendar ${calendarId}`);
      return data.value || [];
    } catch (error) {
      this.logger.error(`[fetchMicrosoftCalendarEvents] Error:`, error.stack);
      return [];
    }
  }

  private async fetchGoogleCalendarEvents(syncConnection: CalendarSyncConnection, calendarId: string): Promise<any[]> {
    try {
      // Set date range: 30 days ago to 365 days in the future
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365);

      const queryParams = new URLSearchParams({
        'timeMin': startDate.toISOString(),
        'timeMax': endDate.toISOString(),
        'orderBy': 'startTime',
        'singleEvents': 'false', // Changed to false to get recurring events as series
        'maxResults': '1000' // Limit to 1000 events to avoid performance issues
      });

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${syncConnection.accessToken}`,
        },
      });

      if (!response.ok) {
        this.logger.error(`[fetchGoogleCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      this.logger.log(`[fetchGoogleCalendarEvents] Fetched ${data.items?.length || 0} events for calendar ${calendarId}`);
      return data.items || [];
    } catch (error) {
      this.logger.error(`[fetchGoogleCalendarEvents] Error:`, error.stack);
      return [];
    }
  }

  private async createLocalEventFromExternal(
    syncConnection: CalendarSyncConnection,
    syncedCalendar: SyncedCalendar,
    externalEvent: any,
    automationSettings?: { triggerAutomationRules?: boolean; selectedRuleIds?: number[] }
  ): Promise<void> {
    this.logger.log(`[createLocalEventFromExternal] Creating local event from external: ${externalEvent.id} - ${externalEvent.subject || externalEvent.summary}`);

    // Get user timezone preference (default to UTC if not set)
    const user = await this.userRepository.findOne({
      where: { id: syncConnection.userId },
      select: ['timezone']
    });
    const userTimezone = user?.timezone || 'UTC';

    let eventData: any = {};

    if (syncConnection.provider === SyncProvider.MICROSOFT) {
      // Microsoft Graph event format
      eventData = {
        title: externalEvent.subject || 'Untitled Event',
        description: externalEvent.bodyPreview || externalEvent.body?.content || '',
        location: externalEvent.location?.displayName || '',
        isAllDay: externalEvent.isAllDay || false,
      };

      if (externalEvent.start) {
        if (externalEvent.isAllDay) {
          eventData.startDate = new Date(externalEvent.start.dateTime || externalEvent.start.date);
          eventData.startTime = null;
        } else {
          // Parse the external datetime with timezone info
          const startDateTime = new Date(externalEvent.start.dateTime);

          // Convert to user's timezone
          const userLocalString = startDateTime.toLocaleString("sv-SE", { timeZone: userTimezone });
          const [datePart, timePart] = userLocalString.split(' ');

          // Extract date and time in user timezone
          eventData.startDate = datePart; // YYYY-MM-DD format (sv-SE locale gives ISO date format)
          eventData.startTime = timePart.substring(0, 5); // HH:MM format
        }
      }

      // Handle recurrence for Microsoft Graph
      if (externalEvent.recurrence) {
        const recurrenceData = this.parseMicrosoftRecurrence(externalEvent.recurrence);
        eventData.recurrenceType = recurrenceData.type;
        eventData.recurrenceRule = JSON.stringify(recurrenceData.rule);
      } else {
        eventData.recurrenceType = RecurrenceType.NONE;
      }

      // Handle recurring event instance vs parent for Microsoft
      if (externalEvent.seriesMasterId) {
        // This is an instance of a recurring event
        eventData.parentEventId = externalEvent.seriesMasterId;
        eventData.recurrenceId = externalEvent.id;
        if (externalEvent.originalStart) {
          eventData.originalDate = new Date(externalEvent.originalStart);
        }
      }

      if (externalEvent.end) {
        if (externalEvent.isAllDay) {
          eventData.endDate = new Date(externalEvent.end.dateTime || externalEvent.end.date);
          eventData.endTime = null;
        } else {
          // Parse the external datetime with timezone info
          const endDateTime = new Date(externalEvent.end.dateTime);

          // Convert to user's timezone
          const userLocalString = endDateTime.toLocaleString("sv-SE", { timeZone: userTimezone });
          const [datePart, timePart] = userLocalString.split(' ');

          // Extract date and time in user timezone
          eventData.endDate = datePart; // YYYY-MM-DD format (sv-SE locale gives ISO date format)
          eventData.endTime = timePart.substring(0, 5); // HH:MM format
        }
      }
    } else if (syncConnection.provider === SyncProvider.GOOGLE) {
      // Google Calendar event format
      eventData = {
        title: externalEvent.summary || 'Untitled Event',
        description: externalEvent.description || '',
        location: externalEvent.location || '',
      };

      // Handle recurrence for Google Calendar
      if (externalEvent.recurrence && externalEvent.recurrence.length > 0) {
        const rrule = externalEvent.recurrence[0]; // Google uses RRULE format
        const recurrenceData = this.parseGoogleRecurrence(rrule);
        eventData.recurrenceType = recurrenceData.type;
        eventData.recurrenceRule = JSON.stringify(recurrenceData.rule);
      } else {
        eventData.recurrenceType = RecurrenceType.NONE;
      }

      // Handle recurring event instance vs parent
      if (externalEvent.recurringEventId) {
        // This is an instance of a recurring event
        eventData.parentEventId = externalEvent.recurringEventId;
        eventData.recurrenceId = externalEvent.id;
        if (externalEvent.originalStartTime) {
          eventData.originalDate = new Date(externalEvent.originalStartTime.dateTime || externalEvent.originalStartTime.date);
        }
      }

      if (externalEvent.start) {
        if (externalEvent.start.date) {
          // All-day event
          eventData.isAllDay = true;
          eventData.startDate = new Date(externalEvent.start.date);
          eventData.startTime = null;
        } else if (externalEvent.start.dateTime) {
          // Timed event
          eventData.isAllDay = false;
          // Parse the external datetime with timezone info
          const startDateTime = new Date(externalEvent.start.dateTime);

          // Convert to user's timezone
          const userLocalString = startDateTime.toLocaleString("sv-SE", { timeZone: userTimezone });
          const [datePart, timePart] = userLocalString.split(' ');

          // Extract date and time in user timezone
          eventData.startDate = datePart; // YYYY-MM-DD format (sv-SE locale gives ISO date format)
          eventData.startTime = timePart.substring(0, 5); // HH:MM format
        }
      }

      if (externalEvent.end) {
        if (externalEvent.end.date) {
          eventData.endDate = new Date(externalEvent.end.date);
          eventData.endTime = null;
        } else if (externalEvent.end.dateTime) {
          // Parse the external datetime with timezone info
          const endDateTime = new Date(externalEvent.end.dateTime);

          // Convert to user's timezone
          const userLocalString = endDateTime.toLocaleString("sv-SE", { timeZone: userTimezone });
          const [datePart, timePart] = userLocalString.split(' ');

          // Extract date and time in user timezone
          eventData.endDate = datePart; // YYYY-MM-DD format (sv-SE locale gives ISO date format)
          eventData.endTime = timePart.substring(0, 5); // HH:MM format
        }
      }
    }

    // Create the local event
    const localEvent = this.eventRepository.create({
      ...eventData,
      calendarId: syncedCalendar.localCalendarId,
      createdById: syncConnection.userId,
      color: syncedCalendar.localCalendar.color,
    });

    const savedEvent = await this.eventRepository.save(localEvent) as unknown as Event;

    // Trigger automation rules for calendar.imported only if enabled
    if (automationSettings?.triggerAutomationRules) {
      this.triggerCalendarImportRules(savedEvent, syncConnection.userId, automationSettings.selectedRuleIds).catch(err =>
        this.logger.error('Automation trigger error:', err)
      );
    }

    // Create event mapping
    const eventMapping = this.syncEventMappingRepository.create({
      syncedCalendarId: syncedCalendar.id,
      localEventId: savedEvent.id,
      externalEventId: externalEvent.id,
      lastModifiedExternal: new Date(externalEvent.lastModifiedDateTime || externalEvent.updated || new Date()),
      lastModifiedLocal: new Date(),
    });

    await this.syncEventMappingRepository.save(eventMapping);

    this.logger.log(`[createLocalEventFromExternal] Created local event ID: ${savedEvent.id} mapped to external ID: ${externalEvent.id}`);
  }

  private parseGoogleRecurrence(rrule: string): { type: RecurrenceType; rule: any } {
    this.logger.log(`[parseGoogleRecurrence] Parsing RRULE: ${rrule}`);

    // Extract frequency from RRULE (e.g., "RRULE:FREQ=DAILY;INTERVAL=1")
    const freqMatch = rrule.match(/FREQ=(\w+)/);
    const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
    const countMatch = rrule.match(/COUNT=(\d+)/);
    const untilMatch = rrule.match(/UNTIL=([^;]+)/);
    const bydayMatch = rrule.match(/BYDAY=([^;]+)/);

    if (!freqMatch) {
      return { type: RecurrenceType.NONE, rule: null };
    }

    const frequency = freqMatch[1];
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;

    let type: RecurrenceType;
    switch (frequency) {
      case 'DAILY':
        type = RecurrenceType.DAILY;
        break;
      case 'WEEKLY':
        type = RecurrenceType.WEEKLY;
        break;
      case 'MONTHLY':
        type = RecurrenceType.MONTHLY;
        break;
      case 'YEARLY':
        type = RecurrenceType.YEARLY;
        break;
      default:
        return { type: RecurrenceType.NONE, rule: null };
    }

    const rule: any = {
      frequency,
      interval,
      rrule: rrule
    };

    if (countMatch) {
      rule.count = parseInt(countMatch[1]);
    }

    if (untilMatch) {
      rule.until = new Date(untilMatch[1]);
    }

    if (bydayMatch) {
      rule.byDay = bydayMatch[1].split(',');
    }

    return { type, rule };
  }

  private parseMicrosoftRecurrence(recurrence: any): { type: RecurrenceType; rule: any } {
    this.logger.log(`[parseMicrosoftRecurrence] Parsing Microsoft recurrence:`, JSON.stringify(recurrence));

    if (!recurrence.pattern) {
      return { type: RecurrenceType.NONE, rule: null };
    }

    const pattern = recurrence.pattern;
    let type: RecurrenceType;

    switch (pattern.type) {
      case 'daily':
        type = RecurrenceType.DAILY;
        break;
      case 'weekly':
        type = RecurrenceType.WEEKLY;
        break;
      case 'absoluteMonthly':
      case 'relativeMonthly':
        type = RecurrenceType.MONTHLY;
        break;
      case 'absoluteYearly':
      case 'relativeYearly':
        type = RecurrenceType.YEARLY;
        break;
      default:
        return { type: RecurrenceType.NONE, rule: null };
    }

    const rule: any = {
      pattern: pattern,
      range: recurrence.range || null
    };

    return { type, rule };
  }

  /**
   * Trigger automation rules for calendar import events
   * Executes asynchronously without blocking the sync flow
   */
  private async triggerCalendarImportRules(event: Event, userId: number, selectedRuleIds?: number[]): Promise<void> {
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

      // Find all enabled rules for calendar.imported trigger
      const rules = await this.automationService.findRulesByTrigger?.(
        'calendar.imported',
        userId,
      );

      if (!rules || rules.length === 0) return;

      // Filter rules if specific rule IDs are provided
      const rulesToExecute = selectedRuleIds && selectedRuleIds.length > 0
        ? rules.filter(rule => selectedRuleIds.includes(rule.id))
        : rules;

      if (rulesToExecute.length === 0) return;

      this.logger.log(
        `[triggerCalendarImportRules] Executing ${rulesToExecute.length} automation rules for imported event ${event.id}`
      );

      // Execute each rule asynchronously
      for (const rule of rulesToExecute) {
        this.automationService
          .executeRuleOnEvent(rule, fullEvent)
          .catch((error: Error) => {
            this.logger.error(
              `Failed to execute automation rule ${rule.id} on imported event ${event.id}:`,
              error.message,
            );
          });
      }
    } catch (error) {
      this.logger.error('Error triggering calendar import automation rules:', error);
    }
  }
}