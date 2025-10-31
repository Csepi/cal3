import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { AuthService } from './auth.service';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly authService: AuthService,
    private readonly configurationService: ConfigurationService,
  ) {
    const backendBaseUrl =
      configurationService.getBackendBaseUrl() || 'http://localhost:8081';
    const callbackUrl =
      configurationService.getValue('MICROSOFT_CALLBACK_URL') ||
      `${backendBaseUrl}/api/auth/microsoft/callback`;
    const clientId =
      configurationService.getValue('MICROSOFT_CLIENT_ID') ||
      'your-microsoft-client-id';
    const clientSecret =
      configurationService.getValue('MICROSOFT_CLIENT_SECRET') ||
      'your-microsoft-client-secret';
    const tenantId =
      configurationService.getValue('MICROSOFT_TENANT_ID') || 'common';

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['openid', 'profile', 'email'],
      tenant: tenantId,
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
