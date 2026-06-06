import type { PrismaClient, Session } from '@prisma/client';

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshToken: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  findByRefreshTokenHash(hash: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { refreshToken: hash } });
  }

  listActiveByUser(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeById(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async updateRefreshToken(id: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { refreshToken: refreshTokenHash, expiresAt },
    });
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }
}
