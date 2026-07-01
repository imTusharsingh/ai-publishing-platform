import { vectorToPgLiteral } from '@repo/ai';

export { vectorToPgLiteral };

export interface SimilarArticleMatch {
  articleId: string;
  similarity: number;
  field: 'title' | 'summary' | 'content';
}

export interface FindSimilarArticlesInput {
  titleEmbedding?: number[];
  summaryEmbedding?: number[];
  contentEmbedding?: number[];
  titleThreshold: number;
  summaryThreshold: number;
  contentThreshold: number;
  excludeArticleId?: string;
  limit?: number;
}

interface SimilarityRow {
  article_id: string;
  similarity: number;
}

async function searchByField(
  prisma: { $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown> },
  field: 'title_embedding' | 'summary_embedding' | 'content_embedding',
  embedding: number[],
  threshold: number,
  excludeArticleId: string | undefined,
  limit: number,
): Promise<SimilarArticleMatch[]> {
  const vector = vectorToPgLiteral(embedding);
  const excludeClause = excludeArticleId ? 'AND ae.article_id <> $3::uuid' : '';
  const params = excludeArticleId
    ? [vector, threshold, excludeArticleId, limit]
    : [vector, threshold, limit];
  const limitParam = excludeArticleId ? '$4' : '$3';

  const rows = (await prisma.$queryRawUnsafe(
    `
    SELECT ae.article_id, 1 - (ae.${field} <=> $1::vector) AS similarity
    FROM article_embeddings ae
    INNER JOIN articles a ON a.id = ae.article_id
    WHERE ae.${field} IS NOT NULL
      AND 1 - (ae.${field} <=> $1::vector) > $2
      ${excludeClause}
    ORDER BY ae.${field} <=> $1::vector
    LIMIT ${limitParam}
    `,
    ...params,
  )) as SimilarityRow[];

  const mappedField =
    field === 'title_embedding' ? 'title' : field === 'summary_embedding' ? 'summary' : 'content';

  return rows.map((row) => ({
    articleId: row.article_id,
    similarity: Number(row.similarity),
    field: mappedField,
  }));
}

export async function findSimilarArticles(
  prisma: { $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown> },
  input: FindSimilarArticlesInput,
): Promise<SimilarArticleMatch[]> {
  const limit = input.limit ?? 10;
  const matches: SimilarArticleMatch[] = [];

  if (input.titleEmbedding?.length) {
    matches.push(
      ...(await searchByField(
        prisma,
        'title_embedding',
        input.titleEmbedding,
        input.titleThreshold,
        input.excludeArticleId,
        limit,
      )),
    );
  }

  if (input.summaryEmbedding?.length) {
    matches.push(
      ...(await searchByField(
        prisma,
        'summary_embedding',
        input.summaryEmbedding,
        input.summaryThreshold,
        input.excludeArticleId,
        limit,
      )),
    );
  }

  if (input.contentEmbedding?.length) {
    matches.push(
      ...(await searchByField(
        prisma,
        'content_embedding',
        input.contentEmbedding,
        input.contentThreshold,
        input.excludeArticleId,
        limit,
      )),
    );
  }

  return matches.sort((left, right) => right.similarity - left.similarity);
}
