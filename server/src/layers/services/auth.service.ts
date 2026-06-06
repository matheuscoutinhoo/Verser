import {
  ERROR_CODES,
  type AuthenticatedUser,
  type LoginInput,
  type RegisterInput,
  type SessionInfo,
} from '@verser/shared';
import { logger } from '../../config/logger';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../errors';
import { hashPassword, verifyPassword } from '../../utils/password';
import { hashToken } from '../../utils/token-hash';
import type { SessionRepository } from '../repositories/session.repository';
import type { UserRepository } from '../repositories/user.repository';
import type { TokenService } from './token.service';

export interface RequestMeta {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered', ERROR_CODES.EMAIL_TAKEN);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    logger.info({ userId: user.id, ip: meta.ipAddress }, 'auth.register.success');

    return this.issueSession(user, meta);
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      logger.warn({ email: input.email, ip: meta.ipAddress }, 'auth.login.unknown_email');
      throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id, ip: meta.ipAddress }, 'auth.login.disabled');
      throw new UnauthorizedError('Account disabled', ERROR_CODES.ACCOUNT_DISABLED);
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      logger.warn({ userId: user.id, ip: meta.ipAddress }, 'auth.login.bad_password');
      throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    logger.info({ userId: user.id, ip: meta.ipAddress }, 'auth.login.success');
    return this.issueSession(user, meta);
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
    const session = await this.sessionRepo.findById(payload.sid);

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID);
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expired', ERROR_CODES.TOKEN_EXPIRED);
    }

    const presentedHash = hashToken(rawRefreshToken);

    // Reuse detection: session revoked, or hash mismatch (already rotated).
    if (session.revokedAt !== null || session.refreshToken !== presentedHash) {
      const revokedCount = await this.sessionRepo.revokeAllForUser(session.userId);
      logger.warn(
        { userId: session.userId, sessionId: session.id, revokedCount, ip: meta.ipAddress },
        'auth.refresh.reuse_detected',
      );
      throw new UnauthorizedError(
        'Refresh token reuse detected. All sessions revoked.',
        ERROR_CODES.TOKEN_REUSED,
      );
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.isActive) {
      await this.sessionRepo.revokeById(session.id);
      throw new UnauthorizedError('Account not available', ERROR_CODES.ACCOUNT_DISABLED);
    }

    // Rotate: revoke old, issue new session + tokens.
    await this.sessionRepo.revokeById(session.id);
    return this.issueSession(user, meta);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
      const session = await this.sessionRepo.findById(payload.sid);
      if (session && session.revokedAt === null) {
        await this.sessionRepo.revokeById(session.id);
      }
    } catch {
      // Logout is idempotent — swallow invalid token errors.
    }
  }

  async listSessions(userId: string, currentRawRefreshToken?: string): Promise<SessionInfo[]> {
    const sessions = await this.sessionRepo.listActiveByUser(userId);
    const currentHash = currentRawRefreshToken ? hashToken(currentRawRefreshToken) : null;

    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      current: currentHash !== null && session.refreshToken === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Session');
    }
    if (session.revokedAt === null) {
      await this.sessionRepo.revokeById(session.id);
    }
  }

  private async issueSession(
    user: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      emailVerified: boolean;
      createdAt: Date;
    },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const access = this.tokenService.signAccessToken(user.id);
    // Create session row with placeholder token; then sign refresh with sessionId; then update row with hash.
    const placeholderHash = `pending-${user.id}-${Date.now()}-${Math.random()}`;
    const session = await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash: placeholderHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + 1000), // overwritten right below
    });

    const refresh = this.tokenService.signRefreshToken(user.id, session.id);
    const refreshHash = hashToken(refresh.token);

    await this.sessionRepo.updateRefreshToken(session.id, refreshHash, refresh.expiresAt);

    return {
      user: toAuthenticatedUser(user),
      accessToken: access.token,
      accessExpiresIn: access.expiresIn,
      refreshToken: refresh.token,
    };
  }
}
