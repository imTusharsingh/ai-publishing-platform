import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  getDefaultQueue,
  closeQueues,
  type JobStatusResponse,
  type PingJobData,
} from '@repo/queue';
import type { Job, Queue } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private queue: Queue | null = null;

  private resolveQueue(): Queue {
    if (!this.queue) {
      this.queue = getDefaultQueue();
    }

    return this.queue;
  }

  async enqueuePing(message: string): Promise<JobStatusResponse> {
    const job = await this.resolveQueue().add(JOB_NAMES.PING, { message } satisfies PingJobData);
    return this.toStatus(job);
  }

  async findById(id: string): Promise<JobStatusResponse> {
    const job = await this.resolveQueue().getJob(id);
    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    return this.toStatus(job);
  }

  async findRecent(limit = 20): Promise<JobStatusResponse[]> {
    const jobs = await this.resolveQueue().getJobs(
      ['completed', 'failed', 'active', 'waiting', 'delayed'],
      0,
      limit - 1,
    );
    return Promise.all(jobs.map((job) => this.toStatus(job)));
  }

  async onModuleDestroy(): Promise<void> {
    await closeQueues();
  }

  getQueue() {
    return this.resolveQueue();
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
