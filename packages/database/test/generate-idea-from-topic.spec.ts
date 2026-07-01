jest.mock('@repo/ai', () => ({
  generateIdeaContent: jest.fn(),
}));

import { AiJobStatus, AiJobType, ArticleIdeaStatus, TopicStatus } from '@prisma/client';
import { generateIdeaContent } from '@repo/ai';
import { generateArticleIdeaFromTopic } from '../src/generate-idea-from-topic';

describe('generateArticleIdeaFromTopic', () => {
  const prisma = {
    trendingTopic: {
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    article: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    aiJob: {
      create: jest.fn(),
      update: jest.fn(),
    },
    articleIdea: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    canonicalTopic: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    duplicateRejection: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates idea and completes planning ai job', async () => {
    prisma.trendingTopic.findUnique.mockResolvedValue({
      id: 'topic-1',
      title: 'AI chips surge',
      description: 'Semiconductor demand rises',
      matchedCategoryId: 'cat-1',
      status: TopicStatus.DISCOVERED,
      matchedCategory: { id: 'cat-1', name: 'Tech' },
    });
    prisma.aiJob.create.mockResolvedValue({ id: 'ai-job-1' });
    (generateIdeaContent as jest.Mock).mockResolvedValue({
      title: 'AI chips reshape semiconductors',
      summary: 'Brief for readers',
      intent: 'analysis',
      outline: [{ heading: 'Overview', points: ['Point A'] }],
      provider: 'mock',
      model: 'mock-idea-v2-medium',
      promptTokens: null,
      completionTokens: null,
      costUsd: null,
    });
    prisma.articleIdea.create.mockResolvedValue({ id: 'idea-1' });
    prisma.trendingTopic.update.mockResolvedValue({});
    prisma.aiJob.update.mockResolvedValue({});

    const result = await generateArticleIdeaFromTopic(prisma as never, 'topic-1');

    expect(result).toEqual({ ideaId: 'idea-1', aiJobId: 'ai-job-1', provider: 'mock' });
    expect(prisma.trendingTopic.findFirst).not.toHaveBeenCalled();
    expect(prisma.aiJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobType: AiJobType.PLANNING }),
      }),
    );
    expect(prisma.aiJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ai-job-1' },
        data: expect.objectContaining({ status: AiJobStatus.COMPLETED }),
      }),
    );
    expect(prisma.articleIdea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ArticleIdeaStatus.DRAFT }),
      }),
    );
  });
});
