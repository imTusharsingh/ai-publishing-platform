import { prisma, seed, checkIdeaDuplicates, logDuplicateRejection } from '../src';
import { buildTopicKey } from '../src/duplicate-engine/normalize-text';

describe('duplicate detection layers 1 and 4', () => {
  beforeAll(async () => {
    await seed();
  });

  it('rejects idea when title matches existing article', async () => {
    const article = await prisma.article.findFirstOrThrow();
    const result = await checkIdeaDuplicates(prisma, {
      title: article.title,
      slugCandidate: `unique-slug-${Date.now()}`,
      intent: 'analysis',
    });

    expect(result.passed).toBe(false);
    expect(result.failedLayer).toBe(1);
  });

  it('rejects idea when canonical topic is in cooldown', async () => {
    const article = await prisma.article.findFirstOrThrow();
    const uniqueTitle = `Cooldown topic test ${Date.now()}`;
    const topicKey = buildTopicKey(uniqueTitle, 'breaking');
    const cooldownUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.canonicalTopic.upsert({
      where: { topicKey },
      create: {
        topicKey,
        intent: 'breaking',
        keywords: ['cooldown'],
        firstCoveredAt: new Date(),
        lastCoveredAt: new Date(),
        cooldownUntil,
        articleId: article.id,
      },
      update: {
        cooldownUntil,
        lastCoveredAt: new Date(),
      },
    });

    const result = await checkIdeaDuplicates(prisma, {
      title: uniqueTitle,
      slugCandidate: `cooldown-${Date.now()}`,
      intent: 'breaking',
    });

    expect(result.passed).toBe(false);
    expect(result.failedLayer).toBe(4);

    const rejection = await prisma.duplicateRejection.findFirst({
      where: { rejectedTitle: uniqueTitle },
      orderBy: { rejectedAt: 'desc' },
    });

    expect(rejection?.layer).toBe(4);
  });

  it('logs duplicate rejections', async () => {
    const before = await prisma.duplicateRejection.count();
    await logDuplicateRejection(prisma, {
      rejectedTitle: `Logged rejection ${Date.now()}`,
      layer: 1,
      reason: 'Test rejection',
    });
    const after = await prisma.duplicateRejection.count();
    expect(after).toBeGreaterThan(before);
  });
});
