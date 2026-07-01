jest.unmock('@repo/ai');

import { ArticleStatus } from '@prisma/client';
import { prisma, seed, runArticleSeoEnrichment } from '../src';

describe('runArticleSeoEnrichment', () => {
  beforeAll(async () => {
    await seed();
    process.env.AI_SEO_PROVIDER = 'mock';
  });

  it('updates article SEO fields and records SEO ai job', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const idea = await prisma.articleIdea.create({
      data: {
        categoryId: category.id,
        title: `SEO test ${Date.now()}`,
        slugCandidate: `seo-test-${Date.now()}`,
        summary: 'SEO enrichment integration test',
        status: 'APPROVED',
      },
    });

    const article = await prisma.article.create({
      data: {
        categoryId: category.id,
        articleIdeaId: idea.id,
        title: idea.title,
        slug: idea.slugCandidate,
        summary: idea.summary,
        contentPlain: 'Article body used for SEO metadata generation in tests.',
        content: '<p>Article body used for SEO metadata generation in tests.</p>',
        status: ArticleStatus.DRAFT,
      },
    });

    const result = await runArticleSeoEnrichment(prisma, article.id);

    expect(result.seoTitle.length).toBeGreaterThan(0);
    expect(result.seoDescription.length).toBeGreaterThan(0);

    const updated = await prisma.article.findUniqueOrThrow({ where: { id: article.id } });
    expect(updated.canonicalUrl).toContain(`/articles/${article.slug}`);
    expect(updated.structuredData).toBeTruthy();

    const seoJob = await prisma.aiJob.findFirst({
      where: { jobType: 'SEO', entityId: article.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(seoJob?.status).toBe('COMPLETED');
  });
});
