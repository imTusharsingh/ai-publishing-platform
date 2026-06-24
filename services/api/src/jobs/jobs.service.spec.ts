import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

jest.mock('@repo/queue', () => ({
  QUEUE_NAMES: { DEFAULT: 'ai-publishing-default' },
  JOB_NAMES: { PING: 'ping' },
  getDefaultQueue: jest.fn(),
  closeQueues: jest.fn(),
}));

const { getDefaultQueue } = jest.requireMock('@repo/queue');

describe('JobsService', () => {
  let service: JobsService;
  const queue = {
    add: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    getDefaultQueue.mockReturnValue(queue);

    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService],
    }).compile();

    service = module.get(JobsService);
  });

  it('enqueues ping jobs', async () => {
    queue.add.mockResolvedValue({
      id: 'job-1',
      name: 'ping',
      getState: jest.fn().mockResolvedValue('waiting'),
      progress: 0,
      attemptsMade: 0,
      failedReason: undefined,
      finishedOn: null,
      processedOn: null,
      returnvalue: null,
      data: { message: 'hello' },
    });

    const result = await service.enqueuePing('hello');

    expect(queue.add).toHaveBeenCalledWith('ping', { message: 'hello' });
    expect(result.id).toBe('job-1');
    expect(result.state).toBe('waiting');
  });

  it('throws when job is missing', async () => {
    queue.getJob.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
