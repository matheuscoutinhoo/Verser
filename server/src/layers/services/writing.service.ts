import type { Writing, WritingVersion } from '@prisma/client';
import type {
  CreateWritingInput,
  CreateWritingVersionInput,
  ReorderWritingsInput,
  UpdateWritingInput,
  Writing as WritingDTO,
  WritingStatus,
  WritingTreeNode,
  WritingType,
  WritingVersion as WritingVersionDTO,
} from '@verser/shared';
import { WRITING, WRITING_STATUS, WRITING_TYPE, countWords } from '@verser/shared';
import { NotFoundError, ValidationError } from '../../errors';
import type { WritingRepository } from '../repositories/writing.repository';
import type { WritingVersionRepository } from '../repositories/writing-version.repository';

function toDTO(row: Writing): WritingDTO {
  const type = (WRITING_TYPE as readonly string[]).includes(row.type)
    ? (row.type as WritingType)
    : ('chapter' as WritingType);
  const status = (WRITING_STATUS as readonly string[]).includes(row.status)
    ? (row.status as WritingStatus)
    : ('draft' as WritingStatus);
  return {
    id: row.id,
    universeId: row.universeId,
    userId: row.userId,
    title: row.title,
    content: row.content,
    contentPlain: row.contentPlain,
    wordCount: row.wordCount,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    type,
    status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toVersionDTO(row: WritingVersion): WritingVersionDTO {
  return {
    id: row.id,
    writingId: row.writingId,
    content: row.content,
    wordCount: row.wordCount,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Assembles a forest of {@link WritingTreeNode} from a flat list. Nodes whose
 * parentId points outside the supplied list are promoted to roots — this keeps
 * the tree robust against orphaned rows.
 */
function buildTree(rows: Writing[]): WritingTreeNode[] {
  const byId = new Map<string, WritingTreeNode>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      universeId: row.universeId,
      title: row.title,
      type: (WRITING_TYPE as readonly string[]).includes(row.type)
        ? (row.type as WritingType)
        : ('chapter' as WritingType),
      status: (WRITING_STATUS as readonly string[]).includes(row.status)
        ? (row.status as WritingStatus)
        : ('draft' as WritingStatus),
      wordCount: row.wordCount,
      sortOrder: row.sortOrder,
      parentId: row.parentId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      children: [],
    });
  }

  const roots: WritingTreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: WritingTreeNode[]): void => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    for (const n of nodes) sortRecursive(n.children);
  };
  sortRecursive(roots);
  return roots;
}

export interface WritingServiceDeps {
  writingRepo: WritingRepository;
  versionRepo: WritingVersionRepository;
}

export class WritingService {
  private readonly writingRepo: WritingRepository;
  private readonly versionRepo: WritingVersionRepository;

  constructor(deps: WritingServiceDeps) {
    this.writingRepo = deps.writingRepo;
    this.versionRepo = deps.versionRepo;
  }

  async tree(universeId: string): Promise<WritingTreeNode[]> {
    const rows = await this.writingRepo.listByUniverse(universeId);
    return buildTree(rows);
  }

  async getById(
    userId: string,
    universeId: string,
    id: string,
  ): Promise<WritingDTO> {
    const row = await this.writingRepo.findById(id);
    if (!row || row.universeId !== universeId || row.userId !== userId) {
      throw new NotFoundError('Writing');
    }
    return toDTO(row);
  }

  async create(
    userId: string,
    universeId: string,
    input: CreateWritingInput,
  ): Promise<WritingDTO> {
    await this.assertValidParent(universeId, input.parentId ?? null);

    const sortOrder =
      input.sortOrder ??
      (await this.writingRepo.maxSortOrder(universeId, input.parentId ?? null)) + 10;

    const content = input.content ?? '';
    const contentPlain = input.contentPlain ?? '';
    const wordCount = countWords(contentPlain);

    const row = await this.writingRepo.create({
      universe: { connect: { id: universeId } },
      user: { connect: { id: userId } },
      title: input.title,
      content,
      contentPlain,
      wordCount,
      sortOrder,
      type: input.type ?? 'chapter',
      status: input.status ?? 'draft',
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
    return toDTO(row);
  }

  async update(
    userId: string,
    universeId: string,
    id: string,
    input: UpdateWritingInput,
  ): Promise<{ writing: WritingDTO; versionCreated: WritingVersionDTO | null }> {
    const existing = await this.writingRepo.findById(id);
    if (!existing || existing.universeId !== universeId || existing.userId !== userId) {
      throw new NotFoundError('Writing');
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        throw new ValidationError('A writing cannot be its own parent');
      }
      await this.assertValidParent(universeId, input.parentId);
    }

    const nextContentPlain =
      input.contentPlain !== undefined ? input.contentPlain : existing.contentPlain;
    const wordCount = countWords(nextContentPlain);

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.type !== undefined) data.type = input.type;
    if (input.status !== undefined) data.status = input.status;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.content !== undefined) data.content = input.content;
    if (input.contentPlain !== undefined) {
      data.contentPlain = input.contentPlain;
      data.wordCount = wordCount;
    }
    if (input.parentId !== undefined) {
      data.parent =
        input.parentId === null ? { disconnect: true } : { connect: { id: input.parentId } };
    }

