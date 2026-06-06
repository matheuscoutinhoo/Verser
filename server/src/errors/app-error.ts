import { ERROR_CODES, type ErrorCode } from '@verser/shared';

export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode | string,
    message: string,
    public readonly details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, ERROR_CODES.NOT_FOUND, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.CONFLICT) {
    super(409, code, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(429, ERROR_CODES.RATE_LIMITED, message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(500, ERROR_CODES.INTERNAL_ERROR, message, undefined, false);
  }
}
