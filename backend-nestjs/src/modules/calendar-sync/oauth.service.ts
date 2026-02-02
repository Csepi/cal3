import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CalendarSyncConnection,
  SyncProvider,
  SyncStatus,
} from '../../entities/calendar-sync.entity';
import { ConfigurationService } from '../../configuration/configuration.service';
import { logError } from '../../common/errors/error-logger';
import { buildErrorContext } from '../../common/errors/error-context';

type TokenExchangeResult = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  userId: string;
};

@Injectable()
export class CalendarSyncOAuthService {
  private readonly logger = new Logger(CalendarSyncOAuthService.name);

  constructor(
    @InjectRepository(CalendarSyncConnection)
    private readonly syncConnectionRepository: Repository<CalendarSyncConnection>,
    private readonly configurationService: ConfigurationService,
  ) {}

  async getAuthUrl(provider: SyncProvider, userId: number): Promise<string> {
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
    }

    if (provider === SyncProvider.MICROSOFT) {
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
      this.logger.log(
        `[handleOAuthCallback] Exchanging authorization code for tokens...`,
      );
      const tokens = await this.exchangeCodeForTokens(provider, code);
      this.logger.log(
        `[handleOAuthCallback] Successfully received tokens for user: ${tokens.userId}`,
      );

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
        syncConnection.tokenExpiresAt = tokens.expiresAt ?? null;
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
          tokenExpiresAt: tokens.expiresAt ?? null,
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
      logError(error, buildErrorContext({ action: 'calendar-sync.oauth' }));
      this.logger.error(
        `[handleOAuthCallback] Error in OAuth callback for provider ${provider}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async exchangeCodeForTokens(
    provider: SyncProvider,
    code: string,
  ): Promise<TokenExchangeResult> {
    this.logger.log(
      `[exchangeCodeForTokens] Starting token exchange for provider: ${provider}`,
    );

    if (provider === SyncProvider.GOOGLE) {
      const clientId =
        this.configurationService.getValue('GOOGLE_CLIENT_ID') || '';
      const clientSecret =
        this.configurationService.getValue('GOOGLE_CLIENT_SECRET') || '';
      const redirectUri =
        this.configurationService.getValue(
          'GOOGLE_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/google`;

      this.logger.log(
        `[exchangeCodeForTokens] Google - Using redirect URI: ${redirectUri}`,
      );

      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[exchangeCodeForTokens] Google - Token exchange failed: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException(
          `Google token exchange failed: ${response.status}`,
        );
      }

      const data = await response.json();

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
        },
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.warn(
          `[exchangeCodeForTokens] Google - User info fetch failed: ${userInfoResponse.status} - ${errorText}`,
        );
        throw new BadRequestException('Google user info fetch failed');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
        userId: userInfo.id,
      };
    }

    if (provider === SyncProvider.MICROSOFT) {
      const clientId =
        this.configurationService.getValue('MICROSOFT_CLIENT_ID') || '';
      const clientSecret =
        this.configurationService.getValue('MICROSOFT_CLIENT_SECRET') || '';
      const redirectUri =
        this.configurationService.getValue(
          'MICROSOFT_CALENDAR_SYNC_CALLBACK_URL',
        ) ||
        `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/microsoft`;

      const tokenUrl =
        'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[exchangeCodeForTokens] Microsoft - Token exchange failed: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException(
          `Microsoft token exchange failed: ${response.status}`,
        );
      }

      const data = await response.json();

      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        this.logger.warn(
          `[exchangeCodeForTokens] Microsoft - User info fetch failed: ${userInfoResponse.status} - ${errorText}`,
        );
        throw new BadRequestException('Microsoft user info fetch failed');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
        userId: userInfo.id,
      };
    }

    throw new BadRequestException('Unsupported provider');
  }
}
