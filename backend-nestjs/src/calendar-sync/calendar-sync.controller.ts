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
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarSyncService } from './calendar-sync.service';
import {
  SyncCalendarsDto,
  CalendarSyncStatusDto,
} from '../dto/calendar-sync.dto';
import { SyncProvider } from '../entities/calendar-sync.entity';

@Controller('calendar-sync')
export class CalendarSyncController {
  private readonly logger = new Logger(CalendarSyncController.name);

  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getSyncStatus(@Request() req): Promise<CalendarSyncStatusDto> {
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
    @Param('provider') provider: string,
    @Request() req,
  ): Promise<{ authUrl: string }> {
    this.logger.log(
      `[getAuthUrl] Request from user: ${req.user.id} for provider: ${provider}`,
    );

    if (provider !== 'google' && provider !== 'microsoft') {
      this.logger.error(`[getAuthUrl] Invalid provider: ${provider}`);
      throw new Error('Invalid provider');
    }

    const authUrl = await this.calendarSyncService.getAuthUrl(
      provider as SyncProvider,
      req.user.id,
    );
    this.logger.log(
      `[getAuthUrl] Generated auth URL for ${provider}: ${authUrl.substring(0, 100)}...`,
    );
    return { authUrl };
  }

  @Get('callback/:provider')
  async handleOAuthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('userId') userId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[handleOAuthCallback] Received callback for provider: ${provider}, state: ${state}, userId: ${userId}, code: ${code?.substring(0, 10)}...`,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (provider !== 'google' && provider !== 'microsoft') {
      this.logger.error(`[handleOAuthCallback] Invalid provider: ${provider}`);
      return res.redirect(`${frontendUrl}?error=invalid_provider`);
    }

    if (!code) {
      this.logger.error(`[handleOAuthCallback] No authorization code provided`);
      return res.redirect(`${frontendUrl}?error=authorization_denied`);
    }

    try {
      // Extract user ID from state parameter (format: calendar-sync-{userId}-{randomString})
      let userIdToUse = 1; // fallback
      if (state && state.startsWith('calendar-sync-')) {
        const stateParts = state.split('-');
        if (stateParts.length >= 3) {
          userIdToUse = parseInt(stateParts[2]);
        }
      }

      // Fallback to query parameter if state parsing fails
      if (!userIdToUse && userId) {
        userIdToUse = parseInt(userId);
      }

      this.logger.log(
        `[handleOAuthCallback] Using userId: ${userIdToUse} (from state: ${state}, from param: ${userId})`,
      );

      this.logger.log(`[handleOAuthCallback] Calling calendar sync service...`);
      await this.calendarSyncService.handleOAuthCallback(
        provider as SyncProvider,
        code,
        userIdToUse,
      );

      this.logger.log(
        `[handleOAuthCallback] OAuth callback completed successfully, redirecting to calendar sync page`,
      );
      return res.redirect(`${frontendUrl}/calendar-sync?success=connected`);
    } catch (error) {
      this.logger.error(
        `[handleOAuthCallback] OAuth callback error for provider ${provider}:`,
        error.stack,
      );
      return res.redirect(
        `${frontendUrl}/calendar-sync?error=sync_failed&details=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncCalendars(
    @Request() req,
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
    } catch (error) {
      this.logger.error(
        `[syncCalendars] Error syncing calendars for user ${req.user.id}:`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Request() req): Promise<{ message: string }> {
    await this.calendarSyncService.disconnect(req.user.id);
    return { message: 'All calendar providers disconnected successfully' };
  }

  @Post('disconnect/:provider')
  @UseGuards(JwtAuthGuard)
  async disconnectProvider(
    @Param('provider') provider: string,
    @Request() req,
  ): Promise<{ message: string }> {
    if (provider !== 'google' && provider !== 'microsoft') {
      throw new Error('Invalid provider');
    }

    await this.calendarSyncService.disconnectProvider(
      req.user.id,
      provider as SyncProvider,
    );
    return {
      message: `${provider} calendar provider disconnected successfully`,
    };
  }

  @Post('force')
  @UseGuards(JwtAuthGuard)
  async forceSync(@Request() req): Promise<{ message: string }> {
    await this.calendarSyncService.forceSync(req.user.id);
    return { message: 'Sync completed successfully' };
  }
}
