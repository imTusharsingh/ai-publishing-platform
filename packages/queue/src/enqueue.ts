import { Queue } from 'bullmq';
import { createRedisConnection } from './redis';
import { JOB_NAMES, QUEUE_NAMES } from './types';
import type { DailyPublishingJobData, DuplicateCheckJobData, EmbeddingJobData } from './types';

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

export async function enqueueDailyPublishingJob(runId?: string) {
  const id = runId ?? `daily-${Date.now()}`;
  return resolveQueue().add(
    JOB_NAMES.DAILY_PUBLISHING,
    { runId: id } satisfies DailyPublishingJobData,
    {
      jobId: `daily-publishing:${id}`,
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  );
}

const DAILY_PUBLISHING_REPEATABLE_KEY = 'daily-publishing:cron';

export async function scheduleDailyPublishingCron(cronPattern = '0 6 * * *') {
  const queue = resolveQueue();
  const repeatable = await queue.getRepeatableJobs();
  const existing = repeatable.find((job) => job.key.includes(DAILY_PUBLISHING_REPEATABLE_KEY));

  if (existing) {
    await queue.removeRepeatableByKey(existing.key);
  }

  return queue.add(
    JOB_NAMES.DAILY_PUBLISHING,
    { runId: `cron-${Date.now()}` } satisfies DailyPublishingJobData,
    {
      repeat: { pattern: cronPattern },
      jobId: DAILY_PUBLISHING_REPEATABLE_KEY,
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  );
}
