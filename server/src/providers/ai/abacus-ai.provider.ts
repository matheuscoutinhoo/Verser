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
} from './types';
import type { ConsistencyIssue, UniverseContextBundle } from '@verser/shared';

/**
 * Abacus AI provider.
 *
 * - All endpoint paths and auth styles are env-configurable so the same code
 *   works against ChatLLM (deploymentId+deploymentToken), the REST predict API,
 *   or an OpenAI-compatible facade. See `.env.example` for the relevant vars.
 * - When `ABACUS_AI_API_KEY` is missing, the container injects MockAIProvider
 *   instead of this class, so we throw loudly here only as a guard.
 */
export class AbacusAIProvider implements IAIProvider {
  readonly id = 'abacus' as const;

  constructor(
    private readonly apiKey: string | undefined = env.ABACUS_AI_API_KEY,
    private readonly baseUrl: string = env.ABACUS_AI_BASE_URL,
    private readonly textModel: string = env.ABACUS_AI_TEXT_MODEL,
    private readonly imageModel: string = env.ABACUS_AI_IMAGE_MODEL,
  ) {
    if (!apiKey) {
      logger.warn(
        'AbacusAIProvider instantiated without ABACUS_AI_API_KEY — calls will throw',
      );
    }
  }

  async generateText(request: AITextRequest): Promise<AITextResponse> {
    this.ensureConfigured();

    const path = process.env.ABACUS_AI_TEXT_PATH ?? '/v0/getChatResponse';
    const url = this.url(path);

    const body = {
      deploymentId: this.textModel,
      messages: [
        { is_user: false, text: request.systemPrompt },
        { is_user: true, text: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.7,
      numCompletionTokens: request.maxTokens ?? 1500,
      max_tokens: request.maxTokens ?? 1500,
    };

    const response = await this.post<unknown>(url, body);
    const parsed = this.extractTextFromResponse(response);

    return {
      text: parsed.text,
      model: this.textModel,
      tokensUsed: parsed.tokensUsed,
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    this.ensureConfigured();

    const path = process.env.ABACUS_AI_IMAGE_PATH ?? '/v0/generateImage';
    const url = this.url(path);

    const body = {
      deploymentId: this.imageModel,
      prompt: request.prompt,
      style: request.style,
      width: request.width ?? 1024,
      height: request.height ?? 1024,
    };

    const response = await this.post<unknown>(url, body);
    const imageUrl = this.extractImageUrl(response);

    return { imageUrl, model: this.imageModel };
  }

  async analyzeConsistency(
    text: string,
    context: UniverseContextBundle,
  ): Promise<ConsistencyReport> {
    this.ensureConfigured();

    const systemPrompt = [
      "You are a narrative consistency analyst. Compare the writer's text against",
      'their established worldbuilding and emit issues as STRICT JSON. NEVER include',
      'prose outside the JSON. Schema:',
      '{ "issues": [ { "type": "inconsistency"|"plot_hole"|"law_violation",',
      '  "severity": "critical"|"warning"|"info",',
      '  "excerpt": string, "description": string, "suggestion": string } ] }',
    ].join('\n');

    const userPrompt = [
      `Universe: ${context.universe.name}${context.universe.genre ? ` (${context.universe.genre})` : ''}`,
      '',
      'IMMUTABLE LAWS (never violate):',
      context.laws.map((l) => `- [${l.category}] ${l.title}: ${l.description}`).join('\n') || '(none)',
      '',
      'Relevant characters:',
      context.characters
        .map(
          (c) =>
            `- ${c.name}${c.aliases?.length ? ` (aka ${c.aliases.join(', ')})` : ''}${c.summary ? `: ${c.summary}` : ''}`,
        )
        .join('\n') || '(none provided)',
      '',
      'Critical lore:',
      context.lore.map((l) => `- ${l.title} [${l.importance}]: ${l.content.slice(0, 400)}`).join('\n') ||
        '(none)',
      '',
      'TEXT TO ANALYZE:',
      text,
    ].join('\n');

    const result = await this.generateText({
      systemPrompt,
      userPrompt,
      context,
      maxTokens: 1500,
      temperature: 0.2,
    });

    const issues = this.safeParseIssues(result.text);
    return {
      issues,
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  // ── helpers ─────────────────────────────────────

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new InternalError('Abacus AI is not configured (missing ABACUS_AI_API_KEY)');
    }
    if (!this.baseUrl || !this.textModel || !this.imageModel) {
      throw new InternalError('Abacus AI configuration is incomplete');
    }
  }

  private url(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const authMode = (process.env.ABACUS_AI_AUTH_STYLE ?? 'bearer').toLowerCase();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authMode === 'bearer') {
      headers.Authorization = `Bearer ${this.apiKey}`;
    } else if (authMode === 'header') {
      headers.apiKey = this.apiKey as string;
    }
    // For "body" auth style the caller is expected to put the token in the body.

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      logger.error(
        { url, status: res.status, errorText: errorText.slice(0, 500) },
        'Abacus AI request failed',
      );
      throw new InternalError(`Abacus AI request failed (${res.status})`);
    }

    return (await res.json()) as T;
  }

  private extractTextFromResponse(response: unknown): {
    text: string;
    tokensUsed: { input: number; output: number };
  } {
    const r = response as Record<string, unknown> | null;
    if (!r) return { text: '', tokensUsed: { input: 0, output: 0 } };

    // ChatLLM: { success, result: { content, ... } }
    const result = r.result as Record<string, unknown> | undefined;
    if (result && typeof result.content === 'string') {
      const usage = (r.usage ?? result.usage) as Record<string, number> | undefined;
      return {
        text: result.content,
        tokensUsed: {
          input: usage?.inputTokens ?? usage?.prompt_tokens ?? 0,
          output: usage?.outputTokens ?? usage?.completion_tokens ?? 0,
        },
      };
    }

    // OpenAI-compatible: { choices: [{ message: { content }}], usage: {...} }
    const choices = r.choices as Array<{ message?: { content?: string } }> | undefined;
    if (choices && choices[0]?.message?.content) {
      const usage = r.usage as Record<string, number> | undefined;
      return {
        text: choices[0].message.content,
        tokensUsed: {
          input: usage?.prompt_tokens ?? 0,
          output: usage?.completion_tokens ?? 0,
        },
      };
    }

    return {
      text: typeof r === 'string' ? r : JSON.stringify(r),
      tokensUsed: { input: 0, output: 0 },
    };
  }

  private extractImageUrl(response: unknown): string {
    const r = response as Record<string, unknown> | null;
    if (!r) throw new InternalError('Abacus AI returned an empty image response');

    if (typeof r.imageUrl === 'string') return r.imageUrl;
    if (typeof r.url === 'string') return r.url;
    const result = r.result as Record<string, unknown> | undefined;
    if (result) {
      if (typeof result.imageUrl === 'string') return result.imageUrl;
      if (typeof result.url === 'string') return result.url;
    }
    const data = r.data as Array<{ url?: string }> | undefined;
    if (data?.[0]?.url) return data[0].url;

    throw new InternalError('Could not locate image URL in Abacus AI response');
  }

  private safeParseIssues(text: string): ConsistencyIssue[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1) return [];
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
        issues?: ConsistencyIssue[];
      };
      return Array.isArray(parsed.issues) ? parsed.issues : [];
    } catch {
      return [];
    }
  }
}
