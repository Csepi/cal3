import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { ParameterizedQueryService } from './common/database/parameterized-query.service';

import { bStatic } from './i18n/runtime';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
    private readonly parameterizedQueryService: ParameterizedQueryService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  private buildHealthResponse() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  @Get('health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.buildHealthResponse();
  }

  @Get('healthz')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Legacy liveness endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealthz() {
    return this.buildHealthResponse();
  }

  @Get('ready')
  @ApiTags('Health')
  @ApiOperation({
    summary: 'Readiness probe endpoint (checks database connectivity)',
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReady() {
    const diagnostics = {
      databaseInitialized: this.dataSource.isInitialized,
      databaseReachable: false,
    };

    if (!this.dataSource.isInitialized) {
      throw new ServiceUnavailableException({
        message: bStatic('errors.auto.backend.kfb82ed5819d9'),
        diagnostics,
      });
    }

    try {
      await this.parameterizedQueryService.query('SELECT 1', [], {
        statementKey: 'ready_probe',
      });
      diagnostics.databaseReachable = true;
    } catch (error) {
      throw new ServiceUnavailableException({
        message: bStatic('errors.auto.backend.kda52953ac116'),
        diagnostics: {
          ...diagnostics,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      diagnostics,
    };
  }
}
