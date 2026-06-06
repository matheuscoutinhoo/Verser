import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors';
import { clearRefreshCookie } from '../../utils/cookies';
import type { UserService } from '../services/user.service';
import type { UserStatsService } from '../services/user-stats.service';

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly statsService: UserStatsService,
  ) {}

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.userService.getById(req.user.id);
    res.status(200).json({ data: user });
  };

  stats = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const stats = await this.statsService.build(req.user.id);
    res.status(200).json({ data: stats });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ data: user });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.userService.changePassword(req.user.id, req.body);
    clearRefreshCookie(res);
    res.status(204).send();
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.userService.deleteAccount(req.user.id, req.body);
    clearRefreshCookie(res);
    res.status(204).send();
  };
}
