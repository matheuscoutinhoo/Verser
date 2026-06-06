import type {
  AIMode,
  ConsistencyIssue,
  ImageStyle,
  UniverseContextBundle,
} from '@verser/shared';

export interface AITextRequest {
  systemPrompt: string;
  userPrompt: string;
  context: UniverseContextBundle;
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

export interface ConsistencyReport {
  issues: ConsistencyIssue[];
  model: string;
  tokensUsed: { input: number; output: number };
}

export interface IAIProvider {
  readonly id: 'mock' | 'abacus';
  generateText(request: AITextRequest): Promise<AITextResponse>;
  generateImage(request: AIImageRequest): Promise<AIImageResponse>;
  analyzeConsistency(text: string, context: UniverseContextBundle): Promise<ConsistencyReport>;
}
