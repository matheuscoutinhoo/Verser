import type { Location } from '@prisma/client';
import type {
  Location as LocationDTO,
  UpdateLocationInput,
  UpsertLocationInput,
} from '@verser/shared';
import { NotFoundError, ValidationError } from '../../errors';
import { parseJsonField, stringifyJsonField } from '../../utils/json-fields';
import type { PaginatedQuery } from '../../utils/pagination';
import { buildPaginated, toPageMeta } from '../../utils/pagination';
import type { LocationRepository } from '../repositories/location.repository';

function toDTO(row: Location): LocationDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    name: row.name,
    description: row.description,
    geography: row.geography,
    culture: row.culture,
    history: row.history,
    climate: row.climate,
    population: row.population,
    imageUrl: row.imageUrl,
    imageStyle: row.imageStyle,
    customFields: parseJsonField<Record<string, unknown>>(row.customFields, {}),
    parentId: row.parentId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class LocationService {
  constructor(private readonly repo: LocationRepository) {}

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

  async getById(universeId: string, id: string): Promise<LocationDTO> {
    const row = await this.repo.findById(id);
    if (!row || row.universeId !== universeId) throw new NotFoundError('Location');
    return toDTO(row);
  }

  async create(universeId: string, input: UpsertLocationInput): Promise<LocationDTO> {
    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId);
      if (!parent || parent.universeId !== universeId) {
        throw new ValidationError('parentId must reference a location in the same universe');
      }
    }
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      name: input.name,
      description: input.description ?? null,
      geography: input.geography ?? null,
      culture: input.culture ?? null,
      history: input.history ?? null,
      climate: input.climate ?? null,
      population: input.population ?? null,
      imageStyle: input.imageStyle ?? null,
      customFields: input.customFields ? stringifyJsonField(input.customFields) : null,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateLocationInput,
  ): Promise<LocationDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Location');

    if (input.parentId === id) {
      throw new ValidationError('A location cannot be its own parent');
    }
    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId);
      if (!parent || parent.universeId !== universeId) {
        throw new ValidationError('parentId must reference a location in the same universe');
      }
    }

    const row = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.geography !== undefined ? { geography: input.geography } : {}),
      ...(input.culture !== undefined ? { culture: input.culture } : {}),
      ...(input.history !== undefined ? { history: input.history } : {}),
      ...(input.climate !== undefined ? { climate: input.climate } : {}),
      ...(input.population !== undefined ? { population: input.population } : {}),
      ...(input.imageStyle !== undefined ? { imageStyle: input.imageStyle } : {}),
      ...(((input as { imageUrl?: string | null }).imageUrl !== undefined)
        ? { imageUrl: (input as { imageUrl?: string | null }).imageUrl }
        : {}),
      ...(input.customFields !== undefined
        ? { customFields: input.customFields ? stringifyJsonField(input.customFields) : null }
        : {}),
      ...(input.parentId !== undefined
        ? input.parentId === null
          ? { parent: { disconnect: true } }
          : { parent: { connect: { id: input.parentId } } }
        : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Location');
    await this.repo.delete(id);
  }

  async setImageUrl(universeId: string, id: string, imageUrl: string): Promise<LocationDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('Location');
    const row = await this.repo.update(id, { imageUrl });
    return toDTO(row);
  }
}
