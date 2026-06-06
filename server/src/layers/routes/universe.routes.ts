import { Router, type RequestHandler } from 'express';
import {
  createUniverseSchema,
  idParamSchema,
  paginationSchema,
  updateUniverseSchema,
} from '@verser/shared';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../middlewares/validate.middleware';
import type { UniverseController } from '../controllers/universe.controller';

export function createUniverseRouter(
  controller: UniverseController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/', validate(paginationSchema, 'query'), asyncHandler(controller.list));
  router.post('/', validate(createUniverseSchema), asyncHandler(controller.create));
  router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.detail));
  router.patch(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateUniverseSchema),
    asyncHandler(controller.update),
  );
  router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.delete));

  return router;
}
