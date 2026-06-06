import type { CharacterRelation } from '@prisma/client';
import type {
  CharacterRelation as CharacterRelationDTO,
  UpdateCharacterRelationInput,
  UpsertCharacterRelationInput,
} from '@verser/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import { ERROR_CODES } from '@verser/shared';
import type { CharacterRepository } from '../repositories/character.repository';
import type { CharacterRelationRepository } from '../repositories/character-relation.repository';

function toDTO(row: CharacterRelation): CharacterRelationDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    fromCharacterId: row.fromCharacterId,
    toCharacterId: row.toCharacterId,
    relationType: row.relationType,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class CharacterRelationService {
  constructor(
    private readonly repo: CharacterRelationRepository,
    private readonly characterRepo: CharacterRepository,
  ) {}

  async list(universeId: string): Promise<CharacterRelationDTO[]> {
    const rows = await this.repo.listByUniverse(universeId);
    return rows.map(toDTO);
  }

  async create(
    universeId: string,
    input: UpsertCharacterRelationInput,
  ): Promise<CharacterRelationDTO> {
    if (input.fromCharacterId === input.toCharacterId) {
      throw new ValidationError('A character cannot relate to itself');
    }
    const [from, to] = await Promise.all([
      this.characterRepo.findById(input.fromCharacterId),
      this.characterRepo.findById(input.toCharacterId),
    ]);
    if (!from || from.universeId !== universeId) throw new NotFoundError('Character (from)');
    if (!to || to.universeId !== universeId) throw new NotFoundError('Character (to)');

    try {
      const row = await this.repo.create({
        universe: { connect: { id: universeId } },
        fromCharacter: { connect: { id: input.fromCharacterId } },
        toCharacter: { connect: { id: input.toCharacterId } },
        relationType: input.relationType,
        description: input.description ?? null,
      });
      return toDTO(row);
    } catch (err) {
      // Unique constraint on (fromCharacterId, toCharacterId, relationType)
      if (err instanceof Error && err.message.includes('Unique')) {
        throw new ConflictError('Relation already exists', ERROR_CODES.CONFLICT);
      }
      throw err;
    }
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateCharacterRelationInput,
  ): Promise<CharacterRelationDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Relation');
    const row = await this.repo.update(id, {
      ...(input.relationType !== undefined ? { relationType: input.relationType } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Relation');
    await this.repo.delete(id);
  }
}
