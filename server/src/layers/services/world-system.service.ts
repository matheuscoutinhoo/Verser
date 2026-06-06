import type { WorldSystem } from '@prisma/client';
import type {
  UpdateWorldSystemInput,
  UpsertWorldSystemInput,
  WorldSystem as WorldSystemDTO,
} from '@verser/shared';
import { NotFoundError } from '../../errors';
import { parseJsonField, stringifyJsonField } from '../../utils/json-fields';
import type { PaginatedQuery } from '../../utils/pagination';
import { buildPaginated, toPageMeta } from '../../utils/pagination';
import type { WorldSystemRepository } from '../repositories/world-system.repository';

function toDTO(row: WorldSystem): WorldSystemDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    name: row.name,
    type: row.type,
    description: row.description,
    rules: row.rules,
    limitations: row.limitations,
    interactions: row.interactions,
    customFields: parseJsonField<Record<string, unknown>>(row.customFields, {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class WorldSystemService {
  constructor(private readonly repo: WorldSystemRepository) {}

  async list(universeId: string, query: PaginatedQuery) {
    const { skip, take } = toPageMeta(query);
    const { items, total } = await this.repo.listByUniverse({
      universeId,
      skip,
      take,
      search: query.search,
      order: query.order,
    });
    return buildPaginated(items.map(toDTO), total, query);
  }

  async getById(universeId: string, id: string): Promise<WorldSystemDTO> {
    const row = await this.repo.findById(id);
    if (!row || row.universeId !== universeId) throw new NotFoundError('WorldSystem');
    return toDTO(row);
  }

  async create(universeId: string, input: UpsertWorldSystemInput): Promise<WorldSystemDTO> {
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      rules: input.rules ?? null,
      limitations: input.limitations ?? null,
      interactions: input.interactions ?? null,
      customFields: input.customFields ? stringifyJsonField(input.customFields) : null,
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateWorldSystemInput,
  ): Promise<WorldSystemDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('WorldSystem');
    const row = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.rules !== undefined ? { rules: input.rules } : {}),
      ...(input.limitations !== undefined ? { limitations: input.limitations } : {}),
      ...(input.interactions !== undefined ? { interactions: input.interactions } : {}),
      ...(input.customFields !== undefined
        ? { customFields: input.customFields ? stringifyJsonField(input.customFields) : null }
        : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('WorldSystem');
    await this.repo.delete(id);
  }
}
