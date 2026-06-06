import type { LoreEntry, Prisma, PrismaClient } from '@prisma/client';

export interface ListLoreParams {
  universeId: string;
  skip: number;
  take: number;
  search?: string;
  category?: string;
  importance?: string;
  order: 'asc' | 'desc';
}

export class LoreEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<LoreEntry | null> {
    return this.prisma.loreEntry.findUnique({ where: { id } });
  }

  async listByUniverse(params: ListLoreParams): Promise<{ items: LoreEntry[]; total: number }> {
    const where: Prisma.LoreEntryWhereInput = {
      universeId: params.universeId,
      ...(params.category ? { category: params.category } : {}),
      ...(params.importance ? { importance: params.importance } : {}),
      ...(params.search ? { title: { contains: params.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.loreEntry.findMany({
        where,
        orderBy: { createdAt: params.order },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.loreEntry.count({ where }),
    ]);
    return { items, total };
  }

  findByImportance(universeId: string, levels: string[]): Promise<LoreEntry[]> {
    return this.prisma.loreEntry.findMany({
      where: { universeId, importance: { in: levels } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: Prisma.LoreEntryCreateInput): Promise<LoreEntry> {
    return this.prisma.loreEntry.create({ data });
  }

  update(id: string, data: Prisma.LoreEntryUpdateInput): Promise<LoreEntry> {
    return this.prisma.loreEntry.update({ where: { id }, data });
  }

  delete(id: string): Promise<LoreEntry> {
    return this.prisma.loreEntry.delete({ where: { id } });
  }
}
