import { PrismaClient } from '@prisma/client';
import { embedTexts, vectorToPgLiteral } from '@repo/ai';
import { generateArticleEmbeddings } from '../embedding/generate-article-embeddings';
import { buildTopicKey } from './normalize-text';
import { getDuplicateSettings, type DuplicateThresholdSettings } from './duplicate-settings';

export async function registerCanonicalTopic(
  prisma: PrismaClient,
  params: {
    articleId: string;
    title: string;
    intent?: string | null;
    summary?: string | null;
    keywords?: string[];
    cooldownDays?: number;
    settings?: DuplicateThresholdSettings;
  },
): Promise<void> {
  const settings = params.settings ?? (await getDuplicateSettings(prisma));
  const topicKey = buildTopicKey(params.title, params.intent);
  const now = new Date();
  const cooldownUntil = new Date(
    now.getTime() + (params.cooldownDays ?? settings.topicCooldownDays) * 24 * 60 * 60 * 1000,
  );

  const embedResult = await embedTexts([params.title]);
  const embedding = vectorToPgLiteral(embedResult.embeddings[0] ?? []);

  const existing = await prisma.canonicalTopic.findUnique({ where: { topicKey } });

  if (existing) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE canonical_topics
      SET last_covered_at = $2,
          coverage_count = coverage_count + 1,
          cooldown_until = $3,
          article_id = $4,
          embedding = $5::vector,
          intent = $6,
          keywords = $7::text[]
      WHERE topic_key = $1
      `,
      topicKey,
      now,
      cooldownUntil,
      params.articleId,
      embedding,
      params.intent?.trim() || 'general',
      params.keywords ?? [],
    );
    return;
  }

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO canonical_topics (
      id, topic_key, intent, keywords, embedding,
      first_covered_at, last_covered_at, coverage_count, cooldown_until, article_id
    )
    VALUES (
      gen_random_uuid(), $1, $2, $3::text[], $4::vector,
      $5, $5, 1, $6, $7::uuid
    )
    `,
    topicKey,
    params.intent?.trim() || 'general',
    params.keywords ?? [],
    embedding,
    now,
    cooldownUntil,
    params.articleId,
  );
}

export async function ensureArticleEmbedding(
  prisma: PrismaClient,
  articleId: string,
): Promise<void> {
  const existing = await prisma.articleEmbedding.findUnique({
    where: { articleId },
    select: { id: true },
  });

  if (!existing) {
    await generateArticleEmbeddings(prisma, articleId);
  }
}
