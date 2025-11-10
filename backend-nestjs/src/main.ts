// Polyfill for crypto module (required for @nestjs/schedule in some Docker environments)
import crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { DatabaseDiagnosticsService } from './database/database-diagnostics.service';
import { AppLoggerService } from './logging/app-logger.service';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestContextService } from './common/services/request-context.service';
import { RequestContextUserInterceptor } from './common/interceptors/request-context-user.interceptor';
import { RequestLoggingInterceptor } from './logging/request-logging.interceptor';
import {
  applyPermissionsPolicy,
  buildCorsOptions,
  buildHelmetOptions,
  resolveAllowedOrigins,
} from './common/security/security.config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

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
    const app =
      await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
      });

    const appLogger = app.get(AppLoggerService);
    app.useLogger(appLogger);
    app.enableShutdownHooks();
    app.enable('trust proxy');

    // Get DataSource to monitor connection
    const dataSource = app.get(DataSource);

    if (dataSource.isInitialized) {
      const connectionDuration = Date.now() - startTime;
      dbLogger.log('Database connection established successfully.');
      dbLogger.log(`Connection time: ${connectionDuration}ms`);
      dbLogger.log(`Database type: ${dataSource.options.type}`);

      if (dataSource.options.type === 'postgres') {
        const pgOptions = dataSource.options as any;
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
      } catch (queryError: any) {
        dbLogger.error(
          'Test query failed',
          queryError?.message ?? 'Unknown error',
        );
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
    const frontendPort = process.env.FRONTEND_PORT || '8080';
    const baseUrl = process.env.BASE_URL || 'http://localhost';

    // Construct frontend URL from base + port (or use explicit FRONTEND_URL if provided)
    const frontendUrl =
      process.env.FRONTEND_URL || `${baseUrl}:${frontendPort}`;

    const allowedOrigins = resolveAllowedOrigins();
    app.use(cookieParser());
    app.use(helmet(buildHelmetOptions(allowedOrigins)));
    app.use((req, res, next) => {
      applyPermissionsPolicy(res);
      next();
    });
    app.enableCors(buildCorsOptions(allowedOrigins));

    const requestContext = app.get(RequestContextService);
    app.useGlobalFilters(new AllExceptionsFilter(requestContext));
    const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
    app.useGlobalInterceptors(
      new RequestContextUserInterceptor(requestContext),
      requestLoggingInterceptor,
    );

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        forbidUnknownValues: true,
        enableDebugMessages: process.env.NODE_ENV !== 'production',
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // API global prefix
    app.setGlobalPrefix('api');

    // Swagger documentation
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

    await app.listen(backendPort);

    const totalStartupTime = Date.now() - startTime;
    logger.log('========================================');
    logger.log('APPLICATION STARTED SUCCESSFULLY');
    logger.log('========================================');
    logger.log(`Server: ${baseUrl}:${backendPort}`);
    logger.log(`API Docs: ${baseUrl}:${backendPort}/api/docs`);
    logger.log(`CORS Allowed Origins: ${allowedOrigins.join(', ')}`);
    logger.log(`Total startup time: ${totalStartupTime}ms`);
    logger.log('========================================');
  } catch (error: any) {
    const failureDuration = Date.now() - startTime;
    dbLogger.error('========================================');
    dbLogger.error('FATAL: Application startup failed');
    dbLogger.error(`Failed after ${failureDuration}ms`);
    dbLogger.error('========================================');
    dbLogger.error(`Error: ${error?.message ?? 'Unknown error'}`);
    dbLogger.error(`Type: ${error?.name ?? 'Unknown'}`);
    if (error?.stack) {
      dbLogger.error('Stack trace:');
      dbLogger.error(error.stack);
    }
    dbLogger.error('========================================');
    process.exit(1);
  }
}
bootstrap();
