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
    // Debug-only dump of the top-level shape so we can grow `extractImageUrl`
    // if a deployment ever returns yet another envelope. Never log payloads.
    if (logger.level === 'debug' && response && typeof response === 'object') {
      logger.debug(
        { keys: Object.keys(response) },
        'AbacusAI generateImage: response keys',
      );
    }
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
    if (response === null || response === undefined) {
      throw new InternalError('Abacus AI returned an empty image response');
    }

    // 1) Walk the response and return the first URL-looking string. Abacus
    //    deployments emit several shapes ({ result: "..." }, { result: { url }},
    //    { data: [{ url }]}, segments arrays, signedUrl, downloadUrl…), so a
    //    recursive search is simpler — and safer — than a long if-ladder.
    const url = findFirstUrl(response);
    if (url) return url;

    // 2) Some deployments return raw base64 bytes instead of a URL. Promote
    //    any sensible-looking base64 field to a `data:` URL the browser can
    //    render directly.
    const dataUrl = findFirstBase64Image(response);
    if (dataUrl) return dataUrl;

    // 3) Give the operator something to act on. We log only the top-level
    //    keys (no payloads) to avoid leaking image bytes into logs.
    logger.error(
      {
        keys: response && typeof response === 'object' ? Object.keys(response) : [],
        type: typeof response,
      },
      'extractImageUrl: no URL/base64 found in Abacus AI image response',
    );
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

// ── module-private helpers ─────────────────────────

const URL_LIKE_REGEX = /^(https?:\/\/|data:image\/)[^\s"'<>]+$/i;
const URL_FIELD_HINTS = new Set([
  'url',
  'imageurl',
  'image_url',
  'signedurl',
  'signed_url',
  'downloadurl',
  'download_url',
  'image',
  'src',
  'href',
  'output_url',
  'cdnurl',
  'cdn_url',
]);

/**
 * Recursively scan `value` for the first string that looks like an http(s)
 * URL or a `data:image/...` URL. Field names are not required to match — we
 * fall back to matching on the value — but obviously-named fields are
 * preferred when both are present at the same depth.
 */
function findFirstUrl(value: unknown): string | null {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const node = queue.shift();
    if (typeof node === 'string') {
      if (URL_LIKE_REGEX.test(node.trim())) return node.trim();
      continue;
    }
    if (Array.isArray(node)) {
      for (const item of node) queue.push(item);
      continue;
    }
    if (node && typeof node === 'object') {
      const entries = Object.entries(node as Record<string, unknown>);
      // Prefer URL-hinted fields first so we don't pick up arbitrary
      // strings (e.g. a description containing a URL) when a proper one
      // exists alongside.
      entries.sort(([a], [b]) => {
        const aHint = URL_FIELD_HINTS.has(a.toLowerCase()) ? 0 : 1;
        const bHint = URL_FIELD_HINTS.has(b.toLowerCase()) ? 0 : 1;
        return aHint - bHint;
      });
      for (const [, v] of entries) queue.push(v);
    }
  }
  return null;
}

const BASE64_FIELD_HINTS = new Set([
  'b64_json',
  'b64',
  'base64',
  'imagedata',
  'image_base64',
  'image_bytes',
]);

/**
 * Look for a base64-encoded image embedded in the response and promote it
 * to a `data:` URL the browser can render. Only matches fields whose name
 * hints at base64 image content + a non-trivial payload, to avoid coercing
 * unrelated strings.
 */
function findFirstBase64Image(value: unknown): string | null {
  const queue: Array<{ key: string | null; v: unknown }> = [{ key: null, v: value }];
  while (queue.length > 0) {
    const { key, v } = queue.shift() ?? { key: null, v: null };
    if (typeof v === 'string') {
      if (key && BASE64_FIELD_HINTS.has(key.toLowerCase()) && v.length > 100) {
        const cleaned = v.replace(/^data:[^;]+;base64,/i, '');
        return `data:image/png;base64,${cleaned}`;
      }
      continue;
    }
    if (Array.isArray(v)) {
      for (const item of v) queue.push({ key, v: item });
      continue;
    }
    if (v && typeof v === 'object') {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        queue.push({ key: k, v: child });
      }
    }
  }
  return null;
}
