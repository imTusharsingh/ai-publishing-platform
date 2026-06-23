import { Injectable } from '@nestjs/common';
import { APP_NAME, formatApiVersion } from '@repo/shared';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      app: APP_NAME,
      version: formatApiVersion('1'),
      timestamp: new Date().toISOString(),
    };
  }
}
