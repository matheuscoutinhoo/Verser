import { Router, type RequestHandler } from 'express';
import { idParamSchema, loginSchema, registerSchema } from '@verser/shared';
import type { AuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';

export function createAuthRouter(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();

  router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    asyncHandler(controller.register),
  );

  router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    asyncHandler(controller.login),
  );

  router.post('/refresh', asyncHandler(controller.refresh));

  router.post('/logout', asyncHandler(controller.logout));

  router.get('/sessions', authenticate, asyncHandler(controller.listSessions));

  router.delete(
    '/sessions/:id',
    authenticate,
    validate(idParamSchema, 'params'),
    asyncHandler(controller.revokeSession),
  );

  return router;
}
