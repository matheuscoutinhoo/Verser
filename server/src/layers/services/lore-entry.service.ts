import type { LoreEntry } from '@prisma/client';
import type {
  LoreImportance,
  LoreEntry as LoreEntryDTO,
  UpdateLoreEntryInput,
  UpsertLoreEntryInput,
} from '@verser/shared';
import { LORE_IMPORTANCE } from '@verser/shared';
import { NotFoundError } from '../../errors';
import { parseJsonField, stringifyJsonField } from '../../utils/json-fields';
import type { PaginatedQuery } from '../../utils/pagination';
import { buildPaginated, toPageMeta } from '../../utils/pagination';
import type { LoreEntryRepository } from '../repositories/lore-entry.repository';

function toDTO(row: LoreEntry): LoreEntryDTO {
  const importance = (LORE_IMPORTANCE as readonly string[]).includes(row.importance)
    ? (row.importance as LoreImportance)
    : ('normal' as LoreImportance);
  return {
    id: row.id,
    universeId: row.universeId,
    title: row.title,
    category: row.category,
    content: row.content,
    importance,
    customFields: parseJsonField<Record<string, unknown>>(row.customFields, {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface LoreListQuery extends PaginatedQuery {
  category?: string;
  importance?: string;
}

export class LoreEntryService {
  constructor(private readonly repo: LoreEntryRepository) {}

  async list(universeId: string, query: LoreListQuery) {
    const { skip, take } = toPageMeta(query);
    const { items, total } = await this.repo.listByUniverse({
      universeId,
      skip,
      take,
      search: query.search,
      category: query.category,
      importance: query.importance,
      order: query.order,
    });
    return buildPaginated(items.map(toDTO), total, query);
  }

  async getById(universeId: string, id: string): Promise<LoreEntryDTO> {
    const row = await this.repo.findById(id);
    if (!row || row.universeId !== universeId) throw new NotFoundError('LoreEntry');
    return toDTO(row);
  }

  async create(universeId: string, input: UpsertLoreEntryInput): Promise<LoreEntryDTO> {
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      title: input.title,
      category: input.category,
      content: input.content,
      importance: input.importance ?? 'normal',
      customFields: input.customFields ? stringifyJsonField(input.customFields) : null,
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateLoreEntryInput,
  ): Promise<LoreEntryDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('LoreEntry');
    const row = await this.repo.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.importance !== undefined ? { importance: input.importance } : {}),
      ...(input.customFields !== undefined
        ? { customFields: input.customFields ? stringifyJsonField(input.customFields) : null }
        : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('LoreEntry');
    await this.repo.delete(id);
  }
}
