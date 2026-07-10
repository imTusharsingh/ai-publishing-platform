import {
  ArticleIdeaStatus,
  ArticleStatus,
  PrismaClient,
  PublishFrequency,
  TopicStatus,
} from '@prisma/client';
import { discoverTrends } from '../discover-trends';
import { generateArticle } from '../generate-article';
import { generateArticleIdeaFromTopic } from '../generate-idea-from-topic';
import { autoPublishArticle } from './auto-publish-article';

export interface DailyPipelineResult {
  runId: string;
  topicsDiscovered: number;
  ideasGenerated: number;
  articlesWritten: number;
  articlesPublished: number;
  failures: string[];
}

function cycleWindowStart(frequency: PublishFrequency, now: Date): Date {
  const start = new Date(now);

  if (frequency === PublishFrequency.WEEKLY) {
    start.setDate(start.getDate() - 7);
    return start;
  }

  if (frequency === PublishFrequency.TWICE_DAILY) {
    start.setHours(start.getHours() - 12);
    return start;
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

async function countPublishedInWindow(
  prisma: PrismaClient,
  categoryId: string,
  since: Date,
): Promise<number> {
  return prisma.article.count({
    where: {
      categoryId,
      status: ArticleStatus.PUBLISHED,
      publishedAt: { gte: since },
    },
  });
}

async function findTopicForCategory(prisma: PrismaClient, categoryId: string) {
  const approved = await prisma.trendingTopic.findFirst({
    where: {
      matchedCategoryId: categoryId,
      status: TopicStatus.APPROVED,
      articleIdeas: { none: {} },
    },
    orderBy: { discoveredAt: 'desc' },
  });

  if (approved) {
    return approved;
  }

  return prisma.trendingTopic.findFirst({
    where: {
      matchedCategoryId: categoryId,
      status: { in: [TopicStatus.SUGGESTED, TopicStatus.DISCOVERED] },
      articleIdeas: { none: {} },
    },
    orderBy: { discoveredAt: 'desc' },
  });
}

export async function runDailyPublishingPipeline(
  prisma: PrismaClient,
  runId = `daily-${Date.now()}`,
): Promise<DailyPipelineResult> {
  const failures: string[] = [];
  const now = new Date();

  let topicsDiscovered = 0;
  let ideasGenerated = 0;
  let articlesWritten = 0;
  let articlesPublished = 0;

  const discovery = await discoverTrends(prisma, runId);
  topicsDiscovered = discovery.created;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { priorityScore: 'desc' },
  });

  for (const category of categories) {
    const windowStart = cycleWindowStart(category.publishFrequency, now);
    const publishedCount = await countPublishedInWindow(prisma, category.id, windowStart);
    const needed = Math.max(0, category.articlesPerCycle - publishedCount);

    for (let i = 0; i < needed; i++) {
      const topic = await findTopicForCategory(prisma, category.id);
      if (!topic) {
        failures.push(`No eligible topic for category "${category.name}"`);
        break;
      }

      try {
        const ideaResult = await generateArticleIdeaFromTopic(prisma, topic.id);
        ideasGenerated += 1;

        await prisma.articleIdea.update({
          where: { id: ideaResult.ideaId },
          data: { status: ArticleIdeaStatus.APPROVED },
        });

        const articleResult = await generateArticle(prisma, ideaResult.ideaId);
        articlesWritten += 1;

        const publishResult = await autoPublishArticle(prisma, articleResult.articleId, {
          scheduledAt: now,
        });

        if (publishResult.published) {
          articlesPublished += 1;
        } else if (publishResult.errorMessage) {
          failures.push(publishResult.errorMessage);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Pipeline step failed for category';
        failures.push(`${category.name}: ${message}`);
      }
    }
  }

  return {
    runId,
    topicsDiscovered,
    ideasGenerated,
    articlesWritten,
    articlesPublished,
    failures,
  };
}
