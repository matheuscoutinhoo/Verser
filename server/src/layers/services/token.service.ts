import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { ERROR_CODES, AUTH, type JwtAccessPayload, type JwtRefreshPayload } from '@verser/shared';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../errors';

export interface SignedAccessToken {
  token: string;
  expiresIn: number;
}

export interface SignedRefreshToken {
  token: string;
  expiresAt: Date;
}

export class TokenService {
  constructor(
    private readonly accessSecret: Secret = env.JWT_ACCESS_SECRET,
    private readonly refreshSecret: Secret = env.JWT_REFRESH_SECRET,
    private readonly accessExpiration: string = env.JWT_ACCESS_EXPIRATION,
    private readonly refreshExpiration: string = env.JWT_REFRESH_EXPIRATION,
  ) {}

  signAccessToken(userId: string): SignedAccessToken {
    const options: SignOptions = { expiresIn: this.accessExpiration as SignOptions['expiresIn'] };
    const token = jwt.sign({ type: 'access' }, this.accessSecret, {
      ...options,
      subject: userId,
    });
    return { token, expiresIn: AUTH.ACCESS_TOKEN_TTL_SECONDS };
  }

  signRefreshToken(userId: string, sessionId: string): SignedRefreshToken {
    const options: SignOptions = { expiresIn: this.refreshExpiration as SignOptions['expiresIn'] };
    const token = jwt.sign({ type: 'refresh', sid: sessionId }, this.refreshSecret, {
      ...options,
      subject: userId,
    });
    const decoded = jwt.decode(token);
    if (typeof decoded !== 'object' || decoded === null || typeof decoded.exp !== 'number') {
      throw new Error('Failed to decode signed refresh token');
    }
    return { token, expiresAt: new Date(decoded.exp * 1000) };
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    try {
      const payload = jwt.verify(token, this.accessSecret) as JwtAccessPayload;
      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
      }
      return payload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token', ERROR_CODES.TOKEN_INVALID);
      }
      throw err;
    }
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as JwtRefreshPayload;
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
      }
      return payload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID);
      }
      throw err;
    }
  }
}
