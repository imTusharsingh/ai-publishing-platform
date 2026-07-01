import { PrismaClient } from '@prisma/client';
import { embedCandidateTexts } from '../embedding/generate-article-embeddings';
import { findSimilarArticles } from '../embedding/embedding-similarity';
import type { LayerCheckResult } from './types';
import type { DuplicateThresholdSettings } from './duplicate-settings';

export interface Layer2Input {
  title: string;
  summary?: string | null;
  contentPlain?: string | null;
  excludeArticleId?: string;
  thresholds: DuplicateThresholdSettings;
}

export async function checkLayer2Semantic(
  prisma: PrismaClient,
  input: Layer2Input,
): Promise<LayerCheckResult> {
  const embeddings = await embedCandidateTexts({
    title: input.title,
    summary: input.summary,
    contentPlain: input.contentPlain,
  });

  const matches = await findSimilarArticles(prisma, {
    titleEmbedding: embeddings.titleEmbedding,
    summaryEmbedding: embeddings.summaryEmbedding,
    contentEmbedding: embeddings.contentEmbedding,
    titleThreshold: input.thresholds.titleThreshold,
    summaryThreshold: input.thresholds.summaryThreshold,
    contentThreshold: input.thresholds.contentThreshold,
    excludeArticleId: input.excludeArticleId,
    limit: 5,
  });

  if (matches.length === 0) {
    return {
      layer: 2,
      passed: true,
      metadata: { matchCount: 0 },
    };
  }

  const topMatch = matches[0];
  return {
    layer: 2,
    passed: false,
    reason: `Semantic similarity ${topMatch.similarity.toFixed(4)} on ${topMatch.field} exceeds threshold`,
    matchedArticleId: topMatch.articleId,
    similarityScore: topMatch.similarity,
    metadata: { matches },
  };
}