    const row = await this.writingRepo.update(id, data);

    let versionCreated: WritingVersionDTO | null = null;
    const wordDelta = Math.abs(wordCount - existing.wordCount);
    const shouldAutoSnapshot =
      input.content !== undefined && wordDelta >= WRITING.AUTO_SNAPSHOT_WORD_DELTA;

    if (input.createVersion === true || shouldAutoSnapshot) {
      versionCreated = await this.createVersionInternal(row.id, row.content, row.wordCount, {
        note:
          input.versionNote ??
          (shouldAutoSnapshot
            ? `Auto-snapshot: +/- ${wordDelta} words`
            : null),
      });
    }

    return { writing: toDTO(row), versionCreated };
  }

  async delete(userId: string, universeId: string, id: string): Promise<void> {
    const existing = await this.writingRepo.findById(id);
    if (!existing || existing.universeId !== universeId || existing.userId !== userId) {
      throw new NotFoundError('Writing');
    }
    await this.writingRepo.delete(id);
  }

  async reorder(
    userId: string,
    universeId: string,
    input: ReorderWritingsInput,
  ): Promise<WritingTreeNode[]> {
    const ids = input.order.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) {
      throw new ValidationError('Reorder payload contains duplicate ids');
    }
    // Validate parents (in this universe & owned by this user) and prevent cycles.
    const seenIds = new Set(ids);
    for (const entry of input.order) {
      if (entry.parentId === entry.id) {
        throw new ValidationError(`Writing ${entry.id} cannot be its own parent`);
      }
      if (entry.parentId !== null && !seenIds.has(entry.parentId)) {
        const parent = await this.writingRepo.findById(entry.parentId);
        if (!parent || parent.universeId !== universeId || parent.userId !== userId) {
          throw new ValidationError(`Invalid parentId for writing ${entry.id}`);
        }
      }
    }

    await this.writingRepo.reorder(universeId, input.order);
    return this.tree(universeId);
  }

  async listVersions(
    userId: string,
    universeId: string,
    writingId: string,
  ): Promise<WritingVersionDTO[]> {
    const existing = await this.writingRepo.findById(writingId);
    if (!existing || existing.universeId !== universeId || existing.userId !== userId) {
      throw new NotFoundError('Writing');
    }
    const rows = await this.versionRepo.listByWriting(writingId);
    return rows.map(toVersionDTO);
  }

  async createManualVersion(
    userId: string,
    universeId: string,
    writingId: string,
    input: CreateWritingVersionInput,
  ): Promise<WritingVersionDTO> {
    const existing = await this.writingRepo.findById(writingId);
    if (!existing || existing.universeId !== universeId || existing.userId !== userId) {
      throw new NotFoundError('Writing');
    }
    const row = await this.createVersionInternal(
      existing.id,
      existing.content,
      existing.wordCount,
      { note: input.note ?? null },
    );
    return row;
  }

  // ── internals ────────────────────────────────

  private async createVersionInternal(
    writingId: string,
    content: string,
    wordCount: number,
    opts: { note: string | null },
  ): Promise<WritingVersionDTO> {
    const row = await this.versionRepo.create({
      writing: { connect: { id: writingId } },
      content,
      wordCount,
      note: opts.note,
    });
    return toVersionDTO(row);
  }

  private async assertValidParent(
    universeId: string,
    parentId: string | null,
  ): Promise<void> {
    if (!parentId) return;
    const parent = await this.writingRepo.findById(parentId);
    if (!parent || parent.universeId !== universeId) {
      throw new ValidationError('parentId must reference a writing in the same universe');
    }
  }
}
