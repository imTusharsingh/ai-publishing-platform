import type { AuthMeResponse, AuthTokens, LoginRequest } from '@repo/shared';
import { useAuthStore } from '@/stores/auth-store';
import { isAccessTokenExpired } from '@/lib/token';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3008';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<AuthTokens> | null = null;

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.message === 'string' ? body.message : `API request failed: ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export async function refreshSession(): Promise<AuthTokens> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!refreshPromise) {
    refreshPromise = refresh(refreshToken)
      .then((tokens) => {
        useAuthStore.getState().setSession(tokens);
        return tokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function login(payload: LoginRequest): Promise<AuthTokens> {
  return fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((response) => parseResponse<AuthTokens>(response));
}

export function refresh(refreshToken: string): Promise<AuthTokens> {
  return fetch(`${API_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((response) => parseResponse<AuthTokens>(response));
}

export function logout(refreshToken: string): Promise<void> {
  return fetch(`${API_URL}/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((response) => parseResponse<void>(response));
}

export function getMe(accessToken: string): Promise<AuthMeResponse> {
  return fetch(`${API_URL}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => parseResponse<AuthMeResponse>(response));
}

export async function authFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const request = (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });

  let token = accessToken;
  if (isAccessTokenExpired(token)) {
    token = (await refreshSession()).accessToken;
  }

  let response = await request(token);

  if (response.status === 401) {
    try {
      token = (await refreshSession()).accessToken;
      response = await request(token);
    } catch (error) {
      useAuthStore.getState().clearSession();
      throw error;
    }
  }

  return parseResponse<T>(response);
}
