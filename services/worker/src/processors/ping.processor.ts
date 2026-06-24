import type { Job } from 'bullmq';
import type { PingJobData, PingJobResult } from '@repo/queue';

export async function processPingJob(job: Job<PingJobData>): Promise<PingJobResult> {
  return {
    pong: true,
    receivedAt: new Date().toISOString(),
    message: job.data.message,
  };
}
