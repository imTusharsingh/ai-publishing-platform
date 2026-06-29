jest.unmock('@repo/ai');

import { prisma, discoverTrends, seed } from '../src';

describe('discoverTrends', () => {
  beforeAll(async () => {
    await seed();
  });

  it('inserts trending topics with mock fallback when live fetch unavailable', async () => {
    const runId = `db-test-${Date.now()}`;
    const previous = process.env.TREND_DISCOVERY_PROVIDER;
    process.env.TREND_DISCOVERY_PROVIDER = 'mock';

    try {
      const result = await discoverTrends(prisma, runId);

      expect(result.provider).toBe('mock');
      expect(result.created).toBe(3);

      const topics = await prisma.trendingTopic.findMany({
        where: { normalizedTitle: { contains: runId } },
      });

      expect(topics).toHaveLength(3);
    } finally {
      process.env.TREND_DISCOVERY_PROVIDER = previous;
    }
  });
});
