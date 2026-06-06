import type { LoreImportance } from '../constants';

// ─────────────────────────────────────────────
// Common
// ─────────────────────────────────────────────

export interface EntityTimestamps {
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Universe
// ─────────────────────────────────────────────

export interface Universe extends EntityTimestamps {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  genre: string | null;
}

export interface UniverseWithCounts extends Universe {
  counts: {
    characters: number;
    locations: number;
    systems: number;
    loreEntries: number;
    immutableLaws: number;
    timelineEvents: number;
    tags: number;
    writings: number;
  };
}

export interface CreateUniverseRequest {
  name: string;
  description?: string | null;
  genre?: string | null;
}

export interface UpdateUniverseRequest {
  name?: string;
  description?: string | null;
  genre?: string | null;
  coverUrl?: string | null;
}

// ─────────────────────────────────────────────
// Character
// ─────────────────────────────────────────────

export interface Character extends EntityTimestamps {
  id: string;
  universeId: string;
  name: string;
  aliases: string[];
  physicalDesc: string | null;
  personality: string | null;
  backstory: string | null;
  motivations: string | null;
  arc: string | null;
  notes: string | null;
  imageUrl: string | null;
  imageStyle: string | null;
  customFields: Record<string, unknown>;
}

export interface UpsertCharacterRequest {
  name: string;
  aliases?: string[];
  physicalDesc?: string | null;
  personality?: string | null;
  backstory?: string | null;
  motivations?: string | null;
  arc?: string | null;
  notes?: string | null;
  imageStyle?: string | null;
  customFields?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Character Relation
// ─────────────────────────────────────────────

export const RELATION_TYPES = [
  'ally',
  'enemy',
  'family',
  'romantic',
  'mentor',
  'rival',
  'neutral',
  'custom',
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export interface CharacterRelation extends EntityTimestamps {
  id: string;
  universeId: string;
  fromCharacterId: string;
  toCharacterId: string;
  relationType: string;
  description: string | null;
}

export interface UpsertCharacterRelationRequest {
  fromCharacterId: string;
  toCharacterId: string;
  relationType: string;
  description?: string | null;
}

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

export interface Location extends EntityTimestamps {
  id: string;
  universeId: string;
  name: string;
  description: string | null;
  geography: string | null;
  culture: string | null;
  history: string | null;
  climate: string | null;
  population: string | null;
  imageUrl: string | null;
  imageStyle: string | null;
  customFields: Record<string, unknown>;
  parentId: string | null;
}

export interface UpsertLocationRequest {
  name: string;
  description?: string | null;
  geography?: string | null;
  culture?: string | null;
  history?: string | null;
  climate?: string | null;
  population?: string | null;
  imageStyle?: string | null;
  customFields?: Record<string, unknown>;
  parentId?: string | null;
}

// ─────────────────────────────────────────────
// World System
// ─────────────────────────────────────────────

export const WORLD_SYSTEM_TYPES = [
  'magic',
  'technology',
  'political',
  'economic',
  'social',
  'religious',
  'other',
] as const;
export type WorldSystemType = (typeof WORLD_SYSTEM_TYPES)[number];

export interface WorldSystem extends EntityTimestamps {
  id: string;
  universeId: string;
  name: string;
  type: string;
  description: string | null;
  rules: string | null;
  limitations: string | null;
  interactions: string | null;
  customFields: Record<string, unknown>;
}

export interface UpsertWorldSystemRequest {
  name: string;
  type: string;
  description?: string | null;
  rules?: string | null;
  limitations?: string | null;
  interactions?: string | null;
  customFields?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Lore Entry
// ─────────────────────────────────────────────

export interface LoreEntry extends EntityTimestamps {
  id: string;
  universeId: string;
  title: string;
  category: string;
  content: string;
  importance: LoreImportance;
  customFields: Record<string, unknown>;
}

export interface UpsertLoreEntryRequest {
  title: string;
  category: string;
  content: string;
  importance?: LoreImportance;
  customFields?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Immutable Law
// ─────────────────────────────────────────────

export interface ImmutableLaw extends EntityTimestamps {
  id: string;
  universeId: string;
  title: string;
  description: string;
  category: string;
}

export interface UpsertImmutableLawRequest {
  title: string;
  description: string;
  category: string;
}

// ─────────────────────────────────────────────
// Timeline Event
// ─────────────────────────────────────────────

export interface TimelineEvent extends EntityTimestamps {
  id: string;
  universeId: string;
  title: string;
  description: string | null;
  date: string;
  sortOrder: number;
  importance: LoreImportance;
}

export interface UpsertTimelineEventRequest {
  title: string;
  description?: string | null;
  date: string;
  sortOrder?: number;
  importance?: LoreImportance;
}

export interface ReorderTimelineRequest {
  order: Array<{ id: string; sortOrder: number }>;
}

// ─────────────────────────────────────────────
// Universe Tag
// ─────────────────────────────────────────────

export interface UniverseTag {
  id: string;
  universeId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface UpsertUniverseTagRequest {
  name: string;
  color?: string | null;
}
