import { NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: {
    category: { findUnique: jest.Mock };
    article: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  };

  const article = {
    id: 'art-1',
    title: 'Sample Article',
    slug: 'sample-article',
    summary: 'Summary',
    publishedAt: new Date('2026-06-20T10:00:00.000Z'),
    authorName: 'AI Writer',
    featuredImageUrl: null,
    category: { id: 'cat-1', name: 'Startups', slug: 'startups' },
  };

  beforeEach(() => {
    prisma = {
      category: { findUnique: jest.fn() },
      article: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    };
    service = new ArticlesService(prisma as unknown as PrismaService);
  });

  it('returns paginated published articles', async () => {
    prisma.article.findMany.mockResolvedValue([article]);
    prisma.article.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 12, sort: 'publishedAt' });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: ArticleStatus.PUBLISHED }),
      }),
    );
  });

  it('filters by category slug', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
    prisma.article.findMany.mockResolvedValue([article]);
    prisma.article.count.mockResolvedValue(1);

    await service.findAll({ category: 'startups', page: 1, limit: 12, sort: 'publishedAt' });

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-1' }),
      }),
    );
  });

  it('throws when category slug is unknown', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(
      service.findAll({ category: 'missing', page: 1, limit: 12, sort: 'publishedAt' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns article detail by slug', async () => {
    prisma.article.findFirst.mockResolvedValue({
      ...article,
      content: 'Full article body',
      viewCount: BigInt(42),
      seoTitle: 'SEO Title',
      seoDescription: 'SEO Description',
      canonicalUrl: null,
      ogImageUrl: null,
      structuredData: null,
      relatedFrom: [],
    });

    const result = await service.findBySlug('sample-article');

    expect(result.slug).toBe('sample-article');
    expect(result.content).toBe('Full article body');
    expect(result.viewCount).toBe('42');
    expect(result.seo.title).toBe('SEO Title');
  });

  it('throws when article slug is unknown', async () => {
    prisma.article.findFirst.mockResolvedValue(null);

    await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
  });
});
