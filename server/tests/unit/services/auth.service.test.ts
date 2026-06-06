import bcrypt from 'bcryptjs';
import { AuthService } from '../../../src/layers/services/auth.service';
import { TokenService } from '../../../src/layers/services/token.service';
import { AppError } from '../../../src/errors';
import { hashToken } from '../../../src/utils/token-hash';
import {
  buildSession,
  buildUser,
  createMockSessionRepo,
  createMockUserRepo,
} from '../../helpers/mocks';

const META = { userAgent: 'jest', ipAddress: '127.0.0.1' };

function buildService() {
  const userRepo = createMockUserRepo();
  const sessionRepo = createMockSessionRepo();
  const tokenService = new TokenService(
    'access-secret-with-sufficient-length-aaaaaaaaaaaaaaaaaaaaaaaa',
    'refresh-secret-with-sufficient-length-bbbbbbbbbbbbbbbbbbbbbbb',
    '15m',
    '7d',
  );
  const service = new AuthService(
    userRepo as unknown as ConstructorParameters<typeof AuthService>[0],
    sessionRepo as unknown as ConstructorParameters<typeof AuthService>[1],
    tokenService,
  );
  return { service, userRepo, sessionRepo, tokenService };
}

describe('AuthService.register', () => {
  it('creates a user and issues tokens on success', async () => {
    const { service, userRepo, sessionRepo } = buildService();
    userRepo.findByEmail.mockResolvedValue(null);
    const created = buildUser({ email: 'a@b.test' });
    userRepo.create.mockResolvedValue(created);
    sessionRepo.create.mockResolvedValue(buildSession({ id: 'sess_1', userId: created.id }));
    sessionRepo.updateRefreshToken.mockResolvedValue();

    const result = await service.register(
      { email: 'a@b.test', password: 'StrongPass1!', displayName: 'A' },
      META,
    );

    expect(userRepo.create).toHaveBeenCalled();
    expect(sessionRepo.create).toHaveBeenCalled();
    expect(sessionRepo.updateRefreshToken).toHaveBeenCalled();
    expect(result.user.email).toBe('a@b.test');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it('throws CONFLICT when email already registered', async () => {
    const { service, userRepo } = buildService();
    userRepo.findByEmail.mockResolvedValue(buildUser());

    await expect(
      service.register(
        { email: 'a@b.test', password: 'StrongPass1!', displayName: 'A' },
        META,
      ),
    ).rejects.toThrow(AppError);
  });
});

describe('AuthService.login', () => {
  it('issues tokens on valid credentials', async () => {
    const { service, userRepo, sessionRepo } = buildService();
    const passwordHash = await bcrypt.hash('StrongPass1!', 4);
    const user = buildUser({ passwordHash });
    userRepo.findByEmail.mockResolvedValue(user);
    sessionRepo.create.mockResolvedValue(buildSession({ id: 'sess_1', userId: user.id }));
    sessionRepo.updateRefreshToken.mockResolvedValue();

    const result = await service.login(
      { email: user.email, password: 'StrongPass1!' },
      META,
    );

    expect(result.accessToken).toEqual(expect.any(String));
  });

  it('throws UNAUTHORIZED for unknown email', async () => {
    const { service, userRepo } = buildService();
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@y.test', password: 'StrongPass1!' }, META),
    ).rejects.toThrow(AppError);
  });

  it('throws UNAUTHORIZED for wrong password', async () => {
    const { service, userRepo } = buildService();
    const passwordHash = await bcrypt.hash('StrongPass1!', 4);
    userRepo.findByEmail.mockResolvedValue(buildUser({ passwordHash }));
    await expect(
      service.login({ email: 'a@b.test', password: 'WrongPass2@' }, META),
    ).rejects.toThrow(AppError);
  });

  it('throws UNAUTHORIZED for disabled account', async () => {
    const { service, userRepo } = buildService();
    const passwordHash = await bcrypt.hash('StrongPass1!', 4);
    userRepo.findByEmail.mockResolvedValue(buildUser({ passwordHash, isActive: false }));
    await expect(
      service.login({ email: 'a@b.test', password: 'StrongPass1!' }, META),
    ).rejects.toThrow(AppError);
  });
});

describe('AuthService.refresh', () => {
  it('rotates the session on a valid current token', async () => {
    const { service, userRepo, sessionRepo, tokenService } = buildService();
    const user = buildUser();
    const session = buildSession({ id: 'sess_1', userId: user.id });
    const { token } = tokenService.signRefreshToken(user.id, session.id);
    session.refreshToken = hashToken(token);

    sessionRepo.findById.mockResolvedValueOnce(session);
    userRepo.findById.mockResolvedValueOnce(user);
    sessionRepo.revokeById.mockResolvedValue();
    sessionRepo.create.mockResolvedValue(buildSession({ id: 'sess_2', userId: user.id }));
    sessionRepo.updateRefreshToken.mockResolvedValue();

    const result = await service.refresh(token, META);

    expect(sessionRepo.revokeById).toHaveBeenCalledWith('sess_1');
    expect(sessionRepo.create).toHaveBeenCalled();
    expect(result.accessToken).toEqual(expect.any(String));
  });

  it('detects reuse when hash does not match (already rotated)', async () => {
    const { service, sessionRepo, tokenService } = buildService();
    const user = buildUser();
    const session = buildSession({
      id: 'sess_1',
      userId: user.id,
      refreshToken: 'different-hash',
      revokedAt: new Date(),
    });
    const { token } = tokenService.signRefreshToken(user.id, session.id);

    sessionRepo.findById.mockResolvedValueOnce(session);
    sessionRepo.revokeAllForUser.mockResolvedValue(3);

    await expect(service.refresh(token, META)).rejects.toThrow(AppError);
    expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith(user.id);
  });

  it('rejects when session not found', async () => {
    const { service, sessionRepo, tokenService } = buildService();
    const { token } = tokenService.signRefreshToken('user_1', 'sess_gone');
    sessionRepo.findById.mockResolvedValueOnce(null);
    await expect(service.refresh(token, META)).rejects.toThrow(AppError);
  });

  it('rejects when session is expired even if hash matches', async () => {
    const { service, sessionRepo, tokenService } = buildService();
    const user = buildUser();
    const session = buildSession({
      id: 'sess_1',
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const { token } = tokenService.signRefreshToken(user.id, session.id);
    session.refreshToken = hashToken(token);
    sessionRepo.findById.mockResolvedValueOnce(session);

    await expect(service.refresh(token, META)).rejects.toThrow(AppError);
  });
});

describe('AuthService.logout', () => {
  it('is idempotent for invalid tokens', async () => {
    const { service } = buildService();
    await expect(service.logout('not-a-jwt')).resolves.toBeUndefined();
    await expect(service.logout(undefined)).resolves.toBeUndefined();
  });

  it('revokes a valid active session', async () => {
    const { service, sessionRepo, tokenService } = buildService();
    const user = buildUser();
    const session = buildSession({ id: 'sess_1', userId: user.id });
    const { token } = tokenService.signRefreshToken(user.id, session.id);
    sessionRepo.findById.mockResolvedValueOnce(session);
    sessionRepo.revokeById.mockResolvedValue();

    await service.logout(token);
    expect(sessionRepo.revokeById).toHaveBeenCalledWith('sess_1');
  });
});

describe('AuthService.listSessions / revokeSession', () => {
  it('lists and marks the current session', async () => {
    const { service, sessionRepo, tokenService } = buildService();
    const user = buildUser();
    const session = buildSession({ id: 'sess_1', userId: user.id });
    const { token } = tokenService.signRefreshToken(user.id, session.id);
    session.refreshToken = hashToken(token);
    sessionRepo.listActiveByUser.mockResolvedValue([session]);

    const sessions = await service.listSessions(user.id, token);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.current).toBe(true);
  });

  it('throws NotFound when revoking unknown session', async () => {
    const { service, sessionRepo } = buildService();
    sessionRepo.findById.mockResolvedValue(null);
    await expect(service.revokeSession('user_1', 'sess_x')).rejects.toThrow(AppError);
  });

  it('throws NotFound when revoking other user session', async () => {
    const { service, sessionRepo } = buildService();
    sessionRepo.findById.mockResolvedValue(buildSession({ userId: 'other_user' }));
    await expect(service.revokeSession('user_1', 'sess_x')).rejects.toThrow(AppError);
  });
});
