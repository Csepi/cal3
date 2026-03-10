import { Controller, Get, Module, Post, Body } from '@nestjs/common';
import type { INestApplication, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HoneypotController } from '../src/api-security/controllers/honeypot.controller';
import { IpBlockMiddleware } from '../src/api-security/middleware/ip-block.middleware';
import { RequestHardeningMiddleware } from '../src/api-security/middleware/request-hardening.middleware';
import { AbusePreventionService } from '../src/api-security/services/abuse-prevention.service';
import { SecurityStoreService } from '../src/api-security/services/security-store.service';

@Controller('test')
class ApiSecurityE2eController {
  @Get('ping')
  ping() {
    return { ok: true };
  }

  @Post('mutate')
  mutate(@Body() body: Record<string, unknown>) {
    return { ok: true, body };
  }
}

@Module({
  controllers: [ApiSecurityE2eController, HoneypotController],
  providers: [
    SecurityStoreService,
    AbusePreventionService,
    IpBlockMiddleware,
    RequestHardeningMiddleware,
  ],
})
class ApiSecurityE2eModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(IpBlockMiddleware, RequestHardeningMiddleware)
      .forRoutes('*');
  }
}

describe('API security enforcement (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.REDIS_URL = '';
    process.env.ABUSE_HONEYPOT_BLOCK_SECONDS = '120';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiSecurityE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks unsafe content type for mutating endpoint', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .post('/api/test/mutate')
      .set('Content-Type', 'text/plain')
      .send('payload')
      .expect(415);
  });

  it('honeypot hit leads to subsequent IP block', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get('/api/security/honeypot/admin-login')
      .expect(204);

    await request(server)
      .get('/api/test/ping')
      .expect(403);
  });
});
