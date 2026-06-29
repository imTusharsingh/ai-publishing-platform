import { fetchHackerNewsTrends } from '../src/fetch-live-trends';

describe('fetchHackerNewsTrends', () => {
  it('maps algolia hits to trend candidates', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: [
          {
            title: 'AI infrastructure funding',
            url: 'https://example.com/story',
            points: 120,
            num_comments: 45,
            objectID: '123',
          },
        ],
      }),
    }) as never;

    const trends = await fetchHackerNewsTrends(['ai', 'startups'], 5);

    expect(trends).toHaveLength(1);
    expect(trends[0]).toMatchObject({
      source: 'BLOG_RSS',
      title: 'AI infrastructure funding',
      popularityScore: 100,
    });
  });
});
