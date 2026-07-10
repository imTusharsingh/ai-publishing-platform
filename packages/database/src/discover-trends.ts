import { randomUUID } from 'node:crypto';
import { AiJobStatus, AiJobType, Prisma, PrismaClient, TopicStatus } from '@prisma/client';
import { discoverTrendContent } from '@repo/ai';
import { normalizeTopicTitle } from '@repo/shared';
import { resolveTrendDiscoveryPrompts } from './prompt-templates';

export interface DiscoverTrendsResult {
  created: number;
  updated: number;
  skipped: number;
  fetched: number;
  runId: string;
  provider: string;
  aiJobId: string;
  sources: string[];
}

function canRefreshExistingTopic(status: TopicStatus): boolean {
  return (
    status === TopicStatus.DISCOVERED ||
    status === TopicStatus.SUGGESTED ||
    status === TopicStatus.APPROVED ||
    status === TopicStatus.EXPIRED
  );
}

export async function discoverTrends(
  prisma: PrismaClient,
  runId: string,
): Promise<DiscoverTrendsResult> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { priorityScore: 'desc' },
    select: {
      id: true,
      name: true,
      keywords: true,
      priorityScore: true,
    },
  });

  const [existingTopics, recentArticles] = await Promise.all([
    prisma.trendingTopic.findMany({
      select: { title: true },
      orderBy: { discoveredAt: 'desc' },
      take: 80,
    }),
    prisma.article.findMany({
      select: { title: true },
      orderBy: { publishedAt: 'desc' },
      take: 40,
    }),
  ]);

  const runEntityId = randomUUID();

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.TREND_DISCOVERY,
      entityType: 'trend_discovery_run',
      entityId: runEntityId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        runId,
        categoryCount: categories.length,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const prompts = await resolveTrendDiscoveryPrompts(prisma);

    const discovery = await discoverTrendContent({
      runId,
      categories,
      existingTopicTitles: existingTopics.map((topic) => topic.title),
      recentArticleTitles: recentArticles.map((article) => article.title),
      prompts,
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const metadata = {
      provider: discovery.provider,
      runId,
      sources: discovery.sources,
    };

    for (const trend of discovery.trends) {
      const normalizedTitle = normalizeTopicTitle(trend.title);
      const existing = await prisma.trendingTopic.findFirst({
        where: { normalizedTitle },
      });

      if (existing) {
        if (!canRefreshExistingTopic(existing.status)) {
          skipped += 1;
          continue;
        }

        await prisma.trendingTopic.update({
          where: { id: existing.id },
          data: {
            source: trend.source,
            description: trend.description,
            popularityScore: trend.popularityScore,
            sourceUrl: trend.sourceUrl,
            discoveredAt: new Date(),
            sourceMetadata: metadata,
            ...(trend.matchedCategoryId && !existing.matchedCategoryId
              ? { matchedCategoryId: trend.matchedCategoryId }
              : {}),
          },
        });

        updated += 1;
        continue;
      }

      await prisma.trendingTopic.create({
        data: {
          source: trend.source,
          title: trend.title,
          normalizedTitle,
          description: trend.description,
          popularityScore: trend.popularityScore,
          sourceUrl: trend.sourceUrl,
          matchedCategoryId: trend.matchedCategoryId,
          status: TopicStatus.DISCOVERED,
          sourceMetadata: metadata,
        },
      });

      created += 1;
    }

    const fetched = discovery.trends.length;

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: discovery.provider,
        model:
          discovery.provider === 'live'
            ? 'live-fetch-v1'
            : discovery.provider === 'openai'
              ? 'openai-trend-v1'
              : 'mock-trend-v1',
        completedAt: new Date(),
        outputSnapshot: {
          created,
          updated,
          skipped,
          fetched,
          runId,
          sources: discovery.sources,
          provider: discovery.provider,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      created,
      updated,
      skipped,
      fetched,
      runId,
      provider: discovery.provider,
      aiJobId: aiJob.id,
      sources: discovery.sources,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Trend discovery failed';

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: message,
      },
    });

    throw error;
  }
}

/** @deprecated Use discoverTrends */
export async function discoverMockTrends(prisma: PrismaClient, runId: string): Promise<number> {
  const result = await discoverTrends(prisma, runId);
  return result.created;
}
