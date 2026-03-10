import 'dotenv/config';

// Polyfill for crypto module (required for @nestjs/schedule in some Docker environments)
import crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  const globalScope = globalThis as typeof globalThis & { crypto?: Crypto };
  globalScope.crypto = crypto.webcrypto as Crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { DatabaseDiagnosticsService } from './database/database-diagnostics.service';
import { AppLoggerService } from './logging/app-logger.service';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestContextService } from './common/services/request-context.service';
import { RequestContextUserInterceptor } from './common/interceptors/request-context-user.interceptor';
import { RequestLoggingInterceptor } from './logging/request-logging.interceptor';
import { ResponseInterceptor } from './common/responses/response.interceptor';
import { createApiValidationPipe } from './common/pipes/validation.pipe';
import { AuditTrailService } from './logging/audit-trail.service';
import { MetricsInterceptor } from './monitoring/metrics.interceptor';
import {
  applyPermissionsPolicy,
  applyCertificateTransparencyPolicy,
  buildCorsOptions,
  buildHelmetOptions,
  getCorsAllowedHeaders,
  isOriginAllowed,
  resolveAllowedOrigins,
} from './common/security/security.config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded, NextFunction, Request, Response } from 'express';
import { ParameterizedQueryService } from './common/database/parameterized-query.service';
import { RateLimitInterceptor } from './api-security/interceptors/rate-limit.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';

const logger = new Logger('Bootstrap');
const dbLogger = new Logger('DatabaseConnection');

