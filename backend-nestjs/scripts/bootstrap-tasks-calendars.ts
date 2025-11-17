import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserBootstrapService } from '../src/tasks/user-bootstrap.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const bootstrapService = app.get(UserBootstrapService);
    const result = await bootstrapService.bootstrapAllLegacyUsers();
    console.log(
      `Bootstrap finished: ${result.processed} users processed (${result.calendarsCreated} calendars created, ${result.usersUpdated} user records updated).`,
    );
  } catch (error) {
    console.error('Bootstrap failed', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
