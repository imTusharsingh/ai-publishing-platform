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
    discoverMockTrends: jest.fn(),
  };
});

const { discoverMockTrends } = jest.requireMock('@repo/database');

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
      providers: [
        TopicsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TopicsService);
  });

  it('discovers mock trends via shared helper', async () => {
    discoverMockTrends.mockResolvedValue(3);

    const created = await service.discoverMockTrends('test-run');

    expect(created).toBe(3);
    expect(discoverMockTrends).toHaveBeenCalledWith(prisma, 'test-run');
  });
});
