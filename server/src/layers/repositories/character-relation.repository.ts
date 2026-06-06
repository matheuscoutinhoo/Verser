import type { CharacterRelation, Prisma, PrismaClient } from '@prisma/client';

export class CharacterRelationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<CharacterRelation | null> {
    return this.prisma.characterRelation.findUnique({ where: { id } });
  }

  listByUniverse(universeId: string): Promise<CharacterRelation[]> {
    return this.prisma.characterRelation.findMany({
      where: { universeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: Prisma.CharacterRelationCreateInput): Promise<CharacterRelation> {
    return this.prisma.characterRelation.create({ data });
  }

  update(id: string, data: Prisma.CharacterRelationUpdateInput): Promise<CharacterRelation> {
    return this.prisma.characterRelation.update({ where: { id }, data });
  }

  delete(id: string): Promise<CharacterRelation> {
    return this.prisma.characterRelation.delete({ where: { id } });
  }
}
