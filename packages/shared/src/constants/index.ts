export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AUTH = {
  ACCESS_TOKEN_TTL_SECONDS: 15 * 60,
  REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60,
  BCRYPT_SALT_ROUNDS: 12,
  REFRESH_COOKIE_NAME: 'verser_refresh_token',
} as const;

export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
} as const;

export const RATE_LIMITS = {
  GENERAL_WINDOW_MS: 15 * 60 * 1000,
  GENERAL_MAX: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 5,
} as const;

export const LORE_IMPORTANCE = ['critical', 'high', 'normal', 'low'] as const;
export type LoreImportance = (typeof LORE_IMPORTANCE)[number];

export const WRITING_TYPE = ['project', 'part', 'chapter', 'scene', 'note'] as const;
export type WritingType = (typeof WRITING_TYPE)[number];

export const WRITING_STATUS = ['draft', 'revision', 'final'] as const;
export type WritingStatus = (typeof WRITING_STATUS)[number];

export const IMAGE_STYLE = ['2d', '3d', 'realistic', 'anime', 'pixel_art', 'concept_art'] as const;
export type ImageStyle = (typeof IMAGE_STYLE)[number];

export const AI_MODE = ['rewrite', 'expand', 'brainstorm', 'critique'] as const;
export type AIMode = (typeof AI_MODE)[number];

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REUSED: 'TOKEN_REUSED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
