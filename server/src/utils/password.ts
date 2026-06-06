import bcrypt from 'bcryptjs';
import { AUTH } from '@verser/shared';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, AUTH.BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
