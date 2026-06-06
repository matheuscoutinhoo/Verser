import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@verser/shared';
import { logger } from '../../config/logger';
import { isProduction } from '../../config/env';
import { AppError } from '../../errors';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      });
      return;
    }
  }

  logger.error(
    { err, path: req.path, method: req.method, requestId: req.requestId },
    'Unhandled error',
  );

  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: isProduction
        ? 'An unexpected error occurred'
        : (err instanceof Error ? err.message : 'An unexpected error occurred'),
    },
  });
};
