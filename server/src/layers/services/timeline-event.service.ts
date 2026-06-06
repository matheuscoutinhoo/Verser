import type { TimelineEvent } from '@prisma/client';
import type {
  LoreImportance,
  ReorderTimelineInput,
  TimelineEvent as TimelineEventDTO,
  UpdateTimelineEventInput,
  UpsertTimelineEventInput,
} from '@verser/shared';
import { LORE_IMPORTANCE } from '@verser/shared';
import { NotFoundError, ValidationError } from '../../errors';
import type { TimelineEventRepository } from '../repositories/timeline-event.repository';

function toDTO(row: TimelineEvent): TimelineEventDTO {
  const importance = (LORE_IMPORTANCE as readonly string[]).includes(row.importance)
    ? (row.importance as LoreImportance)
    : ('normal' as LoreImportance);
  return {
    id: row.id,
    universeId: row.universeId,
    title: row.title,
    description: row.description,
    date: row.date,
    sortOrder: row.sortOrder,
    importance,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class TimelineEventService {
  constructor(private readonly repo: TimelineEventRepository) {}

  async list(universeId: string): Promise<TimelineEventDTO[]> {
    const rows = await this.repo.listByUniverse(universeId);
    return rows.map(toDTO);
  }

  async create(
    universeId: string,
    input: UpsertTimelineEventInput,
  ): Promise<TimelineEventDTO> {
    const sortOrder =
      input.sortOrder ?? (await this.repo.maxSortOrder(universeId)) + 10;
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      sortOrder,
      importance: input.importance ?? 'normal',
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateTimelineEventInput,
  ): Promise<TimelineEventDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('TimelineEvent');
    const row = await this.repo.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.importance !== undefined ? { importance: input.importance } : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('TimelineEvent');
    await this.repo.delete(id);
  }

  async reorder(universeId: string, input: ReorderTimelineInput): Promise<TimelineEventDTO[]> {
    const ids = input.order.map((entry) => entry.id);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new ValidationError('Reorder payload contains duplicate ids');
    }
    await this.repo.reorder(universeId, input.order);
    return this.list(universeId);
  }
}
