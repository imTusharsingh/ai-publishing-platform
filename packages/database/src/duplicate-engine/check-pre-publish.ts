import { PrismaClient } from '@prisma/client';
import { checkLayer1Exact, logDuplicateRejection } from './layer1';
import { checkLayer2Semantic } from './layer2';
import { checkLayer3TopicCluster } from './layer3';
import { checkLayer4Canonical } from './layer4';
import { getDuplicateSettings } from './duplicate-settings';
import { duplicateCheckResultToJson } from './check-idea-duplicates';
import { ensureArticleEmbedding } from './register-canonical-topic';
import type { DuplicateCheckOutcome, PublishDuplicateCandidate } from './types';

export async function checkPrePublishDuplicates(
  prisma: PrismaClient,
  candidate: PublishDuplicateCandidate,
): Promise<DuplicateCheckOutcome> {
  const thresholds = await getDuplicateSettings(prisma);
  const layers = [];

  const articleMeta = await prisma.article.findUnique({
    where: { id: candidate.articleId },
    select: { articleIdeaId: true },
  });

  const layer1 = await checkLayer1Exact(prisma, {
    title: candidate.title,
    slugCandidate: candidate.slug,
    excludeArticleId: candidate.articleId,
    excludeIdeaId: articleMeta?.articleIdeaId,
  });
  layers.push(layer1);

  if (!layer1.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 1,
      reason: layer1.reason,
      matchedArticleId: layer1.matchedArticleId,
      metadata: layer1.metadata,
    });
    return buildFailure(1, layer1, layers);
  }

  const layer4 = await checkLayer4Canonical(prisma, {
    title: candidate.title,
    intent: candidate.intent,
  });
  layers.push(layer4);

  if (!layer4.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 4,
      reason: layer4.reason,
      matchedArticleId: layer4.matchedArticleId,
      metadata: layer4.metadata,
    });
    return buildFailure(4, layer4, layers);
  }

  await ensureArticleEmbedding(prisma, candidate.articleId);

  const layer2 = await checkLayer2Semantic(prisma, {
    title: candidate.title,
    summary: candidate.summary,
    contentPlain: candidate.contentPlain,
    excludeArticleId: candidate.articleId,
    thresholds,
  });
  layers.push(layer2);

  if (!layer2.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 2,
      reason: layer2.reason,
      matchedArticleId: layer2.matchedArticleId,
      similarityScore: layer2.similarityScore,
      metadata: layer2.metadata,
    });
    return buildFailure(2, layer2, layers);
  }

  const layer3 = await checkLayer3TopicCluster(prisma, {
    title: candidate.title,
    summary: candidate.summary,
    contentPlain: candidate.contentPlain,
    intent: candidate.intent,
    thresholds,
  });
  layers.push(layer3);

  if (!layer3.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 3,
      reason: layer3.reason,
      matchedArticleId: layer3.matchedArticleId,
      similarityScore: layer3.similarityScore,
      metadata: layer3.metadata,
    });
    return buildFailure(3, layer3, layers);
  }

  return { passed: true, layers };
}

function buildFailure(
  failedLayer: number,
  layer: { reason?: string; matchedArticleId?: string; similarityScore?: number },
  layers: DuplicateCheckOutcome['layers'],
): DuplicateCheckOutcome {
  return {
    passed: false,
    failedLayer,
    reason: layer.reason,
    matchedArticleId: layer.matchedArticleId,
    similarityScore: layer.similarityScore,
    layers,
  };
}

export { duplicateCheckResultToJson };
