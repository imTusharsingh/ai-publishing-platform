import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  it('returns ok status', () => {
    const result = service.getHealth();
    expect(result.status).toBe('ok');
    expect(result.app).toBe('AI Publishing Platform');
    expect(result.version).toBe('v1');
    expect(result.timestamp).toBeDefined();
  });
});
