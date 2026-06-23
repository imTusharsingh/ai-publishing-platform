import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3006',
      'http://localhost:3007',
    ],
    credentials: true,
  });
  const port = process.env.PORT ?? 3008;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/v1`);
}

bootstrap();
