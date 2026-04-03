import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { ParameterizedQueryService } from '../src/common/database/parameterized-query.service';

jest.setTimeout(120000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: {
            isInitialized: true,
          } satisfies Partial<DataSource>,
        },
        {
          provide: ParameterizedQueryService,
          useValue: {
            query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          } satisfies Partial<ParameterizedQueryService>,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('/healthz (GET)', () => {
    return request(app.getHttpServer()).get('/healthz').expect(200);
  });
});
