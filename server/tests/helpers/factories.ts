import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';
import { prisma } from '../../src/config/database';

// Fast hash for factories — the bcrypt 12-round flow is exercised in
// integration tests that hit the real /api/auth/register endpoint.
const FAST_BCRYPT_ROUNDS = 4;

export const DEFAULT_TEST_PASSWORD = 'StrongPass1!';

export interface CreateTestUserOptions {
  email?: string;
  password?: string;
  displayName?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface CreatedTestUser {
  user: User;
  password: string;
}

export async function createTestUser(
  options: CreateTestUserOptions = {},
): Promise<CreatedTestUser> {
  const email = options.email ?? `user_${randomBytes(4).toString('hex')}@test.local`;
  const password = options.password ?? DEFAULT_TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, FAST_BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: options.displayName ?? 'Test Writer',
      isActive: options.isActive ?? true,
      emailVerified: options.emailVerified ?? true,
    },
  });
  return { user, password };
}
