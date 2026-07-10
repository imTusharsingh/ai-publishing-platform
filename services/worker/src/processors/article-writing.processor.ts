import type { Job } from 'bullmq';
import { generateArticle, prisma } from '@repo/database';
import { enqueueEmbeddingJob } from '@repo/queue';
import type { ArticleWritingJobData, ArticleWritingJobResult } from '@repo/queue';

export async function processArticleWritingJob(
  job: Job<ArticleWritingJobData>,
): Promise<ArticleWritingJobResult> {
  const result = await generateArticle(prisma, job.data.ideaId);
  await enqueueEmbeddingJob(result.articleId);
  return result;
}
