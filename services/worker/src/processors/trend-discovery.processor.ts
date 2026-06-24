import type { Job } from 'bullmq';
import { discoverMockTrends, prisma } from '@repo/database';
import type { TrendDiscoveryJobData, TrendDiscoveryJobResult } from '@repo/queue';

export async function processTrendDiscoveryJob(
  job: Job<TrendDiscoveryJobData>,
): Promise<TrendDiscoveryJobResult> {
  const created = await discoverMockTrends(prisma, job.data.runId);

  return {
    created,
    runId: job.data.runId,
  };
}
