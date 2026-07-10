import { discoverTopicsWithOpenAI } from '../src/openai-trend-discovery';

describe('discoverTopicsWithOpenAI', () => {
  const categories = [
    {
      id: 'cat-ai',
      name: 'AI',
      keywords: ['ai', 'llm'],
      priorityScore: 90,
    },
  ];

  it('returns unique topics and filters duplicates against existing titles', async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    topics: [
                      {
                        title: 'How enterprise teams are operationalizing generative AI workflows',
                        description: 'An explainer on internal tooling patterns gaining adoption.',
                        categoryId: 'cat-ai',
                        popularityScore: 82,
                        sourceUrl: null,
                      },
                      {
                        title: 'How enterprise teams are operationalizing generative AI workflows',
                        description: 'Duplicate title from model.',
                        categoryId: 'cat-ai',
                        popularityScore: 70,
                        sourceUrl: null,
                      },
                    ],
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 80 },
          }),
        },
      },
    };

    const result = await discoverTopicsWithOpenAI(
      {
        runId: 'run-1',
        categories,
        maxTopics: 5,
        existingTopicTitles: ['Seed Funding Rebounds as AI Infrastructure Startups Lead Q2'],
        recentArticleTitles: [],
        signals: [],
      },
      client as never,
    );

    expect(result.provider).toBe('openai');
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0]?.matchedCategoryId).toBe('cat-ai');
  });
});
