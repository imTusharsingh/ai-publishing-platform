import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ArticleIdeaStatus } from '@prisma/client';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  getDefaultQueue,
  closeQueues,
  type ArticleWritingJobData,
  type JobStatusResponse,
  type PingJobData,
} from '@repo/queue';
import type { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private queue: Queue | null = null;

  constructor(private readonly prisma: PrismaService) {}

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

  async retryJob(id: string): Promise<JobStatusResponse> {
    const job = await this.resolveQueue().getJob(id);
    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    const state = await job.getState();
    if (state !== 'failed') {
      throw new BadRequestException(`Only failed jobs can be retried (current: ${state})`);
    }

    await this.prepareJobRetry(job);
    await job.retry();

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

  private async prepareJobRetry(job: Job): Promise<void> {
    if (job.name !== JOB_NAMES.ARTICLE_WRITING) {
      return;
    }

    const data = job.data as ArticleWritingJobData;
    const idea = await this.prisma.articleIdea.findUnique({
      where: { id: data.ideaId },
      include: { article: { select: { id: true } } },
    });

    if (!idea) {
      throw new NotFoundException(`Article idea with id "${data.ideaId}" not found`);
    }

    if (idea.article) {
      throw new BadRequestException(
        'Article already exists for this idea — cannot retry writing job',
      );
    }

    await this.prisma.articleIdea.update({
      where: { id: data.ideaId },
      data: { status: ArticleIdeaStatus.GENERATING },
    });
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
