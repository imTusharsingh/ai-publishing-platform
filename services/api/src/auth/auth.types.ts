import type { AuthTokens, AuthUser, UserRole } from '@repo/shared';

export type { AuthTokens, AuthUser };

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type JwtExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}`;
