import type { WritingStatus, WritingType } from '../constants';
import type { EntityTimestamps } from './universe';

// Re-export tree-relevant constants for client convenience.
export type { WritingStatus, WritingType };

// ─────────────────────────────────────────────
// Writing (hierarchical document)
// ─────────────────────────────────────────────

export interface Writing extends EntityTimestamps {
  id: string;
  universeId: string;
  userId: string;
  title: string;
  content: string;
  contentPlain: string;
  wordCount: number;
  sortOrder: number;
  parentId: string | null;
  type: WritingType;
  status: WritingStatus;
}

/** Lightweight node returned by the tree endpoint (no heavy `content` field). */
export interface WritingTreeNode {
  id: string;
  universeId: string;
  title: string;
  type: WritingType;
  status: WritingStatus;
  wordCount: number;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: WritingTreeNode[];
}

export interface CreateWritingRequest {
  title: string;
  type?: WritingType;
  status?: WritingStatus;
  parentId?: string | null;
  sortOrder?: number;
  content?: string;
  contentPlain?: string;
}

export interface UpdateWritingRequest {
  title?: string;
  type?: WritingType;
  status?: WritingStatus;
  parentId?: string | null;
  sortOrder?: number;
  content?: string;
  contentPlain?: string;
  /**
   * If true, force a manual snapshot to be saved (in addition to applying the patch).
   * Auto-snapshots also occur when the word-count delta crosses the threshold.
   */
  createVersion?: boolean;
  /** Optional note attached to the snapshot when `createVersion` is true. */
  versionNote?: string;
}

export interface ReorderWritingItem {
  id: string;
  parentId: string | null;
  sortOrder: number;
}

export interface ReorderWritingsRequest {
  order: ReorderWritingItem[];
}

// ─────────────────────────────────────────────
// Writing version (snapshot)
// ─────────────────────────────────────────────

export interface WritingVersion {
  id: string;
  writingId: string;
  content: string;
  wordCount: number;
  note: string | null;
  createdAt: string;
}

export interface CreateWritingVersionRequest {
  note?: string;
}
