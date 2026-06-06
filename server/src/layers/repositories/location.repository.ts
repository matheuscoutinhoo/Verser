import type { Location, Prisma, PrismaClient } from '@prisma/client';

export interface ListLocationParams {
  universeId: string;
  skip: number;
  take: number;
  search?: string;
  order: 'asc' | 'desc';
}

export class LocationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Location | null> {
    return this.prisma.location.findUnique({ where: { id } });
  }

  async listByUniverse(params: ListLocationParams): Promise<{ items: Location[]; total: number }> {
    const where: Prisma.LocationWhereInput = {
      universeId: params.universeId,
      ...(params.search ? { name: { contains: params.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: { createdAt: params.order },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.location.count({ where }),
    ]);
    return { items, total };
  }

  create(data: Prisma.LocationCreateInput): Promise<Location> {
    return this.prisma.location.create({ data });
  }

  update(id: string, data: Prisma.LocationUpdateInput): Promise<Location> {
    return this.prisma.location.update({ where: { id }, data });
  }

  delete(id: string): Promise<Location> {
    return this.prisma.location.delete({ where: { id } });
  }
}
