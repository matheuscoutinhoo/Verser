import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { InternalError } from '../../errors';
import type {
  AIImageRequest,
  AIImageResponse,
  AITextRequest,
  AITextResponse,
  ConsistencyReport,
  IAIProvider,
  UniverseContext,
} from './types';

// Real implementation is stubbed until Phase 4 (AI integration).
// Networking is intentionally not wired here to keep Phase 1 deterministic.
// When implementing: use fetch against env.ABACUS_AI_BASE_URL with Bearer env.ABACUS_AI_API_KEY.
export class AbacusAIProvider implements IAIProvider {
  constructor(
    private readonly apiKey: string | undefined = env.ABACUS_AI_API_KEY,
    private readonly baseUrl: string = env.ABACUS_AI_BASE_URL,
    private readonly textModel: string = env.ABACUS_AI_TEXT_MODEL,
    private readonly imageModel: string = env.ABACUS_AI_IMAGE_MODEL,
  ) {
    if (!apiKey) {
      logger.warn('ABACUS_AI_API_KEY not set — AbacusAIProvider will throw on invocation');
    }
  }

  async generateText(_request: AITextRequest): Promise<AITextResponse> {
    this.ensureConfigured();
    throw new InternalError('AbacusAIProvider.generateText not implemented yet (Phase 4)');
  }

  async generateImage(_request: AIImageRequest): Promise<AIImageResponse> {
    this.ensureConfigured();
    throw new InternalError('AbacusAIProvider.generateImage not implemented yet (Phase 4)');
  }

  async analyzeConsistency(_text: string, _context: UniverseContext): Promise<ConsistencyReport> {
    this.ensureConfigured();
    throw new InternalError('AbacusAIProvider.analyzeConsistency not implemented yet (Phase 4)');
  }

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new InternalError('Abacus AI is not configured (missing ABACUS_AI_API_KEY)');
    }
    if (!this.baseUrl || !this.textModel || !this.imageModel) {
      throw new InternalError('Abacus AI configuration is incomplete');
    }
  }
}
