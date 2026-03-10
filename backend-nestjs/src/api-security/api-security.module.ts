import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyController } from './controllers/api-key.controller';
import { HoneypotController } from './controllers/honeypot.controller';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { IpBlockMiddleware } from './middleware/ip-block.middleware';
import { RequestHardeningMiddleware } from './middleware/request-hardening.middleware';
import { AbusePreventionService } from './services/abuse-prevention.service';
import { AdvancedRateLimitService } from './services/advanced-rate-limit.service';
import { ApiKeyService } from './services/api-key.service';
import { CaptchaVerificationService } from './services/captcha-verification.service';
import { SecurityStoreService } from './services/security-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, User])],
  controllers: [ApiKeyController, HoneypotController],
  providers: [
    SecurityStoreService,
    CaptchaVerificationService,
    AbusePreventionService,
    AdvancedRateLimitService,
    ApiKeyService,
    IpBlockMiddleware,
    RequestHardeningMiddleware,
    RateLimitInterceptor,
  ],
  exports: [
    SecurityStoreService,
    CaptchaVerificationService,
    AbusePreventionService,
    AdvancedRateLimitService,
    ApiKeyService,
    IpBlockMiddleware,
    RequestHardeningMiddleware,
    RateLimitInterceptor,
  ],
})
export class ApiSecurityModule {}
