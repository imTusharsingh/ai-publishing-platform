import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArticleIdeaStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('@repo/queue', () => ({
  QUEUE_NAMES: { DEFAULT: 'ai-publishing-default' },
  JOB_NAMES: { PING: 'ping', ARTICLE_WRITING: 'article-writing' },
  getDefaultQueue: jest.fn(),
  closeQueues: jest.fn(),
}));

const { getDefaultQueue } = jest.requireMock('@repo/queue');

function createJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    name: 'ping',
    getState: jest.fn().mockResolvedValue('waiting'),
    retry: jest.fn().mockResolvedValue(undefined),
    progress: 0,
    attemptsMade: 0,
    failedReason: undefined,
    finishedOn: null,
    processedOn: null,
    returnvalue: null,
    data: { message: 'hello' },
    ...overrides,
  };
}

describe('JobsService', () => {
  let service: JobsService;
  const queue = {
    add: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn(),
  };
  const prisma = {
    articleIdea: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    getDefaultQueue.mockReturnValue(queue);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  it('enqueues ping jobs', async () => {
    queue.add.mockResolvedValue(createJob());

    const result = await service.enqueuePing('hello');

    expect(queue.add).toHaveBeenCalledWith('ping', { message: 'hello' });
    expect(result.id).toBe('job-1');
    expect(result.state).toBe('waiting');
  });

  it('throws when job is missing', async () => {
    queue.getJob.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retries failed jobs', async () => {
    const job = createJob({
      getState: jest.fn().mockResolvedValue('failed'),
      failedReason: 'boom',
    });
    queue.getJob.mockResolvedValue(job);

    const result = await service.retryJob('job-1');

    expect(job.retry).toHaveBeenCalled();
    expect(result.id).toBe('job-1');
  });

  it('rejects retry for non-failed jobs', async () => {
    queue.getJob.mockResolvedValue(
      createJob({
        getState: jest.fn().mockResolvedValue('completed'),
      }),
    );

    await expect(service.retryJob('job-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resets failed article ideas before retrying writing jobs', async () => {
    const job = createJob({
      name: 'article-writing',
      getState: jest.fn().mockResolvedValue('failed'),
      data: { ideaId: 'idea-1' },
    });
    queue.getJob.mockResolvedValue(job);
    prisma.articleIdea.findUnique.mockResolvedValue({
      id: 'idea-1',
      article: null,
    });
    prisma.articleIdea.update.mockResolvedValue({});

    await service.retryJob('job-1');

    expect(prisma.articleIdea.update).toHaveBeenCalledWith({
      where: { id: 'idea-1' },
      data: { status: ArticleIdeaStatus.GENERATING },
    });
    expect(job.retry).toHaveBeenCalled();
  });
});
