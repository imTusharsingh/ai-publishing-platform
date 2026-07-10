import type { Job } from 'bullmq';
import { computeArticleRelated, generateArticleEmbeddings, prisma } from '@repo/database';
import type { EmbeddingJobData, EmbeddingJobResult } from '@repo/queue';

export async function processEmbeddingJob(job: Job<EmbeddingJobData>): Promise<EmbeddingJobResult> {
  const result = await generateArticleEmbeddings(prisma, job.data.articleId);
  await computeArticleRelated(prisma, job.data.articleId);
  return {
    articleId: result.articleId,
    aiJobId: result.aiJobId,
  };
}
