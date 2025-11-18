import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  @ApiOperation({ summary: 'Health check endpoint for Docker and monitoring' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.buildHealthResponse();
  }

  @Get('healthz')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Kubernetes-style health probe' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealthz() {
    return this.buildHealthResponse();
  }
}
