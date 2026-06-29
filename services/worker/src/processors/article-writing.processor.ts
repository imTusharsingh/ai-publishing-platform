import type { Job } from 'bullmq';
import { generateArticle, prisma } from '@repo/database';
import type { ArticleWritingJobData, ArticleWritingJobResult } from '@repo/queue';

export async function processArticleWritingJob(
  job: Job<ArticleWritingJobData>,
): Promise<ArticleWritingJobResult> {
  return generateArticle(prisma, job.data.ideaId);
}
