import { PrismaClient } from '@prisma/client';
import type { LayerCheckResult } from './types';
import { buildTopicKey } from './normalize-text';

export interface Layer4Input {
  title: string;
  intent?: string | null;
}

export async function checkLayer4Canonical(
  prisma: PrismaClient,
  input: Layer4Input,
): Promise<LayerCheckResult> {
  const topicKey = buildTopicKey(input.title, input.intent);
  const now = new Date();

  const canonical = await prisma.canonicalTopic.findUnique({
    where: { topicKey },
    include: { article: { select: { id: true, title: true } } },
  });

  if (!canonical) {
    return {
      layer: 4,
      passed: true,
      metadata: { topicKey },
    };
  }

  if (canonical.cooldownUntil > now) {
    return {
      layer: 4,
      passed: false,
      reason: `Topic "${topicKey}" is in cooldown until ${canonical.cooldownUntil.toISOString()}`,
      matchedArticleId: canonical.articleId,
      metadata: {
        topicKey,
        cooldownUntil: canonical.cooldownUntil.toISOString(),
        coverageCount: canonical.coverageCount,
      },
    };
  }

  if (input.intent && canonical.intent.toLowerCase() === input.intent.trim().toLowerCase()) {
    return {
      layer: 4,
      passed: false,
      reason: `Intent "${input.intent}" already covered by article "${canonical.article.title}"`,
      matchedArticleId: canonical.articleId,
      metadata: { topicKey, intent: canonical.intent },
    };
  }

  return {
    layer: 4,
    passed: true,
    metadata: { topicKey, cooldownExpired: true },
  };
}
