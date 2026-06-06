import type { Prisma, PrismaClient, WorldSystem } from '@prisma/client';

export interface ListWorldSystemParams {
  universeId: string;
  skip: number;
  take: number;
  search?: string;
  order: 'asc' | 'desc';
}

export class WorldSystemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<WorldSystem | null> {
    return this.prisma.worldSystem.findUnique({ where: { id } });
  }

  async listByUniverse(params: ListWorldSystemParams): Promise<{
    items: WorldSystem[];
    total: number;
  }> {
    const where: Prisma.WorldSystemWhereInput = {
      universeId: params.universeId,
      ...(params.search ? { name: { contains: params.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.worldSystem.findMany({
        where,
        orderBy: { createdAt: params.order },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.worldSystem.count({ where }),
    ]);
    return { items, total };
  }

  create(data: Prisma.WorldSystemCreateInput): Promise<WorldSystem> {
    return this.prisma.worldSystem.create({ data });
  }

  update(id: string, data: Prisma.WorldSystemUpdateInput): Promise<WorldSystem> {
    return this.prisma.worldSystem.update({ where: { id }, data });
  }

  delete(id: string): Promise<WorldSystem> {
    return this.prisma.worldSystem.delete({ where: { id } });
  }
}
