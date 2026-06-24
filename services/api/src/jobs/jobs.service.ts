import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  getDefaultQueue,
  closeQueues,
  type JobStatusResponse,
  type PingJobData,
} from '@repo/queue';
import type { Job } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly queue = getDefaultQueue();

  async enqueuePing(message: string): Promise<JobStatusResponse> {
    const job = await this.queue.add(JOB_NAMES.PING, { message } satisfies PingJobData);
    return this.toStatus(job);
  }

  async findById(id: string): Promise<JobStatusResponse> {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    return this.toStatus(job);
  }

  async findRecent(limit = 20): Promise<JobStatusResponse[]> {
    const jobs = await this.queue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed'], 0, limit - 1);
    return Promise.all(jobs.map((job) => this.toStatus(job)));
  }

  async onModuleDestroy(): Promise<void> {
    await closeQueues();
  }

  getQueue() {
    return this.queue;
  }

  private async toStatus(job: Job): Promise<JobStatusResponse> {
    const state = await job.getState();

    return {
      id: job.id ?? '',
      name: job.name,
      queue: QUEUE_NAMES.DEFAULT,
      state,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason ?? null,
      finishedOn: job.finishedOn ?? null,
      processedOn: job.processedOn ?? null,
      returnvalue: job.returnvalue ?? null,
      data: job.data,
    };
  }
}
