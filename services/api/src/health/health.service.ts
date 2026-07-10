import { Injectable } from '@nestjs/common';
import { PUBLIC_APP_NAME, formatApiVersion } from '@repo/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const dbHealthy = await this.prisma.isHealthy();

    return {
      status: dbHealthy ? 'ok' : 'degraded',
      app: PUBLIC_APP_NAME,
      version: formatApiVersion('1'),
      timestamp: new Date().toISOString(),
      checks: { database: dbHealthy ? 'up' : 'down' },
    };
  }
}
