import type { AIMode, ImageStyle } from '../constants';

// ─────────────────────────────────────────────
// Universe context bundle injected into prompts
// ─────────────────────────────────────────────

export interface AIContextLaw {
  title: string;
  description: string;
  category: string;
}

export interface AIContextCharacter {
  id: string;
  name: string;
  aliases?: string[];
  summary?: string;
}

export interface AIContextLocation {
  id: string;
  name: string;
  summary?: string;
}

export interface AIContextSystem {
  id: string;
  name: string;
  type: string;
  summary?: string;
}

export interface AIContextLore {
  id: string;
  title: string;
  category: string;
  content: string;
  importance: string;
}

export interface UniverseContextBundle {
  universe: { id: string; name: string; genre: string | null };
  laws: AIContextLaw[];
  characters: AIContextCharacter[];
  locations: AIContextLocation[];
  systems: AIContextSystem[];
  lore: AIContextLore[];
  /** Estimated token count (rough: chars / 4). */
  estimatedTokens: number;
}

// ─────────────────────────────────────────────
// Text generation
// ─────────────────────────────────────────────

export interface AIGenerateTextRequest {
  universeId: string;
  mode: AIMode;
  /** The text the user has selected or wants the AI to operate on. */
  selection?: string;
  /** Free-form prompt or instruction from the user (e.g. "make it darker"). */
  instruction?: string;
  /** Surrounding paragraphs for narrative context (optional). */
  surrounding?: string;
  /** Writing being edited — used for log attribution. */
  writingId?: string;
}

export interface AIGenerateTextResponse {
  /** The AI's textual output. Never auto-applied — RN005. */
  text: string;
  mode: AIMode;
  model: string;
  tokensUsed: { input: number; output: number };
  /** True if the response was produced by the mock provider. */
  mocked: boolean;
}

// ─────────────────────────────────────────────
// Image generation
// ─────────────────────────────────────────────

export interface AIGenerateImageRequest {
  universeId: string;
  prompt: string;
  style: ImageStyle;
  width?: number;
  height?: number;
}

export interface AIGenerateImageResponse {
  imageUrl: string;
  style: ImageStyle;
  model: string;
  mocked: boolean;
}

// ─────────────────────────────────────────────
// Consistency analysis
// ─────────────────────────────────────────────

export type ConsistencyIssueType = 'inconsistency' | 'plot_hole' | 'law_violation';
export type ConsistencyIssueSeverity = 'critical' | 'warning' | 'info';

export interface ConsistencyIssue {
  type: ConsistencyIssueType;
  severity: ConsistencyIssueSeverity;
  excerpt: string;
  description: string;
  suggestion?: string;
}

export interface AIAnalyzeConsistencyRequest {
  universeId: string;
  writingId?: string;
  text: string;
}

export interface AIAnalyzeConsistencyResponse {
  issues: ConsistencyIssue[];
  model: string;
  tokensUsed: { input: number; output: number };
  mocked: boolean;
}

// ─────────────────────────────────────────────
// Assisted entity creation
// ─────────────────────────────────────────────

export type AIAssistableEntity =
  | 'character'
  | 'location'
  | 'system'
  | 'lore'
  | 'immutable_law'
  | 'timeline_event';

export interface AIAssistCreationRequest {
  universeId: string;
  entityType: AIAssistableEntity;
  /** What the user wants — e.g. "an aged mage mentor, mysterious, distant". */
  brief: string;
}

export interface AIAssistCreationResponse<TPayload = Record<string, unknown>> {
  entityType: AIAssistableEntity;
  /** Suggested fields for the entity (NOT saved automatically — RN005). */
  suggestion: TPayload;
  model: string;
  tokensUsed: { input: number; output: number };
  mocked: boolean;
}

// ─────────────────────────────────────────────
// Usage log (read DTO)
// ─────────────────────────────────────────────

export type AIAction =
  | 'generate_text'
  | 'generate_image'
  | 'consistency_check'
  | 'assist_creation';

export interface AIUsageLogEntry {
  id: string;
  action: AIAction | string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AIUsageSummary {
  totals: {
    calls: number;
    tokensInput: number;
    tokensOutput: number;
    cost: number;
  };
  byAction: Record<string, { calls: number; tokensInput: number; tokensOutput: number; cost: number }>;
  recent: AIUsageLogEntry[];
}
