import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Smart port and URL configuration
  const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
  const frontendPort = process.env.FRONTEND_PORT || '8080';
  const baseUrl = process.env.BASE_URL || 'http://localhost';

  // Construct frontend URL from base + port (or use explicit FRONTEND_URL if provided)
  const frontendUrl = process.env.FRONTEND_URL || `${baseUrl}:${frontendPort}`;

  // Enable CORS
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // API global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Calendar Sharing API')
    .setDescription('A comprehensive calendar sharing application with multi-user support')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(backendPort);
  console.log(`🚀 Application is running on: ${baseUrl}:${backendPort}`);
  console.log(`📚 API Documentation: ${baseUrl}:${backendPort}/api/docs`);
  console.log(`🔗 CORS enabled for: ${frontendUrl}`);
}
bootstrap();
