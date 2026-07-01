import { Queue } from 'bullmq';
import { createRedisConnection } from './redis';
import { QUEUE_NAMES } from './types';

let defaultQueue: Queue | null = null;

export function getDefaultQueue(): Queue {
  if (!defaultQueue) {
    defaultQueue = new Queue(QUEUE_NAMES.DEFAULT, {
      connection: createRedisConnection(),
    });
  }

  return defaultQueue;
}

export async function closeQueues(): Promise<void> {
  if (defaultQueue) {
    await defaultQueue.close();
    defaultQueue = null;
  }
}

export { QUEUE_NAMES, JOB_NAMES } from './types';
export type {
  ArticleWritingJobData,
  ArticleWritingJobResult,
  DuplicateCheckJobData,
  DuplicateCheckJobResult,
  EmbeddingJobData,
  EmbeddingJobResult,
  JobName,
  JobStatusResponse,
  PingJobData,
  PingJobResult,
  QualityJobData,
  QualityJobResult,
  QueueName,
  TrendDiscoveryJobData,
  TrendDiscoveryJobResult,
} from './types';
export { createRedisConnection } from './redis';
export { enqueueEmbeddingJob, enqueueDuplicateCheckJob } from './enqueue';
