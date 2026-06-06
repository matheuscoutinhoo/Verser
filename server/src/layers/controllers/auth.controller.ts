import type { Request, Response } from 'express';
import { AUTH } from '@verser/shared';
import { UnauthorizedError } from '../../errors';
import { clearRefreshCookie, setRefreshCookie } from '../../utils/cookies';
import type { AuthService } from '../services/auth.service';

function getMeta(req: Request): { userAgent: string | null; ipAddress: string | null } {
  return {
    userAgent: req.get('user-agent') ?? null,
    ipAddress: req.ip ?? null,
  };
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body, getMeta(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      data: {
        user: result.user,
        tokens: { accessToken: result.accessToken, expiresIn: result.accessExpiresIn },
      },
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body, getMeta(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      data: {
        user: result.user,
        tokens: { accessToken: result.accessToken, expiresIn: result.accessExpiresIn },
      },
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.[AUTH.REFRESH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedError('Missing refresh token');
    }
    const result = await this.authService.refresh(token, getMeta(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      data: {
        user: result.user,
        tokens: { accessToken: result.accessToken, expiresIn: result.accessExpiresIn },
      },
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.[AUTH.REFRESH_COOKIE_NAME];
    await this.authService.logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  };

  listSessions = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const token = req.cookies?.[AUTH.REFRESH_COOKIE_NAME];
    const sessions = await this.authService.listSessions(req.user.id, token);
    res.status(200).json({ data: sessions });
  };

  revokeSession = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.authService.revokeSession(req.user.id, req.params.id as string);
    res.status(204).send();
  };
}
