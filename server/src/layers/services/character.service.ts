import type { Character } from '@prisma/client';
import type {
  Character as CharacterDTO,
  UpdateCharacterInput,
  UpsertCharacterInput,
} from '@verser/shared';
import { NotFoundError } from '../../errors';
import { parseJsonField, stringifyJsonField } from '../../utils/json-fields';
import type { PaginatedQuery } from '../../utils/pagination';
import { buildPaginated, toPageMeta } from '../../utils/pagination';
import type { CharacterRepository } from '../repositories/character.repository';

function toDTO(row: Character): CharacterDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    name: row.name,
    aliases: parseJsonField<string[]>(row.aliases, []),
    physicalDesc: row.physicalDesc,
    personality: row.personality,
    backstory: row.backstory,
    motivations: row.motivations,
    skills: row.skills,
    notes: row.notes,
    imageUrl: row.imageUrl,
    imageStyle: row.imageStyle,
    customFields: parseJsonField<Record<string, unknown>>(row.customFields, {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class CharacterService {
  constructor(private readonly repo: CharacterRepository) {}

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

  async getById(universeId: string, id: string): Promise<CharacterDTO> {
    const row = await this.repo.findById(id);
    if (!row || row.universeId !== universeId) throw new NotFoundError('Character');
    return toDTO(row);
  }

  async create(universeId: string, input: UpsertCharacterInput): Promise<CharacterDTO> {
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      name: input.name,
      aliases: input.aliases ? stringifyJsonField(input.aliases) : null,
      physicalDesc: input.physicalDesc ?? null,
      personality: input.personality ?? null,
      backstory: input.backstory ?? null,
      motivations: input.motivations ?? null,
      skills: input.skills ?? null,
      notes: input.notes ?? null,
      imageUrl: input.imageUrl ?? null,
      imageStyle: input.imageStyle ?? null,
      customFields: input.customFields ? stringifyJsonField(input.customFields) : null,
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateCharacterInput,
  ): Promise<CharacterDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Character');

    const row = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.aliases !== undefined
        ? { aliases: input.aliases ? stringifyJsonField(input.aliases) : null }
        : {}),
      ...(input.physicalDesc !== undefined ? { physicalDesc: input.physicalDesc } : {}),
      ...(input.personality !== undefined ? { personality: input.personality } : {}),
      ...(input.backstory !== undefined ? { backstory: input.backstory } : {}),
      ...(input.motivations !== undefined ? { motivations: input.motivations } : {}),
      ...(input.skills !== undefined ? { skills: input.skills } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.imageStyle !== undefined ? { imageStyle: input.imageStyle } : {}),
      ...(((input as { imageUrl?: string | null }).imageUrl !== undefined)
        ? { imageUrl: (input as { imageUrl?: string | null }).imageUrl }
        : {}),
      ...(input.customFields !== undefined
        ? { customFields: input.customFields ? stringifyJsonField(input.customFields) : null }
        : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Character');
    await this.repo.delete(id);
  }

  async setImageUrl(
    universeId: string,
    id: string,
    imageUrl: string,
  ): Promise<CharacterDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Character');
    const row = await this.repo.update(id, { imageUrl });
    return toDTO(row);
  }
}
