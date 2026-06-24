import { QUEUE_NAMES, JOB_NAMES } from './types';

describe('queue registry', () => {
  it('exports stable queue and job names', () => {
    expect(QUEUE_NAMES.DEFAULT).toBe('ai-publishing-default');
    expect(JOB_NAMES.PING).toBe('ping');
  });
});
