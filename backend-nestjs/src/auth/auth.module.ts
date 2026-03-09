import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';
import { User } from '../entities/user.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { TokenService } from './token.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { LoginAttemptService } from './services/login-attempt.service';
import { LoggingModule } from '../logging/logging.module';
import { TasksModule } from '../tasks/tasks.module';
import { RefreshTokenFamilyService } from './services/refresh-token-family.service';
import { JwtRevocationService } from './services/jwt-revocation.service';
import { TokenFingerprintService } from './services/token-fingerprint.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    ConfigurationModule,
    TasksModule,
    LoggingModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TTL') || '15m',
          issuer: configService.get<string>('JWT_ISSUER') || 'cal3-backend',
          audience: configService.get<string>('JWT_AUDIENCE') || 'cal3-users',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    MicrosoftStrategy,
    TokenService,
    LoginAttemptService,
    RefreshTokenFamilyService,
    JwtRevocationService,
    TokenFingerprintService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
