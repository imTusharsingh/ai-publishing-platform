import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleIdeaStatus, TopicStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleIdeasService } from './article-ideas.service';

describe('ArticleIdeasService', () => {
  let service: ArticleIdeasService;

  const prisma = {
    articleIdea: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    trendingTopic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleIdeasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ArticleIdeasService);
  });

  it('lists article ideas with pagination meta', async () => {
    prisma.articleIdea.findMany.mockResolvedValue([
      {
        id: 'idea-1',
        categoryId: 'cat-1',
        trendingTopicId: null,
        title: 'Test idea',
        slugCandidate: 'test-idea',
        summary: 'Summary',
        outline: null,
        intent: null,
        status: ArticleIdeaStatus.DRAFT,
        createdAt: new Date('2026-06-20T10:00:00.000Z'),
        category: { name: 'Tech' },
        trendingTopic: null,
      },
    ]);
    prisma.articleIdea.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta).toEqual({ total: 1, page: 1, limit: 20 });
    expect(result.data[0]).toMatchObject({
      title: 'Test idea',
      categoryName: 'Tech',
      status: ArticleIdeaStatus.DRAFT,
    });
  });

  it('creates idea from topic with mock outline', async () => {
    prisma.trendingTopic.findUnique.mockResolvedValue({
      id: 'topic-1',
      title: 'AI chips surge',
      description: 'Semiconductor demand rises',
      matchedCategoryId: 'cat-1',
      status: TopicStatus.DISCOVERED,
      matchedCategory: { id: 'cat-1', name: 'Tech' },
    });
    prisma.articleIdea.findUnique.mockResolvedValue(null);
    prisma.articleIdea.create.mockResolvedValue({
      id: 'idea-2',
      categoryId: 'cat-1',
      trendingTopicId: 'topic-1',
      title: 'How AI chips surge is reshaping the industry',
      slugCandidate: 'how-ai-chips-surge-is-reshaping-the-industry',
      summary: 'Semiconductor demand rises',
      outline: [
        { heading: 'Introduction', points: ['Context for AI chips surge', 'Why this matters now'] },
        {
          heading: 'Key developments',
          points: ['Recent signals and data points', 'Stakeholder reactions'],
        },
        { heading: 'Implications', points: ['Short-term impact', 'What to watch next'] },
      ],
      intent: 'analysis',
      status: ArticleIdeaStatus.DRAFT,
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      category: { name: 'Tech' },
      trendingTopic: { title: 'AI chips surge' },
    });
    prisma.trendingTopic.update.mockResolvedValue({});

    const result = await service.createFromTopic('topic-1');

    expect(result.trendingTopicTitle).toBe('AI chips surge');
    expect(result.outline).toHaveLength(3);
    expect(prisma.trendingTopic.update).toHaveBeenCalledWith({
      where: { id: 'topic-1' },
      data: { status: TopicStatus.USED },
    });
  });

  it('rejects topic without matched category', async () => {
    prisma.trendingTopic.findUnique.mockResolvedValue({
      id: 'topic-1',
      title: 'Unmatched topic',
      description: null,
      matchedCategoryId: null,
      status: TopicStatus.DISCOVERED,
      matchedCategory: null,
    });

    await expect(service.createFromTopic('topic-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when idea not found', async () => {
    prisma.articleIdea.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
