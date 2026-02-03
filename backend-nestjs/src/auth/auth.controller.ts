import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenRequestDto,
} from '../dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigurationService } from '../configuration/configuration.service';
import { type Response, type Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import type { AuthSessionResult, AuthRequestMetadata } from './auth.service';
import type { RequestWithUser } from '../common/types/request-with-user';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.register(
      registerDto,
      this.extractMetadata(req),
    );
    this.setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
    return session.response;
  }

  @Post('login')
  @Throttle({ login: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.login(
      loginDto,
      this.extractMetadata(req),
    );
    this.setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
    return session.response;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getUserProfile(req.user.id);
  }

  @Post('refresh')
  @Throttle({ refresh: { limit: 10, ttl: 60 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Body() body: RefreshTokenRequestDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const token = body.refreshToken ?? this.getRefreshTokenFromCookies(req);
    const session = await this.authService.refreshSession(
      token,
      this.extractMetadata(req),
    );
    this.setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
    return session.response;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(
    @Req() req: RequestWithUser,
    @Body() body: RefreshTokenRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body.refreshToken ?? this.getRefreshTokenFromCookies(req);
    await this.authService.logout(
      req.user.id,
      token ?? null,
      this.extractMetadata(req),
    );
    this.clearRefreshCookie(res);
    return { success: true };
  }

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Redirect will be handled by Google OAuth strategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: RequestWithUser, @Res() res: Response) {
    const authResult = req.user as any as AuthSessionResult;
    console.log(
      'Google OAuth callback - authResult:',
      JSON.stringify(authResult.response, null, 2),
    );

    // Check if this is a calendar sync request
    const state = this.getQueryString(req, 'state');
    if (state?.includes('calendar-sync')) {
      // Extract user ID from JWT token if available
      const userId = authResult.response.user?.id;
      const code = this.getQueryString(req, 'code');

      if (code && userId) {
        // This is a calendar sync request, redirect to calendar sync controller
        const redirectUrl = `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/google?code=${code}&state=${state}&userId=${userId}`;
        return res.redirect(redirectUrl);
      }
    }

    // Regular auth flow
    const frontendUrl = this.configurationService.getFrontendBaseUrl();
    this.setRefreshCookie(
      res,
      authResult.refreshToken,
      authResult.refreshExpiresAt,
    );
    const token = authResult.response.access_token;
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&provider=google`;
    console.log('Google OAuth callback - redirectUrl:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  // Microsoft OAuth routes
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  async microsoftAuth() {
    // Redirect will be handled by Microsoft OAuth strategy
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftAuthRedirect(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const authResult = req.user as any as AuthSessionResult;
    console.log(
      'Microsoft OAuth callback - authResult:',
      JSON.stringify(authResult, null, 2),
    );

    // Check if this is a calendar sync request
    const state = this.getQueryString(req, 'state');
    if (state?.includes('calendar-sync')) {
      // Extract user ID from JWT token if available
      const userId = authResult.response.user?.id;
      const code = this.getQueryString(req, 'code');

      if (code && userId) {
        // This is a calendar sync request, redirect to calendar sync controller
        const redirectUrl = `${this.configurationService.getBackendBaseUrl()}/api/calendar-sync/callback/microsoft?code=${code}&state=${state}&userId=${userId}`;
        return res.redirect(redirectUrl);
      }
    }

    // Regular auth flow
    const frontendUrl = this.configurationService.getFrontendBaseUrl();
    this.setRefreshCookie(
      res,
      authResult.refreshToken,
      authResult.refreshExpiresAt,
    );
    const token = authResult.response.access_token;
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&provider=microsoft`;
    console.log('Microsoft OAuth callback - redirectUrl:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  private extractMetadata(req: ExpressRequest): AuthRequestMetadata {
    return {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    const secure = process.env.NODE_ENV !== 'development';
    res.cookie('cal3_refresh_token', token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      expires: expiresAt,
      path: '/api/auth',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie('cal3_refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/api/auth',
    });
  }

  private getQueryString(req: ExpressRequest, key: string): string | undefined {
    const value = req.query[key];
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
    return undefined;
  }

  private getRefreshTokenFromCookies(req: ExpressRequest): string | undefined {
    const cookieValue = req.cookies?.cal3_refresh_token;
    return typeof cookieValue === 'string' ? cookieValue : undefined;
  }
}
