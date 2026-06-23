import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
  user: AuthUser;
}

export type JwtExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}`;
