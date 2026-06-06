import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors';
import { clearRefreshCookie } from '../../utils/cookies';
import type { UserService } from '../services/user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.userService.getById(req.user.id);
    res.status(200).json({ data: user });
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
