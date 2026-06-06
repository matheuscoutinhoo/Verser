import { hashPassword, verifyPassword } from '../../../src/utils/password';

describe('password utils', () => {
  it('hashPassword produces a non-empty bcrypt hash', async () => {
    const hash = await hashPassword('StrongPass1!');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('StrongPass1!');
  });

  it('verifyPassword returns true for matching password', async () => {
    const hash = await hashPassword('StrongPass1!');
    await expect(verifyPassword('StrongPass1!', hash)).resolves.toBe(true);
  });

  it('verifyPassword returns false for non-matching password', async () => {
    const hash = await hashPassword('StrongPass1!');
    await expect(verifyPassword('WrongPass2@', hash)).resolves.toBe(false);
  });
});
