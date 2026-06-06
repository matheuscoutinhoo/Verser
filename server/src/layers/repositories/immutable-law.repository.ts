import type { ImmutableLaw, Prisma, PrismaClient } from '@prisma/client';

export class ImmutableLawRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<ImmutableLaw | null> {
    return this.prisma.immutableLaw.findUnique({ where: { id } });
  }

  listByUniverse(universeId: string): Promise<ImmutableLaw[]> {
    return this.prisma.immutableLaw.findMany({
      where: { universeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: Prisma.ImmutableLawCreateInput): Promise<ImmutableLaw> {
    return this.prisma.immutableLaw.create({ data });
  }

  update(id: string, data: Prisma.ImmutableLawUpdateInput): Promise<ImmutableLaw> {
    return this.prisma.immutableLaw.update({ where: { id }, data });
  }

  delete(id: string): Promise<ImmutableLaw> {
    return this.prisma.immutableLaw.delete({ where: { id } });
  }
}
