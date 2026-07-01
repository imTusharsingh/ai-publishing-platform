jest.unmock('@repo/ai');

import { ArticleIdeaStatus, ArticleStatus, TopicStatus, TrendSource } from '@prisma/client';
import {
  autoPublishArticle,
  generateArticle,
  prisma,
  runDailyPublishingPipeline,
  seed,
  updateDuplicateSettings,
} from '../src';

describe('automated publishing pipeline', () => {
  beforeAll(async () => {
    await seed();
    process.env.AI_PLANNING_PROVIDER = 'mock';
    process.env.AI_WRITING_PROVIDER = 'mock';
    process.env.AI_QUALITY_PROVIDER = 'mock';
    process.env.AI_SEO_PROVIDER = 'mock';
    process.env.AI_EMBEDDING_PROVIDER = 'mock';

    await updateDuplicateSettings(prisma, {
      titleThreshold: 0.999,
      summaryThreshold: 0.999,
      contentThreshold: 0.999,
      topicCooldownDays: 1,
      clusterDistanceThreshold: 0.01,
    });
  });

  it('auto-publishes a draft article and records publishing job', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const category = await prisma.category.findFirstOrThrow();
    const idea = await prisma.articleIdea.create({
      data: {
        categoryId: category.id,
        title: `Publish test ${unique}`,
        slugCandidate: `publish-test-${unique}`,
        summary: `Automated publishing integration test summary ${unique}.`,
        intent: `publish-intent-${unique}`,
        status: ArticleIdeaStatus.APPROVED,
      },
    });

    await prisma.articleIdea.update({
      where: { id: idea.id },
      data: { status: ArticleIdeaStatus.GENERATING },
    });

    const articleResult = await generateArticle(prisma, idea.id);
    const publishResult = await autoPublishArticle(prisma, articleResult.articleId);

    if (!publishResult.published) {
      throw new Error(publishResult.errorMessage ?? 'publish failed');
    }

    const article = await prisma.article.findUniqueOrThrow({
      where: { id: articleResult.articleId },
    });
    expect(article.status).toBe(ArticleStatus.PUBLISHED);
    expect(article.publishedAt).not.toBeNull();

    const job = await prisma.publishingJob.findUniqueOrThrow({
      where: { id: publishResult.publishingJobId },
    });
    expect(job.status).toBe('PUBLISHED');
  }, 60_000);

  it('runs daily pipeline end-to-end with mocked AI', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const category = await prisma.category.findFirstOrThrow();

    await prisma.category.updateMany({
      where: { id: { not: category.id } },
      data: { isActive: false },
    });

    await prisma.category.update({
      where: { id: category.id },
      data: { articlesPerCycle: 10, isActive: true },
    });

    await prisma.trendingTopic.create({
      data: {
        source: TrendSource.NEWS_API,
        title: `Pipeline topic ${unique}`,
        normalizedTitle: `pipeline-topic-${unique}`,
        description: `Topic for automated publishing pipeline test ${unique}`,
        matchedCategoryId: category.id,
        status: TopicStatus.APPROVED,
        popularityScore: 90,
      },
    });

    const result = await runDailyPublishingPipeline(prisma, `test-run-${unique}`);

    await prisma.category.updateMany({
      where: { id: { not: category.id } },
      data: { isActive: true },
    });

    expect(result.ideasGenerated).toBeGreaterThanOrEqual(1);
    expect(result.articlesWritten).toBeGreaterThanOrEqual(1);
    expect(result.articlesPublished).toBeGreaterThanOrEqual(1);
  }, 120_000);
});
