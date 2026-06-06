import {
  AI,
  type AIAssistCreationInput,
  type AIAssistCreationResponse,
  type AIAssistableEntity,
  type AIAnalyzeConsistencyInput,
  type AIAnalyzeConsistencyResponse,
  type AIGenerateImageInput,
  type AIGenerateImageResponse,
  type AIGenerateTextInput,
  type AIGenerateTextResponse,
  type AIUsageLogEntry,
  type AIUsageSummary,
} from '@verser/shared';
import { NotFoundError, RateLimitError, ValidationError } from '../../errors';
import { logger } from '../../config/logger';
import type { IAIProvider } from '../../providers/ai/types';
import type { AIUsageLogRepository } from '../repositories/ai-usage-log.repository';
import type { UniverseRepository } from '../repositories/universe.repository';
import type { ContextBuilderService } from './context-builder.service';
import type { PromptBuilderService } from './prompt-builder.service';
export interface AIServiceDeps {
  provider: IAIProvider;
  usageLogRepo: AIUsageLogRepository;
  universeRepo: UniverseRepository;
  contextBuilder: ContextBuilderService;
  promptBuilder: PromptBuilderService;
}

export class AIService {
  constructor(private readonly deps: AIServiceDeps) {}

  // ── rate limit ────────────────────────────────

  async ensureWithinHourlyLimit(userId: string): Promise<void> {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const used = await this.deps.usageLogRepo.countSince(userId, since);
    if (used >= AI.PER_USER_HOURLY_LIMIT) {
      throw new RateLimitError(
        `AI hourly limit reached (${AI.PER_USER_HOURLY_LIMIT}/h). Try again later.`,
      );
    }
  }

  // ── text ──────────────────────────────────────

  async generateText(
    userId: string,
    input: AIGenerateTextInput,
  ): Promise<AIGenerateTextResponse> {
    await this.ensureUniverseAccess(userId, input.universeId);
    await this.ensureWithinHourlyLimit(userId);

    const query = [input.selection, input.surrounding, input.instruction]
      .filter(Boolean)
      .join(' ');
    const context = await this.deps.contextBuilder.build(input.universeId, { query });
    const { systemPrompt, userPrompt } = this.deps.promptBuilder.buildText({
      mode: input.mode,
      selection: input.selection,
      instruction: input.instruction,
      surrounding: input.surrounding,
      context,
    });

    const result = await this.deps.provider.generateText({
      systemPrompt,
      userPrompt,
      context,
      mode: input.mode,
      maxTokens: AI.MAX_OUTPUT_TOKENS,
    });

    await this.logUsage(userId, 'generate_text', result.model, result.tokensUsed, {
      mode: input.mode,
      universeId: input.universeId,
      writingId: input.writingId ?? null,
    });

    return {
      text: result.text,
      mode: input.mode,
      model: result.model,
      tokensUsed: result.tokensUsed,
      mocked: this.deps.provider.id === 'mock',
    };
  }

  // ── image ─────────────────────────────────────

  async generateImage(
    userId: string,
    input: AIGenerateImageInput,
  ): Promise<AIGenerateImageResponse> {
    await this.ensureUniverseAccess(userId, input.universeId);
    await this.ensureWithinHourlyLimit(userId);

    const result = await this.deps.provider.generateImage({
      prompt: input.prompt,
      style: input.style,
      width: input.width,
      height: input.height,
    });

    await this.logUsage(userId, 'generate_image', result.model, { input: 0, output: 0 }, {
      style: input.style,
      universeId: input.universeId,
    });

    return {
      imageUrl: result.imageUrl,
      style: input.style,
      model: result.model,
      mocked: this.deps.provider.id === 'mock',
    };
  }

  // ── consistency ───────────────────────────────

  async analyzeConsistency(
    userId: string,
    input: AIAnalyzeConsistencyInput,
  ): Promise<AIAnalyzeConsistencyResponse> {
    await this.ensureUniverseAccess(userId, input.universeId);
    await this.ensureWithinHourlyLimit(userId);

    const context = await this.deps.contextBuilder.build(input.universeId, { query: input.text });
    const report = await this.deps.provider.analyzeConsistency(input.text, context);

    await this.logUsage(userId, 'consistency_check', report.model, report.tokensUsed, {
      universeId: input.universeId,
      writingId: input.writingId ?? null,
      issueCount: report.issues.length,
    });

    return {
      issues: report.issues,
      model: report.model,
      tokensUsed: report.tokensUsed,
      mocked: this.deps.provider.id === 'mock',
    };
  }

  // ── assist creation ───────────────────────────

  async assistCreation(
    userId: string,
    input: AIAssistCreationInput,
  ): Promise<AIAssistCreationResponse> {
    await this.ensureUniverseAccess(userId, input.universeId);
    await this.ensureWithinHourlyLimit(userId);

    const context = await this.deps.contextBuilder.build(input.universeId, { query: input.brief });
    const { systemPrompt, userPrompt } = this.deps.promptBuilder.buildAssistCreation({
      entityType: input.entityType,
      brief: input.brief,
      context,
    });

    const result = await this.deps.provider.generateText({
      systemPrompt,
      userPrompt,
      context,
      maxTokens: AI.MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    });

    const suggestion = this.safeParseJsonObject(result.text, input.entityType);

    await this.logUsage(userId, 'assist_creation', result.model, result.tokensUsed, {
      entityType: input.entityType,
      universeId: input.universeId,
    });

    return {
      entityType: input.entityType,
      suggestion,
      model: result.model,
      tokensUsed: result.tokensUsed,
      mocked: this.deps.provider.id === 'mock',
    };
  }

  // ── usage report ──────────────────────────────

  async getUsage(userId: string): Promise<AIUsageSummary> {
    const [agg, recent] = await Promise.all([
      this.deps.usageLogRepo.aggregate(userId),
      this.deps.usageLogRepo.listRecent(userId, 20),
    ]);
    return {
      totals: agg.totals,
      byAction: agg.byAction,
      recent: recent.map(
        (r): AIUsageLogEntry => ({
          id: r.id,
          action: r.action,
          model: r.model,
          tokensInput: r.tokensInput,
          tokensOutput: r.tokensOutput,
          cost: r.cost,
          metadata: r.metadata ? safeParseObject(r.metadata) : null,
          createdAt: r.createdAt.toISOString(),
        }),
      ),
    };
  }

  // ── internals ─────────────────────────────────

  private async ensureUniverseAccess(userId: string, universeId: string): Promise<void> {
    const universe = await this.deps.universeRepo.findById(universeId);
    // Match the universe-access middleware: 404 instead of 403 so we don't leak
    // existence of universes owned by other users.
    if (!universe || universe.userId !== userId) {
      throw new NotFoundError('Universe');
    }
  }

  private async logUsage(
    userId: string,
    action: string,
    model: string,
    tokens: { input: number; output: number },
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.deps.usageLogRepo.create({
        userId,
        action,
        model,
        tokensInput: tokens.input,
        tokensOutput: tokens.output,
        cost: 0,
        metadata,
      });
    } catch (err) {
      // Logging must never block a successful AI call.
      logger.warn({ err, userId, action }, 'AI usage log write failed');
    }
  }

  private safeParseJsonObject(
    text: string,
    entityType: AIAssistableEntity,
  ): Record<string, unknown> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new ValidationError(`AI returned empty response for ${entityType}`);
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1) {
      // Mock providers return a non-JSON greeting; surface it as a single-field
      // suggestion so the UI can still show the response during development.
      return { _raw: trimmed };
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return { _raw: trimmed };
    }
  }
}

function safeParseObject(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