async function bootstrap() {
  const startTime = Date.now();

  logger.log('========================================');
  logger.log('Starting PrimeCal Application');
  logger.log(`Timestamp: ${new Date().toISOString()}`);
  logger.log(`Node Version: ${process.version}`);
  logger.log(`Platform: ${process.platform}`);
  logger.log('========================================');

  try {
    dbLogger.log('Creating NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });
    dbLogger.log('NestJS application instance created.');

    dbLogger.log('Configuring application logger...');
    const appLogger = app.get(AppLoggerService);
    if (process.env.LOG_JSON !== 'false') {
      appLogger.setFormat('json');
    } else {
      appLogger.setFormat('text');
    }
    app.useLogger(appLogger);
    dbLogger.log('Application logger configured.');

    dbLogger.log('Enabling shutdown hooks and proxy settings...');
    app.enableShutdownHooks();
    app.enable('trust proxy');
    const requestBodyLimit = process.env.REQUEST_MAX_BYTES || '1mb';
    app.use(
      json({
        limit: requestBodyLimit,
        verify: (req, _res, buffer) => {
          (req as Request & { rawBody?: string }).rawBody = buffer.toString(
            'utf8',
          );
        },
      }),
    );
    app.use(urlencoded({ extended: true, limit: requestBodyLimit }));
    dbLogger.log('Shutdown hooks and proxy settings enabled.');

    // Get DataSource to monitor connection
    dbLogger.log('Resolving DataSource from NestJS container...');
    const dataSource = app.get(DataSource);
    const parameterizedQueryService = app.get(ParameterizedQueryService);
    dbLogger.log(
      `DataSource resolved. Initialized: ${dataSource.isInitialized}`,
    );

    if (dataSource.isInitialized) {
      const connectionDuration = Date.now() - startTime;
      dbLogger.log('Database connection established successfully.');
      dbLogger.log(`Connection time: ${connectionDuration}ms`);
      dbLogger.log(`Database type: ${dataSource.options.type}`);

      if (dataSource.options.type === 'postgres') {
        const pgOptions = dataSource.options as {
          host?: string;
          port?: number | string;
          database?: string;
        };
        dbLogger.log(
          `Connected to ${pgOptions.host}:${pgOptions.port}/${pgOptions.database}`,
        );
      }

      // Test query to verify connection
      try {
        dbLogger.log('Running validation query against the database...');
        const queryStart = Date.now();

        if (dataSource.options.type === 'postgres') {
          const result = await parameterizedQueryService.query<{
            version: string;
            current_database: string;
            current_user: string;
          }>(
            'SELECT version(), current_database(), current_user',
            [],
            { statementKey: 'bootstrap_postgres_version' },
          );
          const queryDuration = Date.now() - queryStart;
          dbLogger.log(`Test query successful (${queryDuration}ms)`);
          const row = result[0];
          if (row) {
            dbLogger.log(`PostgreSQL version: ${row.version.split(',')[0]}`);
            dbLogger.log(`Database: ${row.current_database}`);
            dbLogger.log(`User: ${row.current_user}`);
          }
        } else {
          await parameterizedQueryService.query(
            'SELECT 1',
            [],
            { statementKey: 'bootstrap_health' },
          );
          const queryDuration = Date.now() - queryStart;
          dbLogger.log(`Test query successful (${queryDuration}ms)`);
        }
      } catch (queryError: unknown) {
        const queryErrorMessage =
          queryError instanceof Error ? queryError.message : String(queryError);
        dbLogger.error('Test query failed', queryErrorMessage);
      }

      // Run network diagnostics if enabled
      if (process.env.DB_RUN_DIAGNOSTICS === 'true') {
        const diagnosticsService = app.get(DatabaseDiagnosticsService);
        await diagnosticsService.testNetworkConnectivity();
      }
    } else {
      dbLogger.warn('Database connection not initialized yet.');
    }

    // Smart port and URL configuration
    const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
    const backendHost =
      process.env.BACKEND_HOST ||
      process.env.BIND_ADDRESS ||
      process.env.HOST ||
      '0.0.0.0';
    const baseUrl = process.env.BASE_URL || 'http://localhost';

    dbLogger.log(
      `Resolved server config -> host: ${backendHost}, port: ${backendPort}, baseUrl: ${baseUrl}`,
    );
    const allowedOrigins = resolveAllowedOrigins();
    const corsOptions = buildCorsOptions(allowedOrigins);
    const allowedHeaders = getCorsAllowedHeaders();

    dbLogger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    dbLogger.log(`CORS allowed headers: ${allowedHeaders.join(', ')}`);
    dbLogger.log(
      'Applying middleware: cookieParser, helmet, permissions policy...',
    );
    app.use(cookieParser());
    app.use(helmet(buildHelmetOptions(allowedOrigins)));
    app.use((req: Request, res: Response, next: NextFunction) => {
      void req;
      applyPermissionsPolicy(res);
      applyCertificateTransparencyPolicy(res);
      next();
    });
    dbLogger.log('Middleware applied.');

    dbLogger.log('Enabling CORS...');
    app.enableCors(corsOptions);
    dbLogger.log('CORS enabled.');

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        const originHeader = req.headers.origin;
        const origin = Array.isArray(originHeader)
          ? originHeader[0]
          : originHeader;
        if (origin) {
          if (!isOriginAllowed(origin, allowedOrigins)) {
            dbLogger.warn(`Blocked preflight for disallowed origin ${origin}`);
            res.status(403).send();
            return;
          }
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Vary', 'Origin');
        }
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          allowedHeaders.join(', '),
        );
        res
          .status(
            typeof corsOptions.optionsSuccessStatus === 'number'
              ? corsOptions.optionsSuccessStatus
              : 204,
          )
          .send();
        return;
      }
      next();
    });

    // Keep root URL explicit for uptime checks and humans; API routes stay under /api.
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && req.path === '/') {
        res.status(200).json({
          status: 'ok',
          service: 'primecal-backend',
          health: '/api/health',
          docs: '/api/docs',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next();
    });

    dbLogger.log('Registering global filters and interceptors...');
    const requestContext = app.get(RequestContextService);
    const auditTrail = app.get(AuditTrailService);
    app.useGlobalFilters(
      new AllExceptionsFilter(requestContext, appLogger, auditTrail),
    );
    const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
    const metricsInterceptor = app.get(MetricsInterceptor);
    const responseInterceptor = new ResponseInterceptor(requestContext);
    app.useGlobalInterceptors(
      new RequestContextUserInterceptor(requestContext),
      app.get(RateLimitInterceptor),
      app.get(IdempotencyInterceptor),
      requestLoggingInterceptor,
      metricsInterceptor,
      responseInterceptor,
    );
    dbLogger.log('Global filters and interceptors registered.');

    // Global validation pipe
    dbLogger.log('Registering global validation pipe...');
    app.useGlobalPipes(createApiValidationPipe());
    dbLogger.log('Global validation pipe registered.');

    // API global prefix
    dbLogger.log('Setting global API prefix to /api...');
    app.setGlobalPrefix('api');
    dbLogger.log('Global API prefix set.');

    // Swagger documentation
    dbLogger.log('Building Swagger documentation...');
    const swaggerUser = process.env.SWAGGER_USER?.trim();
    const swaggerPassword = process.env.SWAGGER_PASSWORD?.trim();
    const swaggerEnabled =
      process.env.NODE_ENV !== 'production' || Boolean(swaggerUser && swaggerPassword);
    if (swaggerUser && swaggerPassword) {
      app.use(['/api/docs', '/api/docs-json'], (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="PrimeCal API Docs"');
          res.status(401).send('Swagger authentication required');
          return;
        }
        const credentials = Buffer.from(
          header.replace('Basic ', ''),
          'base64',
        ).toString('utf8');
        const [username, password] = credentials.split(':');
        if (username !== swaggerUser || password !== swaggerPassword) {
          res.setHeader('WWW-Authenticate', 'Basic realm="PrimeCal API Docs"');
          res.status(401).send('Invalid Swagger credentials');
          return;
        }
        next();
      });
    }

    const config = new DocumentBuilder()
      .setTitle('Calendar Sharing API')
      .setDescription(
        'A comprehensive calendar sharing application with multi-user support, enterprise API security, abuse prevention, and idempotency safeguards.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
        'bearer',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'Scoped API key (read/write/admin). Supported together with JWT authentication.',
        },
        'apiKey',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ bearer: [] }, { apiKey: [] }];
    document.components = document.components || {};
    document.components.responses = document.components.responses || {};
    document.components.responses.RateLimited = {
      description: 'Too many requests',
      headers: {
        'X-RateLimit-Limit': {
          description: 'Rate limit ceiling for the current window',
          schema: { type: 'integer' },
        },
        'X-RateLimit-Remaining': {
          description: 'Remaining requests in the current window',
          schema: { type: 'integer' },
        },
        'X-RateLimit-Reset': {
          description: 'Unix epoch seconds when the window resets',
          schema: { type: 'integer' },
        },
      },
      content: {
        'application/json': {
          example: {
            statusCode: 429,
            message: 'Rate limit exceeded. Please retry later.',
          },
        },
      },
    };
    if (swaggerEnabled) {
      SwaggerModule.setup('api/docs', app, document);
      dbLogger.log('Swagger documentation registered.');
    } else {
      dbLogger.warn(
        'Swagger disabled in production because SWAGGER_USER/SWAGGER_PASSWORD are not configured.',
      );
    }

    dbLogger.log('Starting HTTP server...');
    await app.listen(backendPort, backendHost);
    dbLogger.log('HTTP server started.');

    const totalStartupTime = Date.now() - startTime;
    logger.log('========================================');
    logger.log('APPLICATION STARTED SUCCESSFULLY');
    logger.log('========================================');
    logger.log(`Server: ${baseUrl}:${backendPort} (bind: ${backendHost})`);
    logger.log(`API Docs: ${baseUrl}:${backendPort}/api/docs`);
    logger.log(`CORS Allowed Origins: ${allowedOrigins.join(', ')}`);
    logger.log(`Total startup time: ${totalStartupTime}ms`);
    logger.log('========================================');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const failureDuration = Date.now() - startTime;
    dbLogger.error('========================================');
    dbLogger.error('FATAL: Application startup failed');
    dbLogger.error(`Failed after ${failureDuration}ms`);
    dbLogger.error('========================================');
    dbLogger.error(`Error: ${errorMessage}`);
    dbLogger.error(`Type: ${errorName}`);
    if (error instanceof Error && error.stack) {
      dbLogger.error('Stack trace:');
      dbLogger.error(error.stack);
    }
    dbLogger.error('========================================');
    process.exit(1);
  }
}
void bootstrap();
