jest.unmock('@repo/ai');

import { ArticleIdeaStatus } from '@prisma/client';
import { prisma, seed, runArticleQualityGate } from '../src';

describe('runArticleQualityGate', () => {
  beforeAll(async () => {
    await seed();
    process.env.AI_WRITER_PROVIDER = 'mock';
    process.env.AI_QUALITY_PROVIDER = 'mock';
  });

  it('creates QUALITY ai job and fails short drafts', async () => {
    const idea = await prisma.articleIdea.findFirstOrThrow();

    await expect(
      runArticleQualityGate(prisma, {
        articleIdeaId: idea.id,
        title: idea.title,
        summary: idea.summary,
        contentPlain: 'Too short.',
      }),
    ).rejects.toThrow();

    const qualityJob = await prisma.aiJob.findFirst({
      where: { jobType: 'QUALITY', entityId: idea.id },
      orderBy: { createdAt: 'desc' },
    });

    expect(qualityJob?.status).toBe('FAILED');
  });

  it('passes sufficiently long drafts', async () => {
    const idea = await prisma.articleIdea.findFirst({
      where: { status: ArticleIdeaStatus.DRAFT },
    });

    if (!idea) {
      return;
    }

    const contentPlain = [
      Array.from(
        { length: 3100 },
        (_, index) => `Sentence ${index} explains the topic clearly for readers.`,
      ).join(' '),
    ].join('\n\n');

    const result = await runArticleQualityGate(prisma, {
      articleIdeaId: idea.id,
      title: idea.title,
      summary: idea.summary,
      contentPlain,
    });

    expect(result.passed).toBe(true);
    expect(result.aiJobId).toBeTruthy();
  });
});
