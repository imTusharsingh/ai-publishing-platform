import { ArticleStatus } from '@prisma/client';
import { prisma, searchArticles, seed } from '../src';

describe('searchArticles', () => {
  beforeAll(async () => {
    await seed();
  });

  it('returns ranked matches for published articles', async () => {
    const unique = `searchable-term-${Date.now()}`;
    const category = await prisma.category.findFirstOrThrow();
    const idea = await prisma.articleIdea.create({
      data: {
        categoryId: category.id,
        title: `Article about ${unique}`,
        slugCandidate: `search-${unique}`,
        summary: `Summary containing ${unique} for full-text search tests.`,
        status: 'APPROVED',
      },
    });

    await prisma.article.create({
      data: {
        categoryId: category.id,
        articleIdeaId: idea.id,
        title: idea.title,
        slug: idea.slugCandidate,
        summary: idea.summary,
        contentPlain: `Body text with ${unique} embedded for indexing.`,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    const result = await searchArticles(prisma, { query: unique, limit: 5 });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0]?.title).toContain(unique);
    expect(result.meta.total).toBeGreaterThanOrEqual(1);
  });
});
