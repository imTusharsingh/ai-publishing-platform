import { fetchLiveTrendCandidates } from './fetch-live-trends';
import { applyCategoryMatching, discoverTrendsWithMock } from './mock-trend-discovery';
import { getTrendDiscoveryMaxTopics, resolveTrendDiscoveryProvider } from './trend-provider';
import type { TrendDiscoveryInput, TrendDiscoveryResult } from './types';

export async function discoverTrendContent(
  input: TrendDiscoveryInput,
): Promise<TrendDiscoveryResult> {
  const provider = resolveTrendDiscoveryProvider();
  const maxTopics = getTrendDiscoveryMaxTopics();

  if (provider === 'mock') {
    return discoverTrendsWithMock(input);
  }

  const live = await fetchLiveTrendCandidates(input.categories, maxTopics);

  if (provider === 'live' && live.trends.length === 0) {
    throw new Error('Live trend discovery returned no results');
  }

  if (live.trends.length > 0) {
    return {
      trends: applyCategoryMatching(live.trends, input.categories),
      provider: 'live',
      sources: live.sources,
    };
  }

  return discoverTrendsWithMock(input);
}
