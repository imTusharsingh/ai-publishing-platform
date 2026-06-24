import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { AppModule } from './app.module';
import { JobsService } from './jobs/jobs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
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

  const enableBullBoard = configService.get<string>('ENABLE_BULL_BOARD') === 'true';
  if (enableBullBoard) {
    const jobsService = app.get(JobsService);
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(jobsService.getQueue())],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
    logger.log(`Bull Board available at http://localhost:${port}/admin/queues`);
  }

  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/v1`);
}

bootstrap();
