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
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    article: {
      findMany: jest.fn().mockResolvedValue([]),
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
      updated: 0,
      skipped: 0,
      fetched: 1,
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

  it('refreshes existing queue topics instead of skipping them', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'AI', keywords: ['ai'], priorityScore: 90 },
    ]);
    prisma.aiJob.create.mockResolvedValue({ id: 'ai-job-2' });
    prisma.trendingTopic.findFirst.mockResolvedValue({
      id: 'topic-1',
      status: TopicStatus.DISCOVERED,
      matchedCategoryId: 'cat-1',
    });
    jest.spyOn(AiModule, 'discoverTrendContent').mockResolvedValue({
      provider: 'live',
      sources: ['hackernews'],
      trends: [
        {
          source: 'BLOG_RSS',
          title: 'Live trend headline',
          description: 'Updated description',
          popularityScore: 95,
          sourceUrl: 'https://example.com/updated',
          matchedCategoryId: 'cat-1',
        },
      ],
    });
    prisma.trendingTopic.update.mockResolvedValue({});
    prisma.aiJob.update.mockResolvedValue({});

    const result = await discoverTrends(prisma as never, 'run-2');

    expect(result).toMatchObject({
      created: 0,
      updated: 1,
      skipped: 0,
      fetched: 1,
    });
    expect(prisma.trendingTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({
          popularityScore: 95,
          description: 'Updated description',
        }),
      }),
    );
    expect(prisma.trendingTopic.create).not.toHaveBeenCalled();
  });
});
