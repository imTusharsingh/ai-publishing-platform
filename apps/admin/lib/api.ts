import type { AuthMeResponse, AuthTokens, LoginRequest } from '@repo/shared';

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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : `API request failed: ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return body as T;
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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  return parseResponse<T>(response);
}
