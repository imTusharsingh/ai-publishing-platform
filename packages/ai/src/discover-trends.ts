import { fetchLiveTrendCandidates } from './fetch-live-trends';
import { discoverTopicsWithOpenAI } from './openai-trend-discovery';
import { applyCategoryMatching, discoverTrendsWithMock } from './mock-trend-discovery';
import {
  getTrendDiscoveryMaxTopics,
  isOpenAiTrendDiscoveryAvailable,
  resolveTrendDiscoveryProvider,
} from './trend-provider';
import type { TrendDiscoveryInput, TrendDiscoveryResult, TrendDiscoverySignalInput } from './types';

function toSignals(
  trends: Array<{
    source: string;
    title: string;
    description: string;
    sourceUrl: string;
  }>,
): TrendDiscoverySignalInput[] {
  return trends.map((trend) => ({
    source: trend.source,
    title: trend.title,
    description: trend.description,
    sourceUrl: trend.sourceUrl,
  }));
}

async function discoverWithOpenAiHybrid(
  input: TrendDiscoveryInput,
  maxTopics: number,
  includeLiveSignals: boolean,
): Promise<TrendDiscoveryResult> {
  let signals: TrendDiscoverySignalInput[] = [];

  if (includeLiveSignals) {
    const live = await fetchLiveTrendCandidates(input.categories, maxTopics);
    signals = toSignals(live.trends);
  }

  const result = await discoverTopicsWithOpenAI({
    ...input,
    maxTopics,
    signals,
  });

  return {
    trends: result.trends,
    provider: result.provider,
    sources: result.sources,
  };
}

export async function discoverTrendContent(
  input: TrendDiscoveryInput,
): Promise<TrendDiscoveryResult> {
  const provider = resolveTrendDiscoveryProvider();
  const maxTopics = getTrendDiscoveryMaxTopics();

  if (provider === 'mock') {
    return discoverTrendsWithMock(input);
  }

  if (provider === 'openai') {
    if (!isOpenAiTrendDiscoveryAvailable()) {
      throw new Error('TREND_DISCOVERY_PROVIDER=openai requires OPENAI_API_KEY');
    }

    return discoverWithOpenAiHybrid(input, maxTopics, true);
  }

  const live = await fetchLiveTrendCandidates(input.categories, maxTopics);

  if (provider === 'live') {
    if (live.trends.length === 0) {
      throw new Error('Live trend discovery returned no results');
    }

    return {
      trends: applyCategoryMatching(live.trends, input.categories),
      provider: 'live',
      sources: live.sources,
    };
  }

  // auto: prefer OpenAI-synthesized unique angles when configured
  if (isOpenAiTrendDiscoveryAvailable()) {
    return discoverWithOpenAiHybrid(input, maxTopics, true);
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
