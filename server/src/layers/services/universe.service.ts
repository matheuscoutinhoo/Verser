import type { Universe } from '@prisma/client';
import type {
  CreateUniverseInput,
  UpdateUniverseInput,
  Universe as UniverseDTO,
  UniverseWithCounts,
} from '@verser/shared';
import { NotFoundError } from '../../errors';
import type { PaginatedQuery } from '../../utils/pagination';
import { buildPaginated, toPageMeta } from '../../utils/pagination';
import type { UniverseRepository } from '../repositories/universe.repository';

function toDTO(row: Universe): UniverseDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    coverUrl: row.coverUrl,
    genre: row.genre,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class UniverseService {
  constructor(private readonly repo: UniverseRepository) {}

  async list(userId: string, query: PaginatedQuery) {
    const { skip, take } = toPageMeta(query);
    const { items, total } = await this.repo.listForUser({
      userId,
      skip,
      take,
      search: query.search,
      order: query.order,
    });
    return buildPaginated(items.map(toDTO), total, query);
  }

  async getById(userId: string, id: string): Promise<UniverseWithCounts> {
    const row = await this.repo.findById(id);
    if (!row || row.userId !== userId) {
      throw new NotFoundError('Universe');
    }
    const counts = await this.repo.countsFor(row.id);
    return { ...toDTO(row), counts };
  }

  async create(userId: string, input: CreateUniverseInput): Promise<UniverseDTO> {
    const row = await this.repo.create({
      user: { connect: { id: userId } },
      name: input.name,
      description: input.description ?? null,
      genre: input.genre ?? null,
    });
    return toDTO(row);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateUniverseInput,
  ): Promise<UniverseDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Universe');
    }
    const row = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.genre !== undefined ? { genre: input.genre } : {}),
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
    });
    return toDTO(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Universe');
    }
    await this.repo.delete(id);
  }
}
