import type { UniverseTag } from '@prisma/client';
import type {
  UniverseTag as UniverseTagDTO,
  UpsertUniverseTagInput,
} from '@verser/shared';
import { ConflictError, NotFoundError } from '../../errors';
import { ERROR_CODES } from '@verser/shared';
import type { UniverseTagRepository } from '../repositories/universe-tag.repository';

function toDTO(row: UniverseTag): UniverseTagDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

export class UniverseTagService {
  constructor(private readonly repo: UniverseTagRepository) {}

  async list(universeId: string): Promise<UniverseTagDTO[]> {
    const rows = await this.repo.listByUniverse(universeId);
    return rows.map(toDTO);
  }

  async create(universeId: string, input: UpsertUniverseTagInput): Promise<UniverseTagDTO> {
    const existing = await this.repo.findByName(universeId, input.name);
    if (existing) throw new ConflictError('Tag already exists', ERROR_CODES.CONFLICT);
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      name: input.name,
      color: input.color ?? null,
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Tag');
    await this.repo.delete(id);
  }
}
