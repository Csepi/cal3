import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configurationService: ConfigurationService,
  ) {
    const backendBaseUrl =
      configurationService.getBackendBaseUrl() || 'http://localhost:8081';
    const callbackUrl =
      configurationService.getValue('GOOGLE_CALLBACK_URL') ||
      `${backendBaseUrl}/api/auth/google/callback`;
    const clientId =
      configurationService.getValue('GOOGLE_CLIENT_ID') ||
      'your-google-client-id';
    const clientSecret =
      configurationService.getValue('GOOGLE_CLIENT_SECRET') ||
      'your-google-client-secret';

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };

    const validatedUser = await this.authService.validateGoogleUser(user);
    done(null, validatedUser);
  }
}
