import type {
  AIImageRequest,
  AIImageResponse,
  AITextRequest,
  AITextResponse,
  ConsistencyReport,
  IAIProvider,
  UniverseContext,
} from './types';

export class MockAIProvider implements IAIProvider {
  async generateText(request: AITextRequest): Promise<AITextResponse> {
    return {
      text: `[mock] ${request.mode ?? 'generated'} text for prompt: ${request.userPrompt.slice(0, 80)}`,
      model: 'mock-text-v1',
      tokensUsed: {
        input: Math.ceil(request.userPrompt.length / 4),
        output: 32,
      },
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    return {
      imageUrl: `https://placehold.co/${request.width ?? 512}x${request.height ?? 512}?text=${encodeURIComponent(request.style)}`,
      model: 'mock-image-v1',
    };
  }

  async analyzeConsistency(_text: string, _context: UniverseContext): Promise<ConsistencyReport> {
    return {
      issues: [],
      model: 'mock-text-v1',
      tokensUsed: { input: 0, output: 0 },
    };
  }
}
