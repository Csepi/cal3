import {
  Injectable,
  ExecutionContext,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { firstValueFrom, isObservable } from 'rxjs';
import type { ApiKeyAuthContext } from '../../api-security/types';
import { ApiKeyService } from '../../api-security/services/api-key.service';
import { ALLOW_INCOMPLETE_ONBOARDING_KEY } from '../decorators/allow-incomplete-onboarding.decorator';

type AuthRequest = Request & {
  apiKey?: ApiKeyAuthContext;
  user?: unknown;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly apiKeyService?: ApiKeyService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip authentication for public routes
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const apiKey = this.extractApiKey(request);
    if (apiKey && this.apiKeyService) {
      const authResult = await this.apiKeyService.authenticate(
        apiKey,
        request.method,
        request.path || request.originalUrl || request.url || '',
      );
      request.apiKey = authResult.context;
      request.user = authResult.user;
      return true;
    }

    const activationResult = super.canActivate(context);
    if (isObservable(activationResult)) {
      const activated = await firstValueFrom(activationResult);
      this.assertOnboardingCompletedOrAllowed(context, request);
      return activated;
    }
    const activated = Boolean(await activationResult);
    this.assertOnboardingCompletedOrAllowed(context, request);
    return activated;
  }

  private extractApiKey(request: AuthRequest): string | null {
    const keyHeader = request.headers['x-api-key'];
    const directKey = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;
    if (typeof directKey === 'string' && directKey.trim().length > 0) {
      return directKey.trim();
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (!scheme || !token) {
      return null;
    }
    if (scheme.toLowerCase() !== 'apikey') {
      return null;
    }
    return token.trim();
  }

  private assertOnboardingCompletedOrAllowed(
    context: ExecutionContext,
    request: AuthRequest,
  ): void {
    if (request.apiKey) {
      return;
    }

    const allowIncomplete = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INCOMPLETE_ONBOARDING_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowIncomplete) {
      return;
    }

    const path = request.path || request.originalUrl || request.url || '';
    if (path.startsWith('/api/auth') || path.startsWith('/auth')) {
      return;
    }

    const user = request.user as { onboardingCompleted?: boolean } | undefined;
    if (!user) {
      return;
    }

    if (user.onboardingCompleted === false) {
      throw new ForbiddenException(
        'Onboarding must be completed before accessing this resource.',
      );
    }
  }
}
