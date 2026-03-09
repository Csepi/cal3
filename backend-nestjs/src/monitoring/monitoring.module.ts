import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { OpenTelemetryService } from './opentelemetry.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  controllers: [MonitoringController],
  providers: [MetricsService, MetricsInterceptor, OpenTelemetryService],
  exports: [MetricsService, MetricsInterceptor, OpenTelemetryService],
})
export class MonitoringModule {}
