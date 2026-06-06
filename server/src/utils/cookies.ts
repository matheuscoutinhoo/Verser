import type { CookieOptions, Response } from 'express';
import { AUTH } from '@verser/shared';
import { env, isProduction } from '../config/env';

export function buildRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProduction,
    sameSite: 'strict',
    maxAge: AUTH.REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: '/api/auth',
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(AUTH.REFRESH_COOKIE_NAME, token, buildRefreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(AUTH.REFRESH_COOKIE_NAME, {
    ...buildRefreshCookieOptions(),
    maxAge: 0,
  });
}
