import { ADMIN_APP_NAME, PUBLIC_APP_NAME, formatApiVersion } from './index';

describe('shared utilities', () => {
  it('exports app name', () => {
    expect(PUBLIC_APP_NAME).toBe('AuraNews');
    expect(ADMIN_APP_NAME).toBe('Aura Admin');
  });

  it('formats api version', () => {
    expect(formatApiVersion('1')).toBe('v1');
  });
});
