import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { AuthService } from './auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private authService: AuthService) {
    const baseUrl = process.env.BASE_URL || 'http://localhost';
    const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
    const defaultCallbackUrl = `${baseUrl}:${backendPort}/api/auth/microsoft/callback`;

    super({
      clientID: process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
      clientSecret:
        process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || defaultCallbackUrl,
      scope: ['openid', 'profile', 'email'],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails } = profile;
    const email = emails && emails[0] ? emails[0].value : null;

    const user = {
      microsoftId: id,
      email: email,
      firstName: profile.name?.givenName || displayName?.split(' ')[0] || '',
      lastName:
        profile.name?.familyName ||
        displayName?.split(' ').slice(1).join(' ') ||
        '',
      displayName: displayName,
      accessToken,
    };

    const validatedUser = await this.authService.validateMicrosoftUser(user);
    done(null, validatedUser);
  }
}
