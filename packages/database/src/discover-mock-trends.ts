import { PrismaClient, TopicStatus } from '@prisma/client';
import { MOCK_TREND_BATCH, normalizeTopicTitle } from '@repo/shared';

export async function discoverMockTrends(prisma: PrismaClient, runId: string): Promise<number> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { priorityScore: 'desc' },
    take: MOCK_TREND_BATCH.length,
  });

  let created = 0;

  for (const [index, trend] of MOCK_TREND_BATCH.entries()) {
    const title = `${trend.title} (${runId}-${index + 1})`;
    const normalizedTitle = normalizeTopicTitle(title);

    const existing = await prisma.trendingTopic.findFirst({
      where: { normalizedTitle },
    });

    if (existing) {
      continue;
    }

    await prisma.trendingTopic.create({
      data: {
        source: trend.source,
        title,
        normalizedTitle,
        description: trend.description,
        popularityScore: trend.popularityScore,
        sourceUrl: trend.sourceUrl,
        matchedCategoryId: categories[index]?.id,
        status: TopicStatus.DISCOVERED,
        sourceMetadata: { provider: 'mock', runId },
      },
    });

    created += 1;
  }

  return created;
}
