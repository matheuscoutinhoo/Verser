import { Router, type RequestHandler } from 'express';
import type { Container } from '../../container';
import { createUniverseAccessMiddleware } from '../middlewares/universe-access.middleware';
import { createAuthRouter } from './auth.routes';
import { createHealthRouter } from './health.routes';
import { createUniverseRouter } from './universe.routes';
import { createUniverseChildrenRouter } from './universe-children.routes';
import { createUserRouter } from './user.routes';

export function createApiRouter(container: Container, authenticate: RequestHandler): Router {
  const api = Router();
  const universeAccess = createUniverseAccessMiddleware(container.universeRepo);

  api.use('/health', createHealthRouter());
  api.use('/auth', createAuthRouter(container.authController, authenticate));
  api.use('/users', createUserRouter(container.userController, authenticate));
  api.use('/universes', createUniverseRouter(container.universeController, authenticate));
  api.use(
    '/universes/:universeId',
    createUniverseChildrenRouter(container, authenticate, universeAccess),
  );

  return api;
}
