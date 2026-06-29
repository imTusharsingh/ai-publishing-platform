import type { Job } from 'bullmq';
import { discoverTrends, prisma } from '@repo/database';
import type { TrendDiscoveryJobData, TrendDiscoveryJobResult } from '@repo/queue';

export async function processTrendDiscoveryJob(
  job: Job<TrendDiscoveryJobData>,
): Promise<TrendDiscoveryJobResult> {
  const result = await discoverTrends(prisma, job.data.runId);

  return {
    created: result.created,
    runId: result.runId,
  };
}
