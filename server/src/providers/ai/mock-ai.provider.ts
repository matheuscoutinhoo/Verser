import type {
  AIImageRequest,
  AIImageResponse,
  AITextRequest,
  AITextResponse,
  ConsistencyReport,
  IAIProvider,
} from './types';
import type { UniverseContextBundle } from '@verser/shared';

/**
 * Deterministic provider used in tests and when `ABACUS_AI_API_KEY` is missing.
 * Returns shaped, traceable responses without ever hitting the network.
 */
export class MockAIProvider implements IAIProvider {
  readonly id = 'mock' as const;

  async generateText(request: AITextRequest): Promise<AITextResponse> {
    const head = request.userPrompt.slice(0, 120).replace(/\s+/g, ' ');
    const text = `[mock:${request.mode ?? 'generate'}] ${head}`;
    return {
      text,
      model: 'mock-text-v1',
      tokensUsed: {
        input: Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4),
        output: Math.ceil(text.length / 4),
      },
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    const w = request.width ?? 512;
    const h = request.height ?? 512;
    const label = encodeURIComponent(`${request.style}: ${request.prompt.slice(0, 40)}`);
    return {
      imageUrl: `https://placehold.co/${w}x${h}?text=${label}`,
      model: 'mock-image-v1',
    };
  }

  async analyzeConsistency(_text: string, _context: UniverseContextBundle): Promise<ConsistencyReport> {
    return {
      issues: [],
      model: 'mock-text-v1',
      tokensUsed: { input: 0, output: 0 },
    };
  }
}
