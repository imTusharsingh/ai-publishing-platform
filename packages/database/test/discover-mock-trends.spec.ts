import { prisma, discoverMockTrends, seed } from '../src';

describe('discoverMockTrends', () => {
  const runId = `db-test-${Date.now()}`;

  beforeAll(async () => {
    await seed();
  });

  it('inserts mock trending topics', async () => {
    const created = await discoverMockTrends(prisma, runId);

    expect(created).toBe(3);

    const topics = await prisma.trendingTopic.findMany({
      where: { normalizedTitle: { contains: runId } },
    });

    expect(topics).toHaveLength(3);
  });
});
