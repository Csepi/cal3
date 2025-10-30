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
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
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
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.id);
  }

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req) {
    // Redirect will be handled by Google OAuth strategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req, @Res() res) {
    const authResult = req.user;
    console.log(
      'Google OAuth callback - authResult:',
      JSON.stringify(authResult, null, 2),
    );

    // Check if this is a calendar sync request
    const state = req.query.state;
    if (state && state.includes('calendar-sync')) {
      // Extract user ID from JWT token if available
      const userId = authResult.userId || authResult.id;
      const code = req.query.code;

      if (code && userId) {
        // This is a calendar sync request, redirect to calendar sync controller
        const redirectUrl = `http://localhost:8081/api/calendar-sync/callback/google?code=${code}&state=${state}&userId=${userId}`;
        return res.redirect(redirectUrl);
      }
    }

    // Regular auth flow
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const token = authResult.access_token;
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&provider=google`;
    console.log('Google OAuth callback - redirectUrl:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  // Microsoft OAuth routes
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  async microsoftAuth(@Req() req) {
    // Redirect will be handled by Microsoft OAuth strategy
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftAuthRedirect(@Req() req, @Res() res) {
    const authResult = req.user;
    console.log(
      'Microsoft OAuth callback - authResult:',
      JSON.stringify(authResult, null, 2),
    );

    // Check if this is a calendar sync request
    const state = req.query.state;
    if (state && state.includes('calendar-sync')) {
      // Extract user ID from JWT token if available
      const userId = authResult.userId || authResult.id;
      const code = req.query.code;

      if (code && userId) {
        // This is a calendar sync request, redirect to calendar sync controller
        const redirectUrl = `http://localhost:8081/api/calendar-sync/callback/microsoft?code=${code}&state=${state}&userId=${userId}`;
        return res.redirect(redirectUrl);
      }
    }

    // Regular auth flow
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const token = authResult.access_token;
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&provider=microsoft`;
    console.log('Microsoft OAuth callback - redirectUrl:', redirectUrl);
    return res.redirect(redirectUrl);
  }
}
