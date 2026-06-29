import { MOCK_TREND_BATCH } from '@repo/shared';
import type {
  DiscoveredTrendCandidate,
  TrendDiscoveryCategoryInput,
  TrendDiscoveryInput,
  TrendDiscoveryResult,
} from './types';
import { matchTrendToCategory } from './match-trend-category';

export function discoverTrendsWithMock(input: TrendDiscoveryInput): TrendDiscoveryResult {
  const categories = input.categories.slice().sort((a, b) => b.priorityScore - a.priorityScore);
  const trends: DiscoveredTrendCandidate[] = [];

  for (let index = 0; index < MOCK_TREND_BATCH.length; index += 1) {
    const trend = MOCK_TREND_BATCH[index];
    const title = `${trend.title} (${input.runId}-${index + 1})`;
    const category = categories[index] ?? categories[0] ?? null;

    trends.push({
      source: trend.source,
      title,
      description: trend.description,
      popularityScore: trend.popularityScore,
      sourceUrl: trend.sourceUrl,
      matchedCategoryId: category?.id ?? null,
    });
  }

  return {
    trends,
    provider: 'mock',
    sources: ['mock'],
  };
}

export function applyCategoryMatching(
  trends: Omit<DiscoveredTrendCandidate, 'matchedCategoryId'>[],
  categories: TrendDiscoveryCategoryInput[],
): DiscoveredTrendCandidate[] {
  return trends.map((trend) => ({
    ...trend,
    matchedCategoryId: matchTrendToCategory(trend.title, trend.description, categories),
  }));
}
