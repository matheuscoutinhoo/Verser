import type { ImageStyle, AIMode } from '@verser/shared';

export interface UniverseContext {
  laws: Array<{ title: string; description: string; category: string }>;
  characters: Array<{ name: string; physicalDesc?: string; personality?: string }>;
  locations: Array<{ name: string; description?: string }>;
  systems: Array<{ name: string; type: string; rules?: string }>;
  lore: Array<{ title: string; category: string; content: string; importance: string }>;
}

export interface AITextRequest {
  systemPrompt: string;
  userPrompt: string;
  context: UniverseContext;
  mode?: AIMode;
  maxTokens?: number;
  temperature?: number;
}

export interface AITextResponse {
  text: string;
  model: string;
  tokensUsed: { input: number; output: number };
}

export interface AIImageRequest {
  prompt: string;
  style: ImageStyle;
  width?: number;
  height?: number;
}

export interface AIImageResponse {
  imageUrl: string;
  model: string;
}

export interface ConsistencyIssue {
  type: 'inconsistency' | 'plot_hole' | 'law_violation';
  severity: 'critical' | 'warning' | 'info';
  excerpt: string;
  description: string;
  suggestion?: string;
}

export interface ConsistencyReport {
  issues: ConsistencyIssue[];
  model: string;
  tokensUsed: { input: number; output: number };
}

export interface IAIProvider {
  generateText(request: AITextRequest): Promise<AITextResponse>;
  generateImage(request: AIImageRequest): Promise<AIImageResponse>;
  analyzeConsistency(text: string, context: UniverseContext): Promise<ConsistencyReport>;
}
