import type { Session, User } from '@prisma/client';
import type { SessionRepository } from '../../src/layers/repositories/session.repository';
import type { UserRepository } from '../../src/layers/repositories/user.repository';

type Mocked<T> = { [K in keyof T]: T[K] extends (...args: infer A) => infer R ? jest.Mock<R, A> : T[K] };

export function createMockUserRepo(): Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as Mocked<UserRepository>;
}

export function createMockSessionRepo(): Mocked<SessionRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    listActiveByUser: jest.fn(),
    revokeById: jest.fn(),
    revokeAllForUser: jest.fn(),
    updateRefreshToken: jest.fn(),
  } as unknown as Mocked<SessionRepository>;
}

export function buildUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'cuser_' + Math.random().toString(36).slice(2, 10),
    email: 'user@test.local',
    passwordHash: 'irrelevant',
    displayName: 'Test User',
    avatarUrl: null,
    isActive: true,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function buildSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 'csess_' + Math.random().toString(36).slice(2, 10),
    userId: 'cuser_x',
    refreshToken: 'hashed-token',
    userAgent: 'jest',
    ipAddress: '127.0.0.1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    createdAt: now,
    ...overrides,
  };
}
