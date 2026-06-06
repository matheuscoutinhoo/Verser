import type { Prisma, PrismaClient, TimelineEvent } from '@prisma/client';

export class TimelineEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<TimelineEvent | null> {
    return this.prisma.timelineEvent.findUnique({ where: { id } });
  }

  listByUniverse(universeId: string): Promise<TimelineEvent[]> {
    return this.prisma.timelineEvent.findMany({
      where: { universeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async maxSortOrder(universeId: string): Promise<number> {
    const row = await this.prisma.timelineEvent.findFirst({
      where: { universeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return row?.sortOrder ?? 0;
  }

  create(data: Prisma.TimelineEventCreateInput): Promise<TimelineEvent> {
    return this.prisma.timelineEvent.create({ data });
  }

  update(id: string, data: Prisma.TimelineEventUpdateInput): Promise<TimelineEvent> {
    return this.prisma.timelineEvent.update({ where: { id }, data });
  }

  delete(id: string): Promise<TimelineEvent> {
    return this.prisma.timelineEvent.delete({ where: { id } });
  }

  reorder(
    universeId: string,
    order: Array<{ id: string; sortOrder: number }>,
  ): Promise<unknown> {
    return this.prisma.$transaction(
      order.map((entry) =>
        this.prisma.timelineEvent.updateMany({
          where: { id: entry.id, universeId },
          data: { sortOrder: entry.sortOrder },
        }),
      ),
    );
  }
}
