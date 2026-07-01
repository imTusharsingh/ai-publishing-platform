import { Worker, type Job } from 'bullmq';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  createRedisConnection,
  type ArticleWritingJobData,
  type EmbeddingJobData,
  type PingJobData,
  type TrendDiscoveryJobData,
} from '@repo/queue';
import { processArticleWritingJob } from './processors/article-writing.processor';
import { processEmbeddingJob } from './processors/embedding.processor';
import { processPingJob } from './processors/ping.processor';
import { processTrendDiscoveryJob } from './processors/trend-discovery.processor';

async function bootstrap() {
  const worker = new Worker<
    PingJobData | TrendDiscoveryJobData | ArticleWritingJobData | EmbeddingJobData
  >(
    QUEUE_NAMES.DEFAULT,
    async (job) => {
      if (job.name === JOB_NAMES.PING) {
        return processPingJob(job as Job<PingJobData>);
      }

      if (job.name === JOB_NAMES.TREND_DISCOVERY) {
        return processTrendDiscoveryJob(job as Job<TrendDiscoveryJobData>);
      }

      if (job.name === JOB_NAMES.ARTICLE_WRITING) {
        return processArticleWritingJob(job as Job<ArticleWritingJobData>);
      }

      if (job.name === JOB_NAMES.EMBEDDING) {
        return processEmbeddingJob(job as Job<EmbeddingJobData>);
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
