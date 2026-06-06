import { AI, safeJsonParse, type UniverseContextBundle } from '@verser/shared';
import type { CharacterRepository } from '../repositories/character.repository';
import type { ImmutableLawRepository } from '../repositories/immutable-law.repository';
import type { LocationRepository } from '../repositories/location.repository';
import type { LoreEntryRepository } from '../repositories/lore-entry.repository';
import type { UniverseRepository } from '../repositories/universe.repository';
import type { WorldSystemRepository } from '../repositories/world-system.repository';

export interface ContextBuilderDeps {
  universeRepo: UniverseRepository;
  characterRepo: CharacterRepository;
  locationRepo: LocationRepository;
  systemRepo: WorldSystemRepository;
  loreRepo: LoreEntryRepository;
  lawRepo: ImmutableLawRepository;
}

export interface BuildContextOptions {
  /** Source text the IA will operate on — used to score entity relevance. */
  query?: string;
  /** Hard cap on context tokens (rough chars/4 estimate). */
  maxTokens?: number;
}

/**
 * Builds a {@link UniverseContextBundle} for context injection per RN002 / RN006:
 *   - immutable laws are ALWAYS included
 *   - lore is filtered by importance (critical + high by default)
 *   - characters / locations / systems are scored by keyword overlap with the query
 *   - the final bundle is truncated to fit `maxTokens`
 */
export class ContextBuilderService {
  constructor(private readonly deps: ContextBuilderDeps) {}

  async build(universeId: string, opts: BuildContextOptions = {}): Promise<UniverseContextBundle> {
    const maxTokens = opts.maxTokens ?? AI.MAX_CONTEXT_TOKENS;
    const universe = await this.deps.universeRepo.findById(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found`);
    }

    const [laws, lore, characters, locations, systems] = await Promise.all([
      this.deps.lawRepo.listByUniverse(universeId),
      this.deps.loreRepo.findByImportance(universeId, [
        ...AI.DEFAULT_LORE_IMPORTANCE_LEVELS,
      ]),
      this.deps.characterRepo.listByUniverse({
        universeId,
        skip: 0,
        take: 100,
        order: 'desc',
      }),
      this.deps.locationRepo.listByUniverse({
        universeId,
        skip: 0,
        take: 100,
        order: 'desc',
      }),
      this.deps.systemRepo.listByUniverse({
        universeId,
        skip: 0,
        take: 50,
        order: 'desc',
      }),
    ]);

    const query = (opts.query ?? '').toLowerCase();
    const keywords = query ? extractKeywords(query) : new Set<string>();

    const characterSummaries = characters.items
      .map((c) => ({
        id: c.id,
        name: c.name,
        aliases: safeJsonParse<string[]>(c.aliases, []),
        summary: shortSummary(c.physicalDesc, c.personality, c.backstory),
        score: scoreEntity(keywords, [
          c.name,
          ...safeJsonParse<string[]>(c.aliases, []),
          c.personality ?? '',
          c.physicalDesc ?? '',
          c.notes ?? '',
        ]),
      }))
      .sort((a, b) => b.score - a.score);

    const locationSummaries = locations.items
      .map((l) => ({
        id: l.id,
        name: l.name,
        summary: shortSummary(l.description, l.geography, l.culture),
        score: scoreEntity(keywords, [
          l.name,
          l.description ?? '',
          l.geography ?? '',
          l.culture ?? '',
        ]),
      }))
      .sort((a, b) => b.score - a.score);

    const systemSummaries = systems.items
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        summary: shortSummary(s.description, s.rules, s.limitations),
        score: scoreEntity(keywords, [s.name, s.type, s.rules ?? '', s.description ?? '']),
      }))
      .sort((a, b) => b.score - a.score);

    const loreSummaries = lore
      .map((l) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        content: l.content,
        importance: l.importance,
        score: scoreEntity(keywords, [l.title, l.category, l.content]),
      }))
      .sort((a, b) => b.score - a.score);

    // Always include laws.
    const includedLaws = laws.map((l) => ({
      title: l.title,
      description: l.description,
      category: l.category,
    }));

    const bundle: UniverseContextBundle = {
      universe: { id: universe.id, name: universe.name, genre: universe.genre },
      laws: includedLaws,
      characters: [],
      locations: [],
      systems: [],
      lore: [],
      estimatedTokens: 0,
    };

    let tokens = estimateTokens(JSON.stringify(bundle));

    // Greedily add the highest-scoring entities until the budget is hit.
    const buckets: Array<{
      list: Array<{ score: number; payload: object }>;
      target: 'characters' | 'locations' | 'systems' | 'lore';
    }> = [
      {
        list: characterSummaries.map((c) => ({
          score: c.score,
          payload: { id: c.id, name: c.name, aliases: c.aliases, summary: c.summary },
        })),
        target: 'characters',
      },
      {
        list: locationSummaries.map((l) => ({
          score: l.score,
          payload: { id: l.id, name: l.name, summary: l.summary },
        })),
        target: 'locations',
      },
      {
        list: systemSummaries.map((s) => ({
          score: s.score,
          payload: { id: s.id, name: s.name, type: s.type, summary: s.summary },
        })),
        target: 'systems',
      },
      {
        list: loreSummaries.map((l) => ({
          score: l.score,
          payload: {
            id: l.id,
            title: l.title,
            category: l.category,
            content: l.content.slice(0, 600),
            importance: l.importance,
          },
        })),
        target: 'lore',
      },
    ];

    // Interleave one entity at a time per bucket so categories stay balanced.
    let exhausted = false;
    while (!exhausted) {
      exhausted = true;
      for (const bucket of buckets) {
        const next = bucket.list.shift();
        if (!next) continue;
        const candidateTokens = estimateTokens(JSON.stringify(next.payload));
        if (tokens + candidateTokens > maxTokens) continue;
        (bundle[bucket.target] as object[]).push(next.payload);
        tokens += candidateTokens;
        exhausted = false;
      }
    }

    bundle.estimatedTokens = tokens;
    return bundle;
  }
}

// ── helpers ─────────────────────────────────────────

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'was',
  'were',
  'has',
  'have',
  'had',
  'into',
  'from',
  'they',
  'them',
  'their',
  'about',
  'over',
  'when',
  'where',
  'while',
  'because',
]);

function extractKeywords(text: string): Set<string> {
  const matches = text.toLowerCase().match(/[a-z0-9']{4,}/g) ?? [];
  return new Set(matches.filter((w) => !STOP_WORDS.has(w)));
}

function scoreEntity(keywords: Set<string>, fields: string[]): number {
  if (keywords.size === 0) return 1; // No query — keep insertion order with neutral score.
  let score = 0;
  const haystack = fields.join(' ').toLowerCase();
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += 1;
  }
  return score;
}

function shortSummary(...parts: Array<string | null | undefined>): string | undefined {
  const joined = parts
    .filter((p): p is string => Boolean(p))
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(' · ');
  if (!joined) return undefined;
  return joined.length > 400 ? `${joined.slice(0, 397)}…` : joined;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
