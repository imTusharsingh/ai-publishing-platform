import { Prisma, PrismaClient } from '@prisma/client';
import { embedCandidateTexts } from './embedding/generate-article-embeddings';
import { findSimilarArticles } from './embedding/embedding-similarity';

const RELATED_LIMIT = 6;
const RELATED_THRESHOLD = 0.75;

export interface ComputeRelatedArticlesResult {
  articleId: string;
  relatedCount: number;
}

export async function computeArticleRelated(
  prisma: PrismaClient,
  articleId: string,
): Promise<ComputeRelatedArticlesResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      summary: true,
      contentPlain: true,
    },
  });

  if (!article) {
    return { articleId, relatedCount: 0 };
  }

  const embeddings = await embedCandidateTexts({
    title: article.title,
    summary: article.summary,
    contentPlain: article.contentPlain,
  });

  const matches = await findSimilarArticles(prisma, {
    titleEmbedding: embeddings.titleEmbedding,
    summaryEmbedding: embeddings.summaryEmbedding,
    contentEmbedding: embeddings.contentEmbedding,
    titleThreshold: RELATED_THRESHOLD,
    summaryThreshold: RELATED_THRESHOLD,
    contentThreshold: RELATED_THRESHOLD,
    excludeArticleId: articleId,
    limit: RELATED_LIMIT + 2,
  });

  const uniqueIds = [...new Set(matches.map((match) => match.articleId))].slice(0, RELATED_LIMIT);

  if (uniqueIds.length === 0) {
    await prisma.articleRelated.deleteMany({ where: { articleId } });
    return { articleId, relatedCount: 0 };
  }

  const published = await prisma.article.findMany({
    where: {
      id: { in: uniqueIds },
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    select: { id: true },
  });

  const publishedIds = new Set(published.map((row) => row.id));
  const scoreByArticle = new Map(matches.map((match) => [match.articleId, match.similarity]));

  await prisma.$transaction([
    prisma.articleRelated.deleteMany({ where: { articleId } }),
    ...[...publishedIds].map((relatedArticleId) =>
      prisma.articleRelated.create({
        data: {
          articleId,
          relatedArticleId,
          similarityScore: new Prisma.Decimal(
            scoreByArticle.get(relatedArticleId) ?? RELATED_THRESHOLD,
          ),
        },
      }),
    ),
  ]);

  return { articleId, relatedCount: publishedIds.size };
}
