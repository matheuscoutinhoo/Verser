import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../src/stores/auth.store';
import { authService } from '../../src/services/auth.service';

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
  },
  userService: {
    me: vi.fn(),
    update: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);

const FAKE_AUTH = {
  user: {
    id: 'u1',
    email: 'a@b.test',
    displayName: 'A',
    avatarUrl: null,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  tokens: { accessToken: 'tok', expiresIn: 900 },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      status: 'idle',
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('login success transitions to authenticated', async () => {
    mockedAuth.login.mockResolvedValue(FAKE_AUTH);
    await useAuthStore.getState().login({ email: 'a@b.test', password: 'StrongPass1!' });
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.email).toBe('a@b.test');
    expect(state.accessToken).toBe('tok');
  });

  it('login failure sets error state', async () => {
    mockedAuth.login.mockRejectedValue(new Error('bad creds'));
    await expect(
      useAuthStore.getState().login({ email: 'a@b.test', password: 'StrongPass1!' }),
    ).rejects.toThrow();
    expect(useAuthStore.getState().status).toBe('error');
    expect(useAuthStore.getState().error).toBe('bad creds');
  });

  it('bootstrap success authenticates', async () => {
    mockedAuth.refresh.mockResolvedValue(FAKE_AUTH);
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('bootstrap failure stays unauthenticated', async () => {
    mockedAuth.refresh.mockRejectedValue(new Error('no'));
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('logout always clears state even if request fails', async () => {
    useAuthStore.setState({ user: FAKE_AUTH.user, accessToken: 'tok', status: 'authenticated' });
    mockedAuth.logout.mockRejectedValue(new Error('boom'));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });
});
