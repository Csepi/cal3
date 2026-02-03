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

describe('Security Hardening (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organisationRepository: Repository<Organisation>;
  let organisationUserRepository: Repository<OrganisationUser>;
  let jwtService: JwtService;
  let userAToken: string;
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

    userAToken = jwtService.sign({
      sub: userA.id,
      username: userA.username,
      role: userA.role,
    });
  }
});
