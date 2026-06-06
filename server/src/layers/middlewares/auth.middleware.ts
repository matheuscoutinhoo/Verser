import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ERROR_CODES } from '@verser/shared';
import { UnauthorizedError } from '../../errors';
import type { TokenService } from '../services/token.service';
import type { UserRepository } from '../repositories/user.repository';

export function createAuthMiddleware(
  tokenService: TokenService,
  userRepo: UserRepository,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
      }

      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        throw new UnauthorizedError('Missing access token');
      }

      const payload = tokenService.verifyAccessToken(token);
      const user = await userRepo.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedError('User not found', ERROR_CODES.UNAUTHORIZED);
      }
      if (!user.isActive) {
        throw new UnauthorizedError('Account disabled', ERROR_CODES.ACCOUNT_DISABLED);
      }

      req.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
