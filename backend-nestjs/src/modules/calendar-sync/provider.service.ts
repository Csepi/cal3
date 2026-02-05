import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import {
  CalendarSyncConnection,
  SyncProvider,
} from '../../entities/calendar-sync.entity';
import { ExternalCalendarDto } from '../../dto/calendar-sync.dto';
import { ConfigurationService } from '../../configuration/configuration.service';
import { CalendarSyncMapperService } from './mapper.service';
import { logError } from '../../common/errors/error-logger';
import { buildErrorContext } from '../../common/errors/error-context';
import { Event } from '../../entities/event.entity';

export type ExternalEventsResult = {
  events: Array<Record<string, unknown>>;
  deletedEventIds: string[];
  nextSyncToken?: string;
};

export class CalendarSyncAuthError extends Error {
  constructor(
    message: string,
    readonly provider: SyncProvider,
    readonly connectionId: number,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'CalendarSyncAuthError';
  }
}

@Injectable()
export class CalendarSyncProviderService {
  private readonly logger = new Logger(CalendarSyncProviderService.name);

  constructor(
    @InjectRepository(CalendarSyncConnection)
    private syncConnectionRepository: Repository<CalendarSyncConnection>,
    private readonly configurationService: ConfigurationService,
    private readonly mapperService: CalendarSyncMapperService,
  ) {}

  async fetchWithAuth(
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
      throw new CalendarSyncAuthError(
        `[fetchWithAuth] Received 401 with no refresh token for connection ${currentConnection.id}`,
        currentConnection.provider,
        currentConnection.id,
        response.status,
      );
    }

    const refreshed = await this.refreshAccessToken(currentConnection);
    const retryHeaders = {
      ...(init.headers || {}),
      Authorization: `Bearer ${refreshed.accessToken}`,
    };

    const retryResponse = await fetch(url, { ...init, headers: retryHeaders });
    if (retryResponse.status === 401) {
      throw new CalendarSyncAuthError(
        `[fetchWithAuth] Received 401 after refresh for connection ${currentConnection.id}`,
        currentConnection.provider,
        currentConnection.id,
        retryResponse.status,
      );
    }

