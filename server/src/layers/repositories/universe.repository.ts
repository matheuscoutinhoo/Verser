import type { Prisma, PrismaClient, Universe } from '@prisma/client';

export interface ListUniverseParams {
  userId: string;
  skip: number;
  take: number;
  search?: string;
  order: 'asc' | 'desc';
}

export class UniverseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Universe | null> {
    return this.prisma.universe.findUnique({ where: { id } });
  }

  async listForUser(params: ListUniverseParams): Promise<{ items: Universe[]; total: number }> {
    const where: Prisma.UniverseWhereInput = {
      userId: params.userId,
      ...(params.search
        ? { name: { contains: params.search } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.universe.findMany({
        where,
        orderBy: { createdAt: params.order },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.universe.count({ where }),
    ]);
    return { items, total };
  }

  create(data: Prisma.UniverseCreateInput): Promise<Universe> {
    return this.prisma.universe.create({ data });
  }

  update(id: string, data: Prisma.UniverseUpdateInput): Promise<Universe> {
    return this.prisma.universe.update({ where: { id }, data });
  }

  delete(id: string): Promise<Universe> {
    return this.prisma.universe.delete({ where: { id } });
  }

  async countsFor(universeId: string): Promise<{
    characters: number;
    locations: number;
    systems: number;
    loreEntries: number;
    immutableLaws: number;
    timelineEvents: number;
    tags: number;
    writings: number;
  }> {
    const [
      characters,
      locations,
      systems,
      loreEntries,
      immutableLaws,
      timelineEvents,
      tags,
      writings,
    ] = await Promise.all([
      this.prisma.character.count({ where: { universeId } }),
      this.prisma.location.count({ where: { universeId } }),
      this.prisma.worldSystem.count({ where: { universeId } }),
      this.prisma.loreEntry.count({ where: { universeId } }),
      this.prisma.immutableLaw.count({ where: { universeId } }),
      this.prisma.timelineEvent.count({ where: { universeId } }),
      this.prisma.universeTag.count({ where: { universeId } }),
      this.prisma.writing.count({ where: { universeId } }),
    ]);
    return {
      characters,
      locations,
      systems,
      loreEntries,
      immutableLaws,
      timelineEvents,
      tags,
      writings,
    };
  }
}
