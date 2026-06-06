import { hashToken } from '../../../src/utils/token-hash';

describe('hashToken', () => {
  it('produces a deterministic 64-char hex digest', () => {
    const hash = hashToken('any-token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns the same digest for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('returns different digests for different inputs', () => {
    expect(hashToken('abc')).not.toBe(hashToken('xyz'));
  });
});
