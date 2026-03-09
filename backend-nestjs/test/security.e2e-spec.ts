import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { Organisation } from '../src/entities/organisation.entity';
import {
  OrganisationUser,
  OrganisationRoleType,
} from '../src/entities/organisation-user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DEVICE_FINGERPRINT_HEADER } from '../src/auth/services/token-fingerprint.service';

describe('Security Hardening (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organisationRepository: Repository<Organisation>;
  let organisationUserRepository: Repository<OrganisationUser>;
  let jwtService: JwtService;
  let userAToken: string;
  let userBToken: string;
  let organisationA: Organisation;
  let organisationB: Organisation;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_DATABASE = ':memory:';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_ACCESS_TTL = '600s';
    process.env.JWT_REFRESH_TTL = '3600s';
    process.env.SECURITY_ALLOWED_ORIGINS = 'http://localhost:3000';

    const appModule = require('../src/app.module');
    const AppModuleClass = appModule.AppModule;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleClass],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    userRepository = dataSource.getRepository(User);
    organisationRepository = dataSource.getRepository(Organisation);
    organisationUserRepository = dataSource.getRepository(OrganisationUser);
    jwtService = app.get(JwtService);

    await seedMultiTenantData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validation & Headers', () => {
    it('rejects extraneous request properties for register', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      await request(server)
        .post('/auth/register')
        .send({
          username: 'validator',
          email: 'validator@example.com',
          password: 'Password@123',
          unexpected: 'value',
        })
        .expect(400);
    });

    it('returns hardened security headers', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const response = await request(server).get('/');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain(
        "default-src 'none'",
      );
      expect(response.headers['permissions-policy']).toContain('camera=()');
    });
  });

  describe('Multitenancy guards', () => {
    it('blocks cross-organisation reads', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      await request(server)
        .get(`/organisations/${organisationB.id}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(403);
    });

    it('blocks organisation update when user only has read-level org role', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      await request(server)
        .patch(`/organisations/${organisationA.id}/color`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ color: '#22c55e' })
        .expect(403);
    });
  });

  describe('Token hardening', () => {
    it('detects refresh token replay and revokes the token family', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const login = await request(server)
        .post('/auth/login')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-replay')
        .send({
          username: 'tenant-user-a',
          password: 'SuperSecret123',
        });

      const firstRefreshToken = login.body.refresh_token as string;
      expect(firstRefreshToken).toBeTruthy();

      await request(server)
        .post('/auth/refresh')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-replay')
        .send({ refreshToken: firstRefreshToken })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .post('/auth/refresh')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-replay')
        .send({ refreshToken: firstRefreshToken })
        .expect(401);
    });

    it('rejects refresh when fingerprint changes', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const login = await request(server)
        .post('/auth/login')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-a')
        .send({
          username: 'tenant-user-a',
          password: 'SuperSecret123',
        });

      const refreshToken = login.body.refresh_token as string;
      expect(refreshToken).toBeTruthy();

      await request(server)
        .post('/auth/refresh')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-b')
        .send({ refreshToken })
        .expect(401);
    });

    it('rejects revoked access JWTs after logout', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const login = await request(server)
        .post('/auth/login')
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-logout')
        .send({
          username: 'tenant-user-a',
          password: 'SuperSecret123',
        });

      const accessToken = login.body.access_token as string;
      const refreshToken = login.body.refresh_token as string;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();

      await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-primecal-client', 'mobile-native')
        .set(DEVICE_FINGERPRINT_HEADER, 'device-logout')
        .send({ refreshToken })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  async function seedMultiTenantData() {
    const password = await bcrypt.hash('SuperSecret123', 10);
    const userA = await userRepository.save(
      userRepository.create({
        username: 'tenant-user-a',
        email: 'tenant-a@example.com',
        password,
        role: UserRole.USER,
        isActive: true,
      }),
    );

    organisationA = await organisationRepository.save(
      organisationRepository.create({
        name: 'Tenant A',
        description: 'First tenant',
      }),
    );

    organisationB = await organisationRepository.save(
      organisationRepository.create({
        name: 'Tenant B',
        description: 'Second tenant',
      }),
    );

    await organisationUserRepository.save(
      organisationUserRepository.create({
        organisationId: organisationA.id,
        userId: userA.id,
        role: OrganisationRoleType.ADMIN,
      }),
    );

    const userB = await userRepository.save(
      userRepository.create({
        username: 'tenant-user-b',
        email: 'tenant-b@example.com',
        password,
        role: UserRole.USER,
        isActive: true,
      }),
    );

    await organisationUserRepository.save(
      organisationUserRepository.create({
        organisationId: organisationA.id,
        userId: userB.id,
        role: OrganisationRoleType.USER,
      }),
    );

    userAToken = jwtService.sign({
      sub: userA.id,
      username: userA.username,
      role: userA.role,
    });

    userBToken = jwtService.sign({
      sub: userB.id,
      username: userB.username,
      role: userB.role,
    });
  }
});
