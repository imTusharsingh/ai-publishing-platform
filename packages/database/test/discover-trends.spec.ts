import * as AiModule from '@repo/ai';
import { AiJobType, TopicStatus } from '@prisma/client';
import { discoverTrends } from '../src/discover-trends';

describe('discoverTrends (unit)', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
    },
    aiJob: {
      create: jest.fn(),
      update: jest.fn(),
    },
    trendingTopic: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persists discovered trends and completes ai job', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'AI', keywords: ['ai'], priorityScore: 90 },
    ]);
    prisma.aiJob.create.mockResolvedValue({ id: 'ai-job-1' });
    jest.spyOn(AiModule, 'discoverTrendContent').mockResolvedValue({
      provider: 'live',
      sources: ['hackernews'],
      trends: [
        {
          source: 'BLOG_RSS',
          title: 'Live trend headline',
          description: 'Description',
          popularityScore: 80,
          sourceUrl: 'https://example.com',
          matchedCategoryId: 'cat-1',
        },
      ],
    });
    prisma.trendingTopic.create.mockResolvedValue({});
    prisma.aiJob.update.mockResolvedValue({});

    const result = await discoverTrends(prisma as never, 'run-1');

    expect(result).toMatchObject({
      created: 1,
      runId: 'run-1',
      provider: 'live',
      aiJobId: 'ai-job-1',
    });
    expect(prisma.aiJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobType: AiJobType.TREND_DISCOVERY }),
      }),
    );
    expect(prisma.trendingTopic.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TopicStatus.DISCOVERED }),
      }),
    );
  });
});
