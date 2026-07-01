import { Prisma, PrismaClient } from '@prisma/client';
import { checkLayer1Exact, logDuplicateRejection } from './layer1';
import { checkLayer4Canonical } from './layer4';
import type { DuplicateCheckOutcome, IdeaDuplicateCandidate } from './types';

export async function checkIdeaDuplicates(
  prisma: PrismaClient,
  candidate: IdeaDuplicateCandidate,
): Promise<DuplicateCheckOutcome> {
  const layer1 = await checkLayer1Exact(prisma, {
    title: candidate.title,
    slugCandidate: candidate.slugCandidate,
    normalizedTopicTitle: candidate.normalizedTopicTitle,
  });

  if (!layer1.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 1,
      reason: layer1.reason,
      matchedArticleId: layer1.matchedArticleId,
      metadata: layer1.metadata,
    });

    return {
      passed: false,
      failedLayer: 1,
      reason: layer1.reason,
      matchedArticleId: layer1.matchedArticleId,
      layers: [layer1],
    };
  }

  const layer4 = await checkLayer4Canonical(prisma, {
    title: candidate.title,
    intent: candidate.intent,
  });

  if (!layer4.passed) {
    await logDuplicateRejection(prisma, {
      rejectedTitle: candidate.title,
      layer: 4,
      reason: layer4.reason,
      matchedArticleId: layer4.matchedArticleId,
      metadata: layer4.metadata,
    });

    return {
      passed: false,
      failedLayer: 4,
      reason: layer4.reason,
      matchedArticleId: layer4.matchedArticleId,
      layers: [layer1, layer4],
    };
  }

  return {
    passed: true,
    layers: [layer1, layer4],
  };
}

export function duplicateCheckResultToJson(outcome: DuplicateCheckOutcome): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(outcome)) as Prisma.InputJsonValue;
}
