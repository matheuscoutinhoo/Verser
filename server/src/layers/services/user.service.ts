import {
  ERROR_CODES,
  type AuthenticatedUser,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type UpdateProfileInput,
} from '@verser/shared';
import { ForbiddenError, NotFoundError } from '../../errors';
import { hashPassword, verifyPassword } from '../../utils/password';
import type { SessionRepository } from '../repositories/session.repository';
import type { UserRepository } from '../repositories/user.repository';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async getById(id: string): Promise<AuthenticatedUser> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<AuthenticatedUser> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');

    const updated = await this.userRepo.update(id, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async changePassword(id: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new ForbiddenError('Current password is incorrect');
    }

    const newHash = await hashPassword(input.newPassword);
    await this.userRepo.update(id, { passwordHash: newHash });
    await this.sessionRepo.revokeAllForUser(id);
  }

  async deleteAccount(id: string, input: DeleteAccountInput): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new ForbiddenError('Password is incorrect');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account is already disabled');
    }

    await this.userRepo.softDelete(id);
    await this.sessionRepo.revokeAllForUser(id);
  }

  ensureOwnership(resourceUserId: string, requestUserId: string): void {
    if (resourceUserId !== requestUserId) {
      throw new ForbiddenError('You do not have access to this resource');
    }
  }

  /** Re-export of error code for callers that need it without a circular import. */
  static readonly ERROR_CODES = ERROR_CODES;
}
