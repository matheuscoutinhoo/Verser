export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface JwtAccessPayload {
  sub: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  type: 'refresh';
  iat: number;
  exp: number;
}
