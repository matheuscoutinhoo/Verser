import jwt from 'jsonwebtoken';
import { TokenService } from '../../../src/layers/services/token.service';
import { AppError } from '../../../src/errors';

describe('TokenService', () => {
  const ACCESS_SECRET = 'access-secret-with-sufficient-length-to-pass-validation-aaaa';
  const REFRESH_SECRET = 'refresh-secret-with-sufficient-length-to-pass-validation-bbbb';

  let service: TokenService;

  beforeEach(() => {
    service = new TokenService(ACCESS_SECRET, REFRESH_SECRET, '15m', '7d');
  });

  describe('signAccessToken', () => {
    it('produces a verifiable JWT with the correct subject and type', () => {
      const { token, expiresIn } = service.signAccessToken('user_1');
      expect(typeof token).toBe('string');
      expect(expiresIn).toBe(15 * 60);

      const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string; type: string };
      expect(payload.sub).toBe('user_1');
      expect(payload.type).toBe('access');
    });
  });

  describe('signRefreshToken', () => {
    it('produces a verifiable JWT with subject, sid, type and future expiry', () => {
      const { token, expiresAt } = service.signRefreshToken('user_1', 'sess_1');
      const payload = jwt.verify(token, REFRESH_SECRET) as {
        sub: string;
        sid: string;
        type: string;
        exp: number;
      };
      expect(payload.sub).toBe('user_1');
      expect(payload.sid).toBe('sess_1');
      expect(payload.type).toBe('refresh');
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(payload.exp * 1000).toBe(expiresAt.getTime());
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload for a valid token', () => {
      const { token } = service.signAccessToken('user_42');
      const payload = service.verifyAccessToken(token);
      expect(payload.sub).toBe('user_42');
      expect(payload.type).toBe('access');
    });

    it('throws AppError(TOKEN_INVALID) for a tampered token', () => {
      const { token } = service.signAccessToken('user_42');
      const tampered = token.slice(0, -2) + 'xx';
      expect(() => service.verifyAccessToken(tampered)).toThrow(AppError);
    });

    it('throws AppError(TOKEN_EXPIRED) for an expired token', () => {
      const shortLived = new TokenService(ACCESS_SECRET, REFRESH_SECRET, '-1s', '7d');
      const { token } = shortLived.signAccessToken('user_42');
      expect(() => shortLived.verifyAccessToken(token)).toThrow(AppError);
    });

    it('rejects a refresh token presented as access', () => {
      const { token } = service.signRefreshToken('user_42', 'sess_1');
      expect(() => service.verifyAccessToken(token)).toThrow(AppError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns the payload for a valid refresh token', () => {
      const { token } = service.signRefreshToken('user_42', 'sess_1');
      const payload = service.verifyRefreshToken(token);
      expect(payload.sub).toBe('user_42');
      expect(payload.sid).toBe('sess_1');
      expect(payload.type).toBe('refresh');
    });

    it('rejects an access token presented as refresh', () => {
      const { token } = service.signAccessToken('user_42');
      expect(() => service.verifyRefreshToken(token)).toThrow(AppError);
    });
  });
});
