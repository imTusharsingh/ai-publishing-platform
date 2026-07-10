import * as OpenAiTrend from '../src/openai-trend-discovery';
import { discoverTrendContent } from '../src/discover-trends';

describe('discoverTrendContent auto provider', () => {
  const previousProvider = process.env.TREND_DISCOVERY_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.TREND_DISCOVERY_PROVIDER = previousProvider;
    process.env.OPENAI_API_KEY = previousApiKey;
    jest.restoreAllMocks();
  });

  it('uses OpenAI hybrid discovery when API key is configured', async () => {
    process.env.TREND_DISCOVERY_PROVIDER = 'auto';
    process.env.OPENAI_API_KEY = 'test-key';

    jest.spyOn(OpenAiTrend, 'discoverTopicsWithOpenAI').mockResolvedValue({
      trends: [
        {
          source: 'BLOG_RSS',
          title: 'Fresh AI operations playbook for platform teams',
          description: 'Why internal AI tooling is shifting from pilots to production.',
          popularityScore: 80,
          sourceUrl: 'https://example.com',
          matchedCategoryId: 'cat-ai',
        },
      ],
      provider: 'openai',
      sources: ['openai', 'live-signals'],
      model: 'gpt-4o-mini',
      costUsd: 0.001,
    });

    const result = await discoverTrendContent({
      runId: 'run-1',
      categories: [
        {
          id: 'cat-ai',
          name: 'AI',
          keywords: ['ai'],
          priorityScore: 90,
        },
      ],
      existingTopicTitles: [],
      recentArticleTitles: [],
    });

    expect(result.provider).toBe('openai');
    expect(result.trends).toHaveLength(1);
    expect(OpenAiTrend.discoverTopicsWithOpenAI).toHaveBeenCalled();
  });
});
