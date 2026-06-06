import type { Character, Prisma, PrismaClient } from '@prisma/client';

export interface ListCharacterParams {
  universeId: string;
  skip: number;
  take: number;
  search?: string;
  order: 'asc' | 'desc';
}

export class CharacterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Character | null> {
    return this.prisma.character.findUnique({ where: { id } });
  }

  async listByUniverse(params: ListCharacterParams): Promise<{ items: Character[]; total: number }> {
    const where: Prisma.CharacterWhereInput = {
      universeId: params.universeId,
      ...(params.search ? { name: { contains: params.search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.character.findMany({
        where,
        orderBy: { createdAt: params.order },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.character.count({ where }),
    ]);
    return { items, total };
  }

  create(data: Prisma.CharacterCreateInput): Promise<Character> {
    return this.prisma.character.create({ data });
  }

  update(id: string, data: Prisma.CharacterUpdateInput): Promise<Character> {
    return this.prisma.character.update({ where: { id }, data });
  }

  delete(id: string): Promise<Character> {
    return this.prisma.character.delete({ where: { id } });
  }
}
