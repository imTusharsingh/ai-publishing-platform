import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  const prisma = { isHealthy: jest.fn().mockResolvedValue(true) } as unknown as PrismaService;

  beforeEach(() => {
    service = new HealthService(prisma);
  });

  it('returns ok status when database is healthy', async () => {
    const result = await service.getHealth();
    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('up');
  });

  it('returns degraded when database is down', async () => {
    (prisma.isHealthy as jest.Mock).mockResolvedValueOnce(false);
    const result = await service.getHealth();
    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('down');
  });
});
