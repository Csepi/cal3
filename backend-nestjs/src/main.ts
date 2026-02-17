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
import {
  applyPermissionsPolicy,
  buildCorsOptions,
  buildHelmetOptions,
  getCorsAllowedHeaders,
  resolveAllowedOrigins,
} from './common/security/security.config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';

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
    if (process.env.LOG_JSON === 'true') {
      appLogger.setFormat('json');
    }
    app.useLogger(appLogger);
    dbLogger.log('Application logger configured.');

    dbLogger.log('Enabling shutdown hooks and proxy settings...');
    app.enableShutdownHooks();
    app.enable('trust proxy');
    dbLogger.log('Shutdown hooks and proxy settings enabled.');

    // Get DataSource to monitor connection
    dbLogger.log('Resolving DataSource from NestJS container...');
    const dataSource = app.get(DataSource);
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
          const result = await dataSource.query(
            'SELECT version(), current_database(), current_user',
          );
          const queryDuration = Date.now() - queryStart;
          dbLogger.log(`Test query successful (${queryDuration}ms)`);
          dbLogger.log(
            `PostgreSQL version: ${result[0].version.split(',')[0]}`,
          );
          dbLogger.log(`Database: ${result[0].current_database}`);
          dbLogger.log(`User: ${result[0].current_user}`);
        } else {
          await dataSource.query('SELECT 1');
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
      next();
    });
    dbLogger.log('Middleware applied.');

    dbLogger.log('Enabling CORS...');
    app.enableCors(corsOptions);
    dbLogger.log('CORS enabled.');

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        if (origin) {
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
    app.useGlobalFilters(new AllExceptionsFilter(requestContext));
    const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
    const responseInterceptor = new ResponseInterceptor(requestContext);
    app.useGlobalInterceptors(
      new RequestContextUserInterceptor(requestContext),
      requestLoggingInterceptor,
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
    const config = new DocumentBuilder()
      .setTitle('Calendar Sharing API')
      .setDescription(
        'A comprehensive calendar sharing application with multi-user support',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    dbLogger.log('Swagger documentation registered.');

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
