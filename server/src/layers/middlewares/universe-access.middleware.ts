import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Universe } from '@prisma/client';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../errors';
import type { UniverseRepository } from '../repositories/universe.repository';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      universe?: Universe;
    }
  }
}

/**
 * Resolves :universeId from the route, verifies it exists and is owned by the
 * authenticated user, then attaches the universe row to `req.universe`.
 * Apply after the auth middleware on any route nested under /universes/:universeId.
 */
export function createUniverseAccessMiddleware(universeRepo: UniverseRepository): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const universeId = req.params.universeId ?? req.params.id;
      if (!universeId) throw new NotFoundError('Universe');

      const universe = await universeRepo.findById(universeId);
      if (!universe) throw new NotFoundError('Universe');
      if (universe.userId !== req.user.id) {
        // 404 instead of 403 to avoid leaking existence of other users' resources.
        throw new NotFoundError('Universe');
      }
      req.universe = universe;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export { ForbiddenError };
