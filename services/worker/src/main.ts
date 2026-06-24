import { Worker } from 'bullmq';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  createRedisConnection,
  type PingJobData,
} from '@repo/queue';
import { processPingJob } from './processors/ping.processor';

async function bootstrap() {
  const worker = new Worker<PingJobData>(
    QUEUE_NAMES.DEFAULT,
    async (job) => {
      if (job.name === JOB_NAMES.PING) {
        return processPingJob(job);
      }

      throw new Error(`Unknown job name: ${job.name}`);
    },
    { connection: createRedisConnection() },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed: ${error.message}`);
  });

  console.log(`Worker listening on queue "${QUEUE_NAMES.DEFAULT}"`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
