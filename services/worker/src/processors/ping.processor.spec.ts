import type { Job } from 'bullmq';
import { processPingJob } from './ping.processor';

describe('processPingJob', () => {
  it('returns pong payload', async () => {
    const job = {
      data: { message: 'hello worker' },
    } as Job<{ message: string }>;

    const result = await processPingJob(job);

    expect(result.pong).toBe(true);
    expect(result.message).toBe('hello worker');
    expect(result.receivedAt).toEqual(expect.any(String));
  });
});
