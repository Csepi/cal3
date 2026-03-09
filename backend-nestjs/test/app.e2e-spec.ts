import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

jest.setTimeout(120000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalDbType = process.env.DB_TYPE;
  const originalDbDatabase = process.env.DB_DATABASE;
  const originalDbSynchronize = process.env.DB_SYNCHRONIZE;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_DATABASE = ':memory:';
    process.env.DB_SYNCHRONIZE = 'true';

    // Dynamically load AppModule after test DB env is set.
    const { AppModule } = require('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (originalDbType === undefined) {
      delete process.env.DB_TYPE;
    } else {
      process.env.DB_TYPE = originalDbType;
    }
    if (originalDbDatabase === undefined) {
      delete process.env.DB_DATABASE;
    } else {
      process.env.DB_DATABASE = originalDbDatabase;
    }
    if (originalDbSynchronize === undefined) {
      delete process.env.DB_SYNCHRONIZE;
    } else {
      process.env.DB_SYNCHRONIZE = originalDbSynchronize;
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
