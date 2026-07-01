import { Queue } from 'bullmq';
import { createRedisConnection } from './redis';
import { JOB_NAMES, QUEUE_NAMES } from './types';
import type { DuplicateCheckJobData, EmbeddingJobData } from './types';

let defaultQueue: Queue | null = null;

function resolveQueue(): Queue {
  if (!defaultQueue) {
    defaultQueue = new Queue(QUEUE_NAMES.DEFAULT, {
      connection: createRedisConnection(),
    });
  }

  return defaultQueue;
}

export async function enqueueEmbeddingJob(articleId: string) {
  return resolveQueue().add(JOB_NAMES.EMBEDDING, { articleId } satisfies EmbeddingJobData, {
    jobId: `embedding:article:${articleId}`,
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}

export async function enqueueDuplicateCheckJob(articleId: string) {
  return resolveQueue().add(
    JOB_NAMES.DUPLICATE_CHECK,
    { articleId } satisfies DuplicateCheckJobData,
    {
      jobId: `duplicate-check:article:${articleId}`,
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  );
}
