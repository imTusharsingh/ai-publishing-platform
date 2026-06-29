import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('@repo/queue', () => ({
  JOB_NAMES: { TREND_DISCOVERY: 'trend-discovery' },
  getDefaultQueue: jest.fn(),
}));

jest.mock('@repo/database', () => {
  const actual = jest.requireActual('@repo/database');
  return {
    ...actual,
    discoverTrends: jest.fn(),
  };
});

const { discoverTrends } = jest.requireMock('@repo/database');

describe('TopicsService', () => {
  let service: TopicsService;
  const prisma = {
    trendingTopic: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TopicsService);
  });

  it('runs trend discovery via shared helper', async () => {
    discoverTrends.mockResolvedValue({
      created: 3,
      runId: 'test-run',
      provider: 'live',
      aiJobId: 'ai-job-1',
      sources: ['hackernews', 'reddit'],
    });

    const result = await service.runDiscovery('test-run');

    expect(result.created).toBe(3);
    expect(discoverTrends).toHaveBeenCalledWith(prisma, 'test-run');
  });
});
