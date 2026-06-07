import type {
  Character,
  CharacterRelation,
  ImmutableLaw,
  Location,
  LoreEntry,
  PaginatedResult,
  TimelineEvent,
  UniverseTag,
  UpdateCharacterInput,
  UpdateCharacterRelationInput,
  UpdateImmutableLawInput,
  UpdateLocationInput,
  UpdateLoreEntryInput,
  UpdateTimelineEventInput,
  UpdateWorldSystemInput,
  UpsertCharacterInput,
  UpsertCharacterRelationInput,
  UpsertImmutableLawInput,
  UpsertLocationInput,
  UpsertLoreEntryInput,
  UpsertTimelineEventInput,
  UpsertUniverseTagInput,
  UpsertWorldSystemInput,
  WorldSystem,
} from '@verser/shared';
import { apiClient } from './api-client';

const base = (uid: string) => `/universes/${uid}`;

// ─── Characters ─────────────────────────────────────

export interface CharactersListParams {
  page?: number;
  limit?: number;
  search?: string;
}

function listQuery(params: { page?: number; limit?: number; search?: string }): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.search) sp.set('search', params.search);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const charactersService = {
  list(uid: string, params: CharactersListParams = {}): Promise<PaginatedResult<Character>> {
    return apiClient.get(`${base(uid)}/characters${listQuery(params)}`);
  },
  detail(uid: string, id: string): Promise<Character> {
    return apiClient.get(`${base(uid)}/characters/${id}`);
  },
  create(uid: string, input: UpsertCharacterInput): Promise<Character> {
    return apiClient.post(`${base(uid)}/characters`, input);
  },
  update(uid: string, id: string, input: UpdateCharacterInput): Promise<Character> {
    return apiClient.patch(`${base(uid)}/characters/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/characters/${id}`);
  },
  uploadImage(uid: string, id: string, file: File): Promise<{ character: Character }> {
    return apiClient.uploadFile(`${base(uid)}/characters/${id}/image`, file);
  },
};

// ─── Character Relations ────────────────────────────

export const characterRelationsService = {
  list(uid: string): Promise<CharacterRelation[]> {
    return apiClient.get(`${base(uid)}/character-relations`);
  },
  create(uid: string, input: UpsertCharacterRelationInput): Promise<CharacterRelation> {
    return apiClient.post(`${base(uid)}/character-relations`, input);
  },
  update(uid: string, id: string, input: UpdateCharacterRelationInput): Promise<CharacterRelation> {
    return apiClient.patch(`${base(uid)}/character-relations/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/character-relations/${id}`);
  },
};

// ─── Locations ──────────────────────────────────────

export const locationsService = {
  list(
    uid: string,
    params: CharactersListParams = {},
  ): Promise<PaginatedResult<Location>> {
    return apiClient.get(`${base(uid)}/locations${listQuery(params)}`);
  },
  detail(uid: string, id: string): Promise<Location> {
    return apiClient.get(`${base(uid)}/locations/${id}`);
  },
  create(uid: string, input: UpsertLocationInput): Promise<Location> {
    return apiClient.post(`${base(uid)}/locations`, input);
  },
  update(uid: string, id: string, input: UpdateLocationInput): Promise<Location> {
    return apiClient.patch(`${base(uid)}/locations/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/locations/${id}`);
  },
  uploadImage(uid: string, id: string, file: File): Promise<{ location: Location }> {
    return apiClient.uploadFile(`${base(uid)}/locations/${id}/image`, file);
  },
};

// ─── Systems ────────────────────────────────────────

export const systemsService = {
  list(
    uid: string,
    params: CharactersListParams = {},
  ): Promise<PaginatedResult<WorldSystem>> {
    return apiClient.get(`${base(uid)}/systems${listQuery(params)}`);
  },
  detail(uid: string, id: string): Promise<WorldSystem> {
    return apiClient.get(`${base(uid)}/systems/${id}`);
  },
  create(uid: string, input: UpsertWorldSystemInput): Promise<WorldSystem> {
    return apiClient.post(`${base(uid)}/systems`, input);
  },
  update(uid: string, id: string, input: UpdateWorldSystemInput): Promise<WorldSystem> {
    return apiClient.patch(`${base(uid)}/systems/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/systems/${id}`);
  },
  uploadImage(uid: string, id: string, file: File): Promise<{ system: WorldSystem }> {
    return apiClient.uploadFile(`${base(uid)}/systems/${id}/image`, file);
  },
};

// ─── Lore ───────────────────────────────────────────

export interface LoreListParams extends CharactersListParams {
  category?: string;
  importance?: string;
}

export const loreService = {
  list(uid: string, params: LoreListParams = {}): Promise<PaginatedResult<LoreEntry>> {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.search) sp.set('search', params.search);
    if (params.category) sp.set('category', params.category);
    if (params.importance) sp.set('importance', params.importance);
    const s = sp.toString();
    return apiClient.get(`${base(uid)}/lore-entries${s ? `?${s}` : ''}`);
  },
  detail(uid: string, id: string): Promise<LoreEntry> {
    return apiClient.get(`${base(uid)}/lore-entries/${id}`);
  },
  create(uid: string, input: UpsertLoreEntryInput): Promise<LoreEntry> {
    return apiClient.post(`${base(uid)}/lore-entries`, input);
  },
  update(uid: string, id: string, input: UpdateLoreEntryInput): Promise<LoreEntry> {
    return apiClient.patch(`${base(uid)}/lore-entries/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/lore-entries/${id}`);
  },
};

// ─── Immutable Laws ─────────────────────────────────

export const lawsService = {
  list(uid: string): Promise<ImmutableLaw[]> {
    return apiClient.get(`${base(uid)}/immutable-laws`);
  },
  create(uid: string, input: UpsertImmutableLawInput): Promise<ImmutableLaw> {
    return apiClient.post(`${base(uid)}/immutable-laws`, input);
  },
  update(uid: string, id: string, input: UpdateImmutableLawInput): Promise<ImmutableLaw> {
    return apiClient.patch(`${base(uid)}/immutable-laws/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/immutable-laws/${id}`);
  },
};

// ─── Timeline Events ────────────────────────────────

export const timelineService = {
  list(uid: string): Promise<TimelineEvent[]> {
    return apiClient.get(`${base(uid)}/timeline-events`);
  },
  create(uid: string, input: UpsertTimelineEventInput): Promise<TimelineEvent> {
    return apiClient.post(`${base(uid)}/timeline-events`, input);
  },
  update(uid: string, id: string, input: UpdateTimelineEventInput): Promise<TimelineEvent> {
    return apiClient.patch(`${base(uid)}/timeline-events/${id}`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/timeline-events/${id}`);
  },
  reorder(
    uid: string,
    order: Array<{ id: string; sortOrder: number }>,
  ): Promise<TimelineEvent[]> {
    return apiClient.patch(`${base(uid)}/timeline-events/reorder`, { order });
  },
};

// ─── Tags ───────────────────────────────────────────

export const tagsService = {
  list(uid: string): Promise<UniverseTag[]> {
    return apiClient.get(`${base(uid)}/tags`);
  },
  create(uid: string, input: UpsertUniverseTagInput): Promise<UniverseTag> {
    return apiClient.post(`${base(uid)}/tags`, input);
  },
  delete(uid: string, id: string): Promise<void> {
    return apiClient.delete(`${base(uid)}/tags/${id}`);
  },
};
