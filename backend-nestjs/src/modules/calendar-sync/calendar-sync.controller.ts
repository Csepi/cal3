import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { RequestWithUser } from '../../common/types/request-with-user';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CalendarSyncService } from './calendar-sync.service';
import {
  SyncCalendarsDto,
  CalendarSyncStatusDto,
} from '../../dto/calendar-sync.dto';
import {
  CalendarSyncProviderParamDto,
  OAuthCallbackQueryDto,
} from './dto/oauth-callback.query.dto';

@Controller('calendar-sync')
export class CalendarSyncController {
  private readonly logger = new Logger(CalendarSyncController.name);

  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getSyncStatus(
    @Request() req: RequestWithUser,
  ): Promise<CalendarSyncStatusDto> {
    this.logger.log(`[getSyncStatus] Request from user: ${req.user.id}`);
    const result = await this.calendarSyncService.getSyncStatus(req.user.id);
    this.logger.log(
      `[getSyncStatus] Returning sync status for user ${req.user.id}: ${JSON.stringify(result)}`,
    );
    return result;
  }

  @Get('auth/:provider')
  @UseGuards(JwtAuthGuard)
  async getAuthUrl(
    @Param() params: CalendarSyncProviderParamDto,
    @Request() req: RequestWithUser,
  ): Promise<{ authUrl: string }> {
    const provider = params.provider;
    this.logger.log(
      `[getAuthUrl] Request from user: ${req.user.id} for provider: ${provider}`,
    );

    const authUrl = await this.calendarSyncService.getAuthUrl(
      provider,
      req.user.id,
    );
    this.logger.log(
      `[getAuthUrl] Generated auth URL for ${provider}: ${authUrl.substring(0, 100)}...`,
    );
    return { authUrl };
  }

  @Get('callback/:provider')
  async handleOAuthCallback(
    @Param() params: CalendarSyncProviderParamDto,
    @Query() query: OAuthCallbackQueryDto,
    @Res() res: Response,
  ) {
    const provider = params.provider;
    const { code, state, userId } = query;
    this.logger.log(
      `[handleOAuthCallback] Received callback for provider: ${provider}, state: ${state}, userId: ${userId}, code: ${code?.substring(0, 10)}...`,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (!code) {
      this.logger.error(`[handleOAuthCallback] No authorization code provided`);
      return res.redirect(`${frontendUrl}?error=authorization_denied`);
    }

    try {
      const userIdToUse = this.resolveUserId(state, userId);

      this.logger.log(
        `[handleOAuthCallback] Using userId: ${userIdToUse} (from state: ${state}, from param: ${userId})`,
      );

      this.logger.log(`[handleOAuthCallback] Calling calendar sync service...`);
      await this.calendarSyncService.handleOAuthCallback(
        provider,
        code,
        userIdToUse,
      );

      this.logger.log(
        `[handleOAuthCallback] OAuth callback completed successfully, redirecting to calendar sync page`,
      );
      return res.redirect(`${frontendUrl}/calendar-sync?success=connected`);
    } catch (error: unknown) {
      this.logger.error(
        `[handleOAuthCallback] OAuth callback error for provider ${provider}:`,
        error instanceof Error ? error.stack : undefined,
      );
      return res.redirect(
        `${frontendUrl}/calendar-sync?error=sync_failed&details=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`,
      );
    }
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncCalendars(
    @Request() req: RequestWithUser,
    @Body() syncData: SyncCalendarsDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `[syncCalendars] Request from user: ${req.user.id} with data: ${JSON.stringify(syncData)}`,
    );
    try {
      await this.calendarSyncService.syncCalendars(req.user.id, syncData);
      this.logger.log(
        `[syncCalendars] Successfully synced calendars for user: ${req.user.id}`,
      );
      return { message: 'Calendars synced successfully' };
    } catch (error: unknown) {
      this.logger.error(
        `[syncCalendars] Error syncing calendars for user ${req.user.id}:`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.calendarSyncService.disconnect(req.user.id);
    return { message: 'All calendar providers disconnected successfully' };
  }

  @Post('disconnect/:provider')
  @UseGuards(JwtAuthGuard)
  async disconnectProvider(
    @Param() params: CalendarSyncProviderParamDto,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const provider = params.provider;

    await this.calendarSyncService.disconnectProvider(
      req.user.id,
      provider,
    );
    return {
      message: `${provider} calendar provider disconnected successfully`,
    };
  }

  @Post('force')
  @UseGuards(JwtAuthGuard)
  async forceSync(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.calendarSyncService.forceSync(req.user.id);
    return { message: 'Sync completed successfully' };
  }

  private resolveUserId(state?: string, userIdFromQuery?: number): number {
    if (state && state.startsWith('calendar-sync-')) {
      const stateParts = state.split('-');
      if (stateParts.length >= 3) {
        const parsed = Number.parseInt(stateParts[2], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    if (typeof userIdFromQuery === 'number' && userIdFromQuery > 0) {
      return userIdFromQuery;
    }

    throw new BadRequestException('Missing user context for OAuth callback');
  }
}
