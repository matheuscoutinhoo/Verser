import bcrypt from 'bcryptjs';
import { UserService } from '../../../src/layers/services/user.service';
import { AppError } from '../../../src/errors';
import { buildUser, createMockSessionRepo, createMockUserRepo } from '../../helpers/mocks';

function buildService() {
  const userRepo = createMockUserRepo();
  const sessionRepo = createMockSessionRepo();
  const service = new UserService(
    userRepo as unknown as ConstructorParameters<typeof UserService>[0],
    sessionRepo as unknown as ConstructorParameters<typeof UserService>[1],
  );
  return { service, userRepo, sessionRepo };
}

describe('UserService.getById', () => {
  it('returns the user when found', async () => {
    const { service, userRepo } = buildService();
    userRepo.findById.mockResolvedValue(buildUser({ id: 'u1', email: 'me@x.test' }));
    const user = await service.getById('u1');
    expect(user.email).toBe('me@x.test');
  });

  it('throws NotFound when missing', async () => {
    const { service, userRepo } = buildService();
    userRepo.findById.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(AppError);
  });
});

describe('UserService.updateProfile', () => {
  it('updates only provided fields', async () => {
    const { service, userRepo } = buildService();
    const existing = buildUser({ id: 'u1', displayName: 'old' });
    userRepo.findById.mockResolvedValue(existing);
    userRepo.update.mockResolvedValue({ ...existing, displayName: 'new' });

    await service.updateProfile('u1', { displayName: 'new' });
    expect(userRepo.update).toHaveBeenCalledWith('u1', { displayName: 'new' });
  });
});

describe('UserService.changePassword', () => {
  it('updates hash and revokes all sessions on correct current password', async () => {
    const { service, userRepo, sessionRepo } = buildService();
    const passwordHash = await bcrypt.hash('OldPass1!', 4);
    userRepo.findById.mockResolvedValue(buildUser({ id: 'u1', passwordHash }));
    userRepo.update.mockResolvedValue(buildUser({ id: 'u1' }));
    sessionRepo.revokeAllForUser.mockResolvedValue(2);

    await service.changePassword('u1', {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2@',
    });

    expect(userRepo.update).toHaveBeenCalled();
    expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('throws Forbidden on wrong current password', async () => {
    const { service, userRepo } = buildService();
    const passwordHash = await bcrypt.hash('OldPass1!', 4);
    userRepo.findById.mockResolvedValue(buildUser({ passwordHash }));
    await expect(
      service.changePassword('u1', {
        currentPassword: 'NotIt1!',
        newPassword: 'NewPass2@',
      }),
    ).rejects.toThrow(AppError);
  });
});

describe('UserService.deleteAccount', () => {
  it('soft-deletes and revokes sessions on correct password', async () => {
    const { service, userRepo, sessionRepo } = buildService();
    const passwordHash = await bcrypt.hash('OldPass1!', 4);
    userRepo.findById.mockResolvedValue(buildUser({ id: 'u1', passwordHash }));
    userRepo.softDelete.mockResolvedValue(buildUser({ id: 'u1', isActive: false }));
    sessionRepo.revokeAllForUser.mockResolvedValue(1);

    await service.deleteAccount('u1', { password: 'OldPass1!' });
    expect(userRepo.softDelete).toHaveBeenCalledWith('u1');
    expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('throws Forbidden if already inactive', async () => {
    const { service, userRepo } = buildService();
    const passwordHash = await bcrypt.hash('OldPass1!', 4);
    userRepo.findById.mockResolvedValue(buildUser({ passwordHash, isActive: false }));
    await expect(
      service.deleteAccount('u1', { password: 'OldPass1!' }),
    ).rejects.toThrow(AppError);
  });
});

describe('UserService.ensureOwnership', () => {
  it('passes when ids match', () => {
    const { service } = buildService();
    expect(() => service.ensureOwnership('u1', 'u1')).not.toThrow();
  });

  it('throws Forbidden when ids differ', () => {
    const { service } = buildService();
    expect(() => service.ensureOwnership('u1', 'u2')).toThrow(AppError);
  });
});
