import { randomUUID } from 'node:crypto';
import { AiJobStatus, AiJobType, Prisma, PrismaClient, TopicStatus } from '@prisma/client';
import { discoverTrendContent } from '@repo/ai';
import { normalizeTopicTitle } from '@repo/shared';

export interface DiscoverTrendsResult {
  created: number;
  runId: string;
  provider: string;
  aiJobId: string;
  sources: string[];
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
    const discovery = await discoverTrendContent({
      runId,
      categories,
    });

    let created = 0;

    for (const trend of discovery.trends) {
      const normalizedTitle = normalizeTopicTitle(trend.title);
      const existing = await prisma.trendingTopic.findFirst({
        where: { normalizedTitle },
      });

      if (existing) {
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
          sourceMetadata: {
            provider: discovery.provider,
            runId,
            sources: discovery.sources,
          },
        },
      });

      created += 1;
    }

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: discovery.provider,
        model: discovery.provider === 'live' ? 'live-fetch-v1' : 'mock-trend-v1',
        completedAt: new Date(),
        outputSnapshot: {
          created,
          runId,
          sources: discovery.sources,
          provider: discovery.provider,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      created,
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
