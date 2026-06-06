import type { Prisma, PrismaClient, UniverseTag } from '@prisma/client';

export class UniverseTagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<UniverseTag | null> {
    return this.prisma.universeTag.findUnique({ where: { id } });
  }

  listByUniverse(universeId: string): Promise<UniverseTag[]> {
    return this.prisma.universeTag.findMany({
      where: { universeId },
      orderBy: { name: 'asc' },
    });
  }

  findByName(universeId: string, name: string): Promise<UniverseTag | null> {
    return this.prisma.universeTag.findUnique({
      where: { universeId_name: { universeId, name } },
    });
  }

  create(data: Prisma.UniverseTagCreateInput): Promise<UniverseTag> {
    return this.prisma.universeTag.create({ data });
  }

  delete(id: string): Promise<UniverseTag> {
    return this.prisma.universeTag.delete({ where: { id } });
  }
}
