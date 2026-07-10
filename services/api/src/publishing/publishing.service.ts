import { Injectable } from '@nestjs/common';
import { enqueueDailyPublishingJob } from '@repo/queue';

@Injectable()
export class PublishingService {
  async triggerDailyPipeline() {
    const job = await enqueueDailyPublishingJob();
    return {
      jobId: job.id,
      runId: job.data.runId,
      queue: job.queueName,
    };
  }
}
