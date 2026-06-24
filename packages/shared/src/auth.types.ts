export type UserRole = 'SUPER_ADMIN' | 'EDITOR' | 'VIEWER';

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

export interface AuthMeResponse {
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}
