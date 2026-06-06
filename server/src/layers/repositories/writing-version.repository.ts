import type { Prisma, PrismaClient, WritingVersion } from '@prisma/client';

export class WritingVersionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByWriting(writingId: string): Promise<WritingVersion[]> {
    return this.prisma.writingVersion.findMany({
      where: { writingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.WritingVersionCreateInput): Promise<WritingVersion> {
    return this.prisma.writingVersion.create({ data });
  }

  findLatest(writingId: string): Promise<WritingVersion | null> {
    return this.prisma.writingVersion.findFirst({
      where: { writingId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