    return retryResponse;
  }

  async getExternalCalendars(
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

        const data = (await response.json()) as {
          items?: Array<{
            id: string;
            summary: string;
            description?: string;
            primary?: boolean;
            accessRole?: string;
          }>;
        };
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

        const data = (await response.json()) as {
          value?: Array<{
            id: string;
            name: string;
            description?: string;
            isDefaultCalendar?: boolean;
          }>;
        };
        return (
          data.value?.map((calendar) => ({
            id: calendar.id,
            name: calendar.name,
            description: calendar.description,
            primary: calendar.isDefaultCalendar || false,
          })) || []
        );
      }
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      console.error('Error fetching external calendars:', error);
    }

    return [];
  }

  async getExternalCalendarName(
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
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      console.error('Error fetching calendar name:', error);
    }

    return `External Calendar ${calendarId}`;
  }

  async fetchMicrosoftCalendarEvents(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    userTimezone: string,
    syncToken?: string | null,
  ): Promise<ExternalEventsResult> {
    const { startDate, endDate } = this.getMicrosoftSyncWindow();
    const deletedEventIds: string[] = [];
    const events: Array<Record<string, unknown>> = [];

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
        const cleaned = value.replace(/([?&])(?:%24|\$)top=[^&]*&?/gi, '$1');
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
    const preferTimeZone =
      this.mapperService.getMicrosoftTimeZone(userTimezone);
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
        const response = await this.fetchWithAuth(
          syncConnection,
          sanitizedNextUrl,
          {
            headers,
          },
        );

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
          const message = `[fetchMicrosoftCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}${errorSuffix}`;
          if (response.status === 401) {
            throw new CalendarSyncAuthError(
              message,
              syncConnection.provider,
              syncConnection.id,
              response.status,
            );
          }
          throw new Error(message);
        }

        const data = (await response.json()) as {
          value?: Array<Record<string, unknown>>;
          '@odata.nextLink'?: string;
          '@odata.deltaLink'?: string;
        };
        const values = data.value || [];
        for (const item of values) {
          const removed = item['@removed'];
          const itemId = typeof item.id === 'string' ? item.id : undefined;
          if (removed && itemId) {
            deletedEventIds.push(itemId);
            continue;
          }
          events.push(item);
        }

        nextUrl = sanitizeDeltaUrl(data['@odata.nextLink']);
        if (data['@odata.deltaLink']) {
          deltaLink = sanitizeDeltaUrl(data['@odata.deltaLink']);
        }
      }
    } catch (error: unknown) {
      if (error instanceof CalendarSyncAuthError) {
        throw error;
      }
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      this.logger.error(
        `[fetchMicrosoftCalendarEvents] Error:`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error instanceof Error ? error : new Error(String(error));
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

  async fetchGoogleCalendarEvents(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    syncToken?: string | null,
  ): Promise<ExternalEventsResult> {
    const { startDate, endDate } = this.getSyncWindow();
    const events: Array<Record<string, unknown>> = [];
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
          return this.fetchGoogleCalendarEvents(syncConnection, calendarId);
        }

        if (!response.ok) {
          const message = `[fetchGoogleCalendarEvents] Failed to fetch events: ${response.status} - ${response.statusText}`;
          if (response.status === 401) {
            throw new CalendarSyncAuthError(
              message,
              syncConnection.provider,
              syncConnection.id,
              response.status,
            );
          }
          throw new Error(message);
        }

        const data = (await response.json()) as {
          items?: Array<Record<string, unknown>>;
          nextPageToken?: string;
          nextSyncToken?: string;
        };
        const items = data.items || [];

        for (const item of items) {
          const status = typeof item.status === 'string' ? item.status : '';
          const itemId = typeof item.id === 'string' ? item.id : undefined;
          if (status === 'cancelled' && itemId) {
            deletedEventIds.push(itemId);
            continue;
          }
          events.push(item);
        }

        pageToken = data.nextPageToken;
        if (data.nextSyncToken) {
          nextSyncToken = data.nextSyncToken;
        }
      } while (pageToken);
    } catch (error: unknown) {
      if (error instanceof CalendarSyncAuthError) {
        throw error;
      }
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      this.logger.error(
        `[fetchGoogleCalendarEvents] Error:`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error instanceof Error ? error : new Error(String(error));
    }

    if (events.length > 0 || deletedEventIds.length > 0) {
      this.logger.log(
        `[fetchGoogleCalendarEvents] Fetched ${events.length} events (${deletedEventIds.length} deletions) for calendar ${calendarId}`,
      );
    }

    return { events, deletedEventIds, nextSyncToken };
  }

  buildExternalEventPayload(
    provider: SyncProvider,
    localEvent: Event,
    userTimezone: string,
  ): Record<string, unknown> | null {
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
        this.mapperService.getMicrosoftTimeZone(userTimezone) || userTimezone;
      const payload: Record<string, unknown> = {
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

  async fetchMicrosoftEventDetails(
    syncConnection: CalendarSyncConnection,
    calendarId: string,
    eventId: string,
    userTimezone: string,
  ): Promise<Record<string, unknown> | null> {
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
    const preferTimeZone =
      this.mapperService.getMicrosoftTimeZone(userTimezone);
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
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'calendar-sync.service' }));
      this.logger.error(
        `[fetchMicrosoftEventDetails] Error fetching event ${eventId}:`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
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
        scope: 'https://graph.microsoft.com/calendars.readwrite offline_access',
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
      const shouldReconnect =
        response.status === 400 && errorText.includes('invalid_grant');
      if (shouldReconnect) {
        throw new CalendarSyncAuthError(
          `[refreshAccessToken] Refresh token revoked for connection ${syncConnection.id}`,
          syncConnection.provider,
          syncConnection.id,
          response.status,
        );
      }
      this.logger.error(
        `[refreshAccessToken] Failed to refresh tokens for connection ${syncConnection.id}: ${response.status} - ${errorText}`,
      );
      return syncConnection;
    }

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
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

    const endBase = localEvent.endDate || localEvent.startDate;
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
}
