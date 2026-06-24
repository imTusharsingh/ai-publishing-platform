import { ApiError, login } from '@/lib/api';

describe('admin api client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
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
});
