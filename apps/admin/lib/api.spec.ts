import { ApiError, authFetch, login, refreshSession } from '@/lib/api';
import { isAccessTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

describe('admin api client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  it('login returns tokens on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: '15m',
        tokenType: 'Bearer',
        user: { id: '1', email: 'admin@example.com', role: 'SUPER_ADMIN' },
      }),
    });

    const result = await login({ email: 'admin@example.com', password: 'Admin123!' });

    expect(result.accessToken).toBe('access');
    expect(result.user.email).toBe('admin@example.com');
  });

  it('login throws ApiError on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(login({ email: 'bad@example.com', password: 'wrong' })).rejects.toThrow(ApiError);
  });

  it('authFetch refreshes expired access token before request', async () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }),
    ).toString('base64');
    const expiredToken = `header.${expiredPayload}.sig`;

    (useAuthStore.getState as jest.Mock).mockReturnValue({
      refreshToken: 'refresh-token',
      setSession: jest.fn(),
      clearSession: jest.fn(),
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: '15m',
          tokenType: 'Bearer',
          user: { id: '1', email: 'admin@example.com', role: 'SUPER_ADMIN' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

    expect(isAccessTokenExpired(expiredToken)).toBe(true);

    const result = await authFetch<{ data: unknown[] }>('/v1/article-ideas', expiredToken);

    expect(result.data).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:3008/v1/article-ideas',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-access',
        }),
      }),
    );
  });

  it('refreshSession updates auth store', async () => {
    const setSession = jest.fn();
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      refreshToken: 'refresh-token',
      setSession,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: '15m',
        tokenType: 'Bearer',
        user: { id: '1', email: 'admin@example.com', role: 'SUPER_ADMIN' },
      }),
    });

    const tokens = await refreshSession();

    expect(tokens.accessToken).toBe('new-access');
    expect(setSession).toHaveBeenCalledWith(tokens);
  });
});
