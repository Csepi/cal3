import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { User, UserRole } from '../../src/entities/user.entity';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';

const MANAGED_ENV_KEYS = [
  'DB_TYPE',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_SSL',
  'DB_SYNCHRONIZE',
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_ACCESS_TTL',
  'JWT_REFRESH_TTL',
  'SECURITY_ALLOWED_ORIGINS',
  'RATE_LIMIT_WINDOW_SEC',
  'RATE_LIMIT_MAX_REQUESTS',
] as const;

type ManagedEnvKey = (typeof MANAGED_ENV_KEYS)[number];

type EnvSnapshot = Record<ManagedEnvKey, string | undefined>;
const failOnUnavailableDocker = process.env.CI === 'true';

export class DockerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DockerUnavailableError';
  }
}

export interface PostgresNestHarness {
  app: INestApplication;
  dataSource: DataSource;
  userRepository: Repository<User>;
  container: StartedPostgreSqlContainer;
  stop: () => Promise<void>;
}

export interface SeedUserInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

const snapshotEnv = (): EnvSnapshot => {
  const snapshot = {} as EnvSnapshot;
  for (const key of MANAGED_ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
};

const restoreEnv = (snapshot: EnvSnapshot): void => {
  for (const key of MANAGED_ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const applyTestEnv = (container: StartedPostgreSqlContainer): void => {
  process.env.DB_TYPE = 'postgres';
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = String(container.getPort());
  process.env.DB_USERNAME = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_NAME = container.getDatabase();
  process.env.DB_SSL = 'false';
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';
  process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || '900s';
  process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || '86400s';
  process.env.SECURITY_ALLOWED_ORIGINS =
    process.env.SECURITY_ALLOWED_ORIGINS || 'http://localhost:3000';
  process.env.RATE_LIMIT_WINDOW_SEC = '60';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5000';
};

const isDockerRuntimeFailure = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Could not find a working container runtime strategy') ||
    message.includes('connect ECONNREFUSED') ||
    message.includes('Docker is not running') ||
    message.includes('No such container') ||
    message.includes('connect ENOENT') ||
    message.includes('Cannot connect to the Docker daemon')
  );
};

export async function startPostgresNestHarness(): Promise<PostgresNestHarness> {
  if (process.env.ENABLE_TESTCONTAINERS !== 'true') {
    throw new DockerUnavailableError(
      'Testcontainers execution disabled. Set ENABLE_TESTCONTAINERS=true to run docker-backed integration tests.',
    );
  }

  const envSnapshot = snapshotEnv();
  let container: StartedPostgreSqlContainer | null = null;

  try {
    const startupTimeoutMs = Number.parseInt(
      process.env.TESTCONTAINERS_START_TIMEOUT_MS ?? '120000',
      10,
    );
    const containerPromise = new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('cal3_test')
      .withUsername('cal3_test')
      .withPassword('cal3_test')
      .start();

    container = (await Promise.race([
      containerPromise,
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(
            new DockerUnavailableError(
              `Timed out waiting for PostgreSQL testcontainer startup after ${startupTimeoutMs}ms.`,
            ),
          );
        }, startupTimeoutMs);
      }),
    ])) as StartedPostgreSqlContainer;

    applyTestEnv(container);

    // AppModule must be loaded only after test DB env is set.
    const { AppModule } = require('../../src/app.module') as {
      AppModule: new (...args: never[]) => unknown;
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    return {
      app,
      dataSource,
      userRepository,
      container,
      stop: async () => {
        await app.close();
        if (container) {
          await container.stop();
        }
        restoreEnv(envSnapshot);
      },
    };
  } catch (error) {
    if (container) {
      await container.stop().catch(() => undefined);
    }
    restoreEnv(envSnapshot);
    if (isDockerRuntimeFailure(error)) {
      throw new DockerUnavailableError(
        'Docker runtime is unavailable for testcontainers-backed integration tests.',
      );
    }
    throw error;
  }
}

export async function seedUser(
  userRepository: Repository<User>,
  input: SeedUserInput,
): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const entity = userRepository.create({
    username: input.username,
    email: input.email,
    password: passwordHash,
    role: input.role ?? UserRole.USER,
    isActive: input.isActive ?? true,
  });
  return userRepository.save(entity);
}

export async function loginNative(
  app: INestApplication,
  username: string,
  password: string,
  fingerprint: string,
): Promise<request.Response> {
  const server = app.getHttpServer() as Parameters<typeof request>[0];
  return request(server)
    .post('/auth/login')
    .set('x-primecal-client', 'mobile-native')
    .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
    .send({ username, password });
}

export function describeDockerBacked(
  suiteName: string,
  suiteFactory: (
    helpers: {
      getHarness: () => PostgresNestHarness | null;
      isUnavailable: () => boolean;
      unavailabilityReason: () => string | null;
    },
  ) => void,
): void {
  describe(suiteName, () => {
    let harness: PostgresNestHarness | null = null;
    let unavailableReason: string | null = null;

    beforeAll(async () => {
      try {
        harness = await startPostgresNestHarness();
      } catch (error) {
        if (error instanceof DockerUnavailableError) {
          if (failOnUnavailableDocker) {
            throw error;
          }
          unavailableReason = error.message;
          return;
        }
        throw error;
      }
    });

    afterAll(async () => {
      if (harness) {
        await harness.stop();
      }
    });

    suiteFactory({
      getHarness: () => harness,
      isUnavailable: () => unavailableReason !== null,
      unavailabilityReason: () => unavailableReason,
    });
  });
}
