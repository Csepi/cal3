import { Body, Controller, Get, Post } from '@nestjs/common';
import type { INestApplication, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { IsString, MaxLength, MinLength } from 'class-validator';
import request from 'supertest';
import { createApiValidationPipe } from '../src/common/pipes/validation.pipe';
import { CsrfProtectionMiddleware } from '../src/common/middleware/csrf-protection.middleware';
import { RequestSanitizationMiddleware } from '../src/common/middleware/request-sanitization.middleware';
import { StrictOriginMiddleware } from '../src/common/middleware/strict-origin.middleware';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CsrfService } from '../src/common/security/csrf.service';
import { IsSafeText } from '../src/common/validation/security.validators';
import { SanitizeText } from '../src/common/validation/sanitize.decorator';

class EchoRequestDto {
  @SanitizeText({ trim: true, maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @IsSafeText()
  text!: string;
}

@Controller()
class InputValidationSecurityTestController {
  @Get('health')
  health() {
    return { ok: true };
  }

  @Post('secure/echo')
  echo(@Body() body: EchoRequestDto) {
    return { text: body.text };
  }

  @Post('automation/webhook/test')
  webhook(@Body() body: Record<string, unknown>) {
    return { accepted: true, payload: body };
  }
}

@Module({
  controllers: [InputValidationSecurityTestController],
  providers: [
    CsrfService,
    RequestSanitizationMiddleware,
    StrictOriginMiddleware,
    CsrfProtectionMiddleware,
  ],
})
class InputValidationSecurityTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        RequestSanitizationMiddleware,
        StrictOriginMiddleware,
        CsrfProtectionMiddleware,
      )
      .forRoutes('*');
  }
}

describe('Input validation security (e2e)', () => {
  let app: INestApplication;
  const allowedOrigin = 'https://app.primecal.eu';
  const previousAllowedOrigins = process.env.SECURITY_ALLOWED_ORIGINS;

  beforeAll(async () => {
    jest.setTimeout(30000);
    process.env.SECURITY_ALLOWED_ORIGINS = allowedOrigin;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InputValidationSecurityTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(createApiValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (previousAllowedOrigins === undefined) {
      delete process.env.SECURITY_ALLOWED_ORIGINS;
    } else {
      process.env.SECURITY_ALLOWED_ORIGINS = previousAllowedOrigins;
    }
  });

  it('rejects unknown fields through global ValidationPipe', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .post('/api/secure/echo')
      .set('Origin', allowedOrigin)
      .send({
        text: 'hello',
        unexpected: 'nope',
      })
      .expect(400);
  });

  it('sanitizes control characters before reaching controller logic', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .post('/api/secure/echo')
      .set('Origin', allowedOrigin)
      .send({
        text: '  he\u0000llo  ',
      })
      .expect(201);

    expect(response.body.text).toBe('hello');
  });

  it('blocks mutating requests from disallowed origins', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .post('/api/secure/echo')
      .set('Origin', 'https://evil.example')
      .send({ text: 'hello' })
      .expect(403);
  });

  it('enforces CSRF validation when csrf cookie exists', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .post('/api/secure/echo')
      .set('Origin', allowedOrigin)
      .set('Cookie', `${CSRF_COOKIE_NAME}=known-token`)
      .send({ text: 'hello' })
      .expect(403);
  });

  it('accepts mutating request when csrf cookie/header pair matches', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .post('/api/secure/echo')
      .set('Origin', allowedOrigin)
      .set('Cookie', `${CSRF_COOKIE_NAME}=known-token`)
      .set(CSRF_HEADER_NAME, 'known-token')
      .send({ text: 'hello' })
      .expect(201);
  });

});
