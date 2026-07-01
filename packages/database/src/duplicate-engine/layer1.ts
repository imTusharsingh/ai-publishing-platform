import { Prisma, PrismaClient } from '@prisma/client';
import type { LayerCheckResult } from './types';
import { normalizeText, slugifyCandidate } from './normalize-text';

export interface Layer1Input {
  title: string;
  slugCandidate?: string;
  normalizedTopicTitle?: string | null;
  excludeArticleId?: string;
  excludeIdeaId?: string;
}

export async function checkLayer1Exact(
  prisma: PrismaClient,
  input: Layer1Input,
): Promise<LayerCheckResult> {
  const normalizedTitle = normalizeText(input.title);
  const slug = input.slugCandidate?.trim() || slugifyCandidate(input.title);
  const excludeArticleId = input.excludeArticleId;

  const [articleTitleMatch, articleSlugMatch, ideaSlugMatch, topicMatch] = await Promise.all([
    prisma.article.findFirst({
      where: {
        title: { equals: input.title.trim(), mode: 'insensitive' },
        ...(excludeArticleId ? { id: { not: excludeArticleId } } : {}),
      },
      select: { id: true, title: true },
    }),
    prisma.article.findFirst({
      where: {
        slug,
        ...(excludeArticleId ? { id: { not: excludeArticleId } } : {}),
      },
      select: { id: true, slug: true },
    }),
    prisma.articleIdea.findFirst({
      where: {
        slugCandidate: slug,
        ...(input.excludeIdeaId ? { id: { not: input.excludeIdeaId } } : {}),
      },
      select: { id: true, slugCandidate: true },
    }),
    input.normalizedTopicTitle
      ? prisma.trendingTopic.findFirst({
          where: { normalizedTitle: normalizeText(input.normalizedTopicTitle) },
          select: { id: true, normalizedTitle: true },
        })
      : Promise.resolve(null),
  ]);

  if (articleTitleMatch) {
    return {
      layer: 1,
      passed: false,
      reason: `Title matches existing article "${articleTitleMatch.title}"`,
      matchedArticleId: articleTitleMatch.id,
      metadata: { normalizedTitle, matchType: 'article_title' },
    };
  }

  if (articleSlugMatch) {
    return {
      layer: 1,
      passed: false,
      reason: `Slug matches existing article "${articleSlugMatch.slug}"`,
      matchedArticleId: articleSlugMatch.id,
      metadata: { slug, matchType: 'article_slug' },
    };
  }

  if (ideaSlugMatch) {
    return {
      layer: 1,
      passed: false,
      reason: `Slug candidate matches existing idea "${ideaSlugMatch.slugCandidate}"`,
      metadata: { slug, matchType: 'idea_slug', ideaId: ideaSlugMatch.id },
    };
  }

  if (topicMatch) {
    return {
      layer: 1,
      passed: false,
      reason: `Normalized topic already exists as "${topicMatch.normalizedTitle}"`,
      metadata: { topicId: topicMatch.id, matchType: 'normalized_topic' },
    };
  }

  return {
    layer: 1,
    passed: true,
    metadata: { normalizedTitle, slug },
  };
}

export async function logDuplicateRejection(
  prisma: PrismaClient,
  params: {
    rejectedTitle: string;
    layer: number;
    reason?: string;
    matchedArticleId?: string;
    similarityScore?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await prisma.duplicateRejection.create({
    data: {
      rejectedTitle: params.rejectedTitle.slice(0, 500),
      layer: params.layer,
      reason: params.reason,
      matchedArticleId: params.matchedArticleId,
      similarityScore:
        params.similarityScore !== undefined
          ? new Prisma.Decimal(params.similarityScore.toFixed(4))
          : undefined,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
