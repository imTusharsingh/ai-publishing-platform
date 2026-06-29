import { NotFoundException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
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
    category: {
      findUnique: jest.fn(),
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

  it('updates topic status and records reviewer', async () => {
    prisma.trendingTopic.findUnique.mockResolvedValue({ id: 'topic-1' });
    prisma.trendingTopic.update.mockResolvedValue({
      id: 'topic-1',
      source: 'REDDIT',
      title: 'Topic',
      normalizedTitle: 'topic',
      description: null,
      popularityScore: 10,
      sourceUrl: null,
      sourceMetadata: { provider: 'live' },
      matchedCategoryId: 'cat-1',
      status: TopicStatus.APPROVED,
      discoveredAt: new Date(),
      matchedCategory: { name: 'Tech' },
    });

    const result = await service.updateStatus('topic-1', TopicStatus.APPROVED, 'user-1');

    expect(result.status).toBe(TopicStatus.APPROVED);
    expect(prisma.trendingTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TopicStatus.APPROVED,
          reviewedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('throws when updating missing topic', async () => {
    prisma.trendingTopic.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { title: 'New title' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
