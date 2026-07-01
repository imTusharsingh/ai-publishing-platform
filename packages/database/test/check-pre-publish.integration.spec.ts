jest.unmock('@repo/ai');

import { ArticleStatus } from '@prisma/client';
import {
  prisma,
  seed,
  generateArticleEmbeddings,
  checkPrePublishDuplicates,
  updateDuplicateSettings,
} from '../src';

describe('pre-publish duplicate detection', () => {
  beforeAll(async () => {
    await seed();
    process.env.AI_EMBEDDING_PROVIDER = 'mock';
    await updateDuplicateSettings(prisma, {
      titleThreshold: 0.99,
      summaryThreshold: 0.99,
      contentThreshold: 0.5,
      topicCooldownDays: 30,
      clusterDistanceThreshold: 0.15,
    });
  });

  it('rejects semantically similar article at publish time', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const baseTitle = `Semantic duplicate base ${Date.now()}`;
    const content = 'Quantum processors are advancing rapidly across the industry.';

    const createPair = async (title: string, slug: string) => {
      const idea = await prisma.articleIdea.create({
        data: {
          categoryId: category.id,
          title,
          slugCandidate: slug,
          summary: content,
          status: 'APPROVED',
        },
      });

      return prisma.article.create({
        data: {
          categoryId: category.id,
          articleIdeaId: idea.id,
          title,
          slug,
          summary: content,
          contentPlain: content,
          content: `<p>${content}</p>`,
          status: ArticleStatus.DRAFT,
        },
      });
    };

    const original = await createPair(baseTitle, `semantic-base-${Date.now()}`);
    await generateArticleEmbeddings(prisma, original.id);

    const candidate = await createPair(`${baseTitle} revised`, `semantic-candidate-${Date.now()}`);
    await generateArticleEmbeddings(prisma, candidate.id);

    const result = await checkPrePublishDuplicates(prisma, {
      articleId: candidate.id,
      title: candidate.title,
      slug: candidate.slug,
      summary: candidate.summary,
      contentPlain: candidate.contentPlain,
    });

    expect(result.passed).toBe(false);
    expect(result.failedLayer).toBe(2);
  });
});
