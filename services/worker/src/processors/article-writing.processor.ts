import type { Job } from 'bullmq';
import { generateMockArticle, prisma } from '@repo/database';
import type { ArticleWritingJobData, ArticleWritingJobResult } from '@repo/queue';

export async function processArticleWritingJob(
  job: Job<ArticleWritingJobData>,
): Promise<ArticleWritingJobResult> {
  return generateMockArticle(prisma, job.data.ideaId);
}
