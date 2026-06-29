import { discoverTrendsWithMock } from '../src/mock-trend-discovery';

describe('discoverTrendsWithMock', () => {
  it('returns mock trends with run id suffix', () => {
    const result = discoverTrendsWithMock({
      runId: 'run-1',
      categories: [
        {
          id: 'cat-1',
          name: 'AI',
          keywords: ['ai'],
          priorityScore: 90,
        },
      ],
    });

    expect(result.provider).toBe('mock');
    expect(result.trends[0]?.title).toContain('run-1');
    expect(result.trends[0]?.matchedCategoryId).toBe('cat-1');
  });
});
