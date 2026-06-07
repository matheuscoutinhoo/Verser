import type { ImmutableLaw } from '@prisma/client';
import type {
  ImmutableLaw as ImmutableLawDTO,
  UpdateImmutableLawInput,
  UpsertImmutableLawInput,
} from '@verser/shared';
import { NotFoundError } from '../../errors';
import type { ImmutableLawRepository } from '../repositories/immutable-law.repository';

function toDTO(row: ImmutableLaw): ImmutableLawDTO {
  return {
    id: row.id,
    universeId: row.universeId,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.imageUrl,
    imageStyle: row.imageStyle,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ImmutableLawService {
  constructor(private readonly repo: ImmutableLawRepository) {}

  async list(universeId: string): Promise<ImmutableLawDTO[]> {
    const rows = await this.repo.listByUniverse(universeId);
    return rows.map(toDTO);
  }

  async create(universeId: string, input: UpsertImmutableLawInput): Promise<ImmutableLawDTO> {
    const row = await this.repo.create({
      universe: { connect: { id: universeId } },
      title: input.title,
      description: input.description,
      category: input.category,
      imageUrl: input.imageUrl ?? null,
      imageStyle: input.imageStyle ?? null,
    });
    return toDTO(row);
  }

  async update(
    universeId: string,
    id: string,
    input: UpdateImmutableLawInput,
  ): Promise<ImmutableLawDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('ImmutableLaw');
    const row = await this.repo.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.imageStyle !== undefined ? { imageStyle: input.imageStyle } : {}),
    });
    return toDTO(row);
  }

  async delete(universeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('ImmutableLaw');
    await this.repo.delete(id);
  }

  async setImageUrl(
    universeId: string,
    id: string,
    imageUrl: string,
  ): Promise<ImmutableLawDTO> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.universeId !== universeId) throw new NotFoundError('ImmutableLaw');
    const row = await this.repo.update(id, { imageUrl });
    return toDTO(row);
  }
}
