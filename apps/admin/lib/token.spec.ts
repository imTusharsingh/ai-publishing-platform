import { isAccessTokenExpired } from '@/lib/token';

describe('isAccessTokenExpired', () => {
  function makeToken(exp: number) {
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64');
    return `header.${payload}.sig`;
  }

  it('returns true for expired token', () => {
    const token = makeToken(Math.floor(Date.now() / 1000) - 120);
    expect(isAccessTokenExpired(token)).toBe(true);
  });

  it('returns false for valid token', () => {
    const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
    expect(isAccessTokenExpired(token)).toBe(false);
  });
});
