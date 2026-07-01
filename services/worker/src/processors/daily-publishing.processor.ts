import type { Job } from 'bullmq';
import { runDailyPublishingPipeline, prisma } from '@repo/database';
import type { DailyPublishingJobData, DailyPublishingJobResult } from '@repo/queue';

export async function processDailyPublishingJob(
  job: Job<DailyPublishingJobData>,
): Promise<DailyPublishingJobResult> {
  const result = await runDailyPublishingPipeline(prisma, job.data.runId);

  return {
    runId: result.runId,
    topicsDiscovered: result.topicsDiscovered,
    ideasGenerated: result.ideasGenerated,
    articlesWritten: result.articlesWritten,
    articlesPublished: result.articlesPublished,
    failureCount: result.failures.length,
  };
}
