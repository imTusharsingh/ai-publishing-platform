import { APP_NAME, formatApiVersion } from './index';

describe('shared utilities', () => {
  it('exports app name', () => {
    expect(APP_NAME).toBe('AI Publishing Platform');
  });

  it('formats api version', () => {
    expect(formatApiVersion('1')).toBe('v1');
  });
});
