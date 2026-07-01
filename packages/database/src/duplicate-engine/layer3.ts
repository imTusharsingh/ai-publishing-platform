import { PrismaClient } from '@prisma/client';
import { vectorToPgLiteral } from '../embedding/embedding-similarity';
import { embedCandidateTexts } from '../embedding/generate-article-embeddings';
import type { LayerCheckResult } from './types';
import type { DuplicateThresholdSettings } from './duplicate-settings';
import { buildTopicKey } from './normalize-text';

interface CanonicalNeighborRow {
  topic_key: string;
  article_id: string;
  intent: string;
  distance: number;
}

export interface Layer3Input {
  title: string;
  summary?: string | null;
  contentPlain?: string | null;
  intent?: string | null;
  thresholds: DuplicateThresholdSettings;
}

export async function checkLayer3TopicCluster(
  prisma: PrismaClient,
  input: Layer3Input,
): Promise<LayerCheckResult> {
  const embeddings = await embedCandidateTexts({
    title: input.title,
    summary: input.summary,
    contentPlain: input.contentPlain,
  });

  const vector = vectorToPgLiteral(embeddings.contentEmbedding);
  const rows = (await prisma.$queryRawUnsafe(
    `
    SELECT ct.topic_key, ct.article_id, ct.intent,
           (ct.embedding <=> $1::vector) AS distance
    FROM canonical_topics ct
    WHERE ct.embedding IS NOT NULL
    ORDER BY ct.embedding <=> $1::vector
    LIMIT 3
    `,
    vector,
  )) as CanonicalNeighborRow[];

  if (rows.length === 0) {
    return {
      layer: 3,
      passed: true,
      metadata: { topicKey: buildTopicKey(input.title, input.intent), neighbors: 0 },
    };
  }

  const nearest = rows[0];
  const distance = Number(nearest.distance);
  const intentMatches =
    input.intent && nearest.intent.trim().toLowerCase() === input.intent.trim().toLowerCase();

  if (distance < input.thresholds.clusterDistanceThreshold && intentMatches) {
    return {
      layer: 3,
      passed: false,
      reason: `Topic cluster distance ${distance.toFixed(4)} with matching intent "${nearest.intent}"`,
      matchedArticleId: nearest.article_id,
      similarityScore: 1 - distance,
      metadata: {
        topicKey: nearest.topic_key,
        distance,
        intent: nearest.intent,
      },
    };
  }

  return {
    layer: 3,
    passed: true,
    metadata: {
      nearestDistance: distance,
      nearestTopicKey: nearest.topic_key,
      intentMatches: Boolean(intentMatches),
    },
  };
}
