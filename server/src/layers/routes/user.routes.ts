import { Router, type RequestHandler } from 'express';
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from '@verser/shared';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../middlewares/validate.middleware';
import type { UserController } from '../controllers/user.controller';

export function createUserRouter(controller: UserController, authenticate: RequestHandler): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/me', asyncHandler(controller.me));
  router.patch('/me', validate(updateProfileSchema), asyncHandler(controller.updateProfile));
  router.patch(
    '/me/password',
    validate(changePasswordSchema),
    asyncHandler(controller.changePassword),
  );
  router.delete('/me', validate(deleteAccountSchema), asyncHandler(controller.deleteAccount));

  return router;
}
