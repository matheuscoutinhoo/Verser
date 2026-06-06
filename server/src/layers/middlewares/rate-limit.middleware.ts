import rateLimit, { type Options } from 'express-rate-limit';
import { ERROR_CODES } from '@verser/shared';
import { env, isTest } from '../../config/env';

function buildLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests. Please try again later.' },
      });
    },
    ...overrides,
  });
}

export const generalRateLimiter = buildLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
});

export const authRateLimiter = buildLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
});
