import type { Prisma, PrismaClient, Writing } from '@prisma/client';

export class WritingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Writing | null> {
    return this.prisma.writing.findUnique({ where: { id } });
  }

  /** Returns ALL writings of the universe, ordered for tree assembly. */
  listByUniverse(universeId: string): Promise<Writing[]> {
    return this.prisma.writing.findMany({
      where: { universeId },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async maxSortOrder(universeId: string, parentId: string | null): Promise<number> {
    const row = await this.prisma.writing.findFirst({
      where: { universeId, parentId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return row?.sortOrder ?? 0;
  }

  create(data: Prisma.WritingCreateInput): Promise<Writing> {
    return this.prisma.writing.create({ data });
  }

  update(id: string, data: Prisma.WritingUpdateInput): Promise<Writing> {
    return this.prisma.writing.update({ where: { id }, data });
  }

  delete(id: string): Promise<Writing> {
    return this.prisma.writing.delete({ where: { id } });
  }

  reorder(
    universeId: string,
    order: Array<{ id: string; parentId: string | null; sortOrder: number }>,
  ): Promise<unknown> {
    return this.prisma.$transaction(
      order.map((entry) =>
        this.prisma.writing.updateMany({
          where: { id: entry.id, universeId },
          data: { parentId: entry.parentId, sortOrder: entry.sortOrder },
        }),
      ),
    );
  }
}
