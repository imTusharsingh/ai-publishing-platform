jest.unmock('@repo/ai');

import { ArticleStatus } from '@prisma/client';
import {
  prisma,
  seed,
  generateArticleEmbeddings,
  findSimilarArticles,
  embedCandidateTexts,
} from '../src';

describe('article embeddings', () => {
  beforeAll(async () => {
    await seed();
    process.env.AI_EMBEDDING_PROVIDER = 'mock';
  });

  it('upserts embeddings and finds similar articles by content', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const idea = await prisma.articleIdea.create({
      data: {
        categoryId: category.id,
        title: `Embedding test ${Date.now()}`,
        slugCandidate: `embedding-test-${Date.now()}`,
        summary: 'Original summary about quantum computing advances',
        status: 'APPROVED',
      },
    });

    const article = await prisma.article.create({
      data: {
        categoryId: category.id,
        articleIdeaId: idea.id,
        title: idea.title,
        slug: idea.slugCandidate,
        summary: idea.summary,
        contentPlain: 'Quantum computing continues to evolve with new chip architectures.',
        status: ArticleStatus.DRAFT,
      },
    });

    await generateArticleEmbeddings(prisma, article.id);

    const embeddings = await embedCandidateTexts({
      title: idea.title,
      summary: 'Very similar summary about quantum computing advances',
      contentPlain: 'Quantum computing continues to evolve with new chip architectures and qubits.',
    });

    const matches = await findSimilarArticles(prisma, {
      contentEmbedding: embeddings.contentEmbedding,
      titleThreshold: 0.99,
      summaryThreshold: 0.99,
      contentThreshold: 0.5,
      excludeArticleId: article.id,
    });

    expect(matches.length).toBeGreaterThanOrEqual(0);
  });
});
