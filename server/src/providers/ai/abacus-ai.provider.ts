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

    // Detect the endpoint shape from the path. OpenAI-compatible facades
    // (RouteLLM, custom OpenAI proxies) expect either `/chat/completions`
    // with messages or `/images/generations` with a flat prompt; the
    // classic Abacus ChatLLM endpoint expects { deploymentId, prompt }.
    const isChatCompletions = /\/chat\/completions(\b|$)/i.test(path);
    const isImagesGenerations = /\/images\/generations(\b|$)/i.test(path);

    let body: unknown;
    if (isChatCompletions) {
      // Multimodal-aware models (Gemini Flash Image, GPT-Image, …) accept a
      // plain user message describing the image. We add a light system
      // hint so the assistant returns a usable URL (or markdown image)
      // rather than prose around it.
      body = {
        model: this.imageModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an image generator. Generate the requested image and return ONLY the result. ' +
              'If your platform returns inline image bytes, return them as such. ' +
              'Otherwise return a single direct image URL or markdown image link with no surrounding prose.',
          },
          {
            role: 'user',
            content: request.style
              ? `${request.prompt}\n\nStyle: ${request.style}`
              : request.prompt,
          },
        ],
      };
    } else if (isImagesGenerations) {
      body = {
        model: this.imageModel,
        prompt: request.style ? `${request.prompt} — ${request.style}` : request.prompt,
        size: `${request.width ?? 1024}x${request.height ?? 1024}`,
        n: 1,
      };
    } else {
      // Classic Abacus ChatLLM / REST predict shape.
      body = {
        deploymentId: this.imageModel,
        prompt: request.prompt,
        style: request.style,
        width: request.width ?? 1024,
        height: request.height ?? 1024,
      };
    }

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

    // 3) Give the operator something to act on. We log the whole payload
    //    (truncated and base64 redacted) so we can grow the walker for new
    //    deployment shapes without needing the user to re-reproduce.
    logger.error(
      {
        keys: response && typeof response === 'object' ? Object.keys(response) : [],
        type: typeof response,
        payload: previewPayload(response),
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

// Matches an http(s) or data:image URL anywhere inside a string. Stops at
// whitespace, quotes, angle/closing brackets, parens and backticks, which
// covers markdown (`![alt](url)`), JSON-embedded URLs, and prose. Image
// extensions get a small preference when ranking multiple matches.
const URL_REGEX = /(https?:\/\/[^\s"'<>)\]`]+|data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+)/gi;
const IMAGE_EXT_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i;
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
  // Chat-completion style: image-as-text deployments embed the URL inside
  // the assistant's message content.
  'content',
  'text',
  'message',
]);

/**
 * Recursively scan `value` for the first http(s)/data:image URL embedded in
 * any string. URL-hinted fields are visited first, and URLs whose path
 * carries a common image extension are preferred over generic ones.
 */
function findFirstUrl(value: unknown): string | null {
  const queue: unknown[] = [value];
  const candidates: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (typeof node === 'string') {
      const matches = node.match(URL_REGEX);
      if (matches) candidates.push(...matches);
      continue;
    }
    if (Array.isArray(node)) {
      for (const item of node) queue.push(item);
      continue;
    }
    if (node && typeof node === 'object') {
      const entries = Object.entries(node as Record<string, unknown>);
      // Visit hinted keys first so the search short-circuits on the most
      // likely URL holder when multiple candidates exist.
      entries.sort(([a], [b]) => {
        const aHint = URL_FIELD_HINTS.has(a.toLowerCase()) ? 0 : 1;
        const bHint = URL_FIELD_HINTS.has(b.toLowerCase()) ? 0 : 1;
        return aHint - bHint;
      });
      for (const [, v] of entries) queue.push(v);
    }
  }
  if (candidates.length === 0) return null;
  // Prefer URLs whose path looks like an image asset; otherwise just take
  // the first one we found.
  const imageLike = candidates.find((u) => IMAGE_EXT_REGEX.test(u));
  return imageLike ?? candidates[0];
}

const BASE64_FIELD_HINTS = new Set([
  'b64_json',
  'b64',
  'base64',
  'imagedata',
  'image_base64',
  'image_bytes',
  // Gemini multimodal returns parts: [{ inline_data: { mime_type, data }}]
  // (or its camelCase variant inlineData/mimeType). We match the inner
  // `data` field as long as a sibling `mime_type` exists and starts with
  // "image/", or the parent key name itself indicates inline image data.
  'data',
]);

const INLINE_IMAGE_PARENT_HINTS = new Set([
  'inline_data',
  'inlinedata',
  'inline',
  'image',
  'media',
]);

function isImageMimeType(v: unknown): boolean {
  return typeof v === 'string' && v.toLowerCase().startsWith('image/');
}

/**
 * Look for a base64-encoded image embedded in the response and promote it
 * to a `data:` URL the browser can render. Matches:
 *   - fields named like `b64_json` / `base64` / `image_bytes` directly,
 *   - the `data` field inside Gemini-style `inline_data: { mime_type, data }`
 *     parts (preserves the actual mime type when present).
 */
function findFirstBase64Image(value: unknown): string | null {
  // Tracks each node's parent key without mutating the original objects.
  const parentKey = new WeakMap<object, string>();
  const queue: Array<{ key: string | null; parent: Record<string, unknown> | null; v: unknown }> = [
    { key: null, parent: null, v: value },
  ];
  while (queue.length > 0) {
    const { key, parent, v } = queue.shift() ?? { key: null, parent: null, v: null };
    if (typeof v === 'string') {
      const looksLikeBase64Field =
        key !== null && BASE64_FIELD_HINTS.has(key.toLowerCase()) && v.length > 100;
      if (!looksLikeBase64Field) continue;
      // For the loose `data` hint, require either an image-typed sibling
      // or an image-hinted parent key, so we don't accidentally promote
      // arbitrary base64-ish strings.
      if (key && key.toLowerCase() === 'data') {
        const siblingMime =
          (parent?.mime_type as unknown) ?? (parent?.mimeType as unknown);
        const grandParentKey = parent ? (parentKey.get(parent) ?? '') : '';
        if (!isImageMimeType(siblingMime) && !INLINE_IMAGE_PARENT_HINTS.has(grandParentKey.toLowerCase())) {
          continue;
        }
        const mime = isImageMimeType(siblingMime) ? (siblingMime as string) : 'image/png';
        const cleaned = v.replace(/^data:[^;]+;base64,/i, '');
        return `data:${mime};base64,${cleaned}`;
      }
      // Strict-named base64 fields (b64_json, image_bytes, …) → assume PNG
      // unless the value already carries its own `data:` prefix.
      const cleaned = v.replace(/^data:[^;]+;base64,/i, '');
      return `data:image/png;base64,${cleaned}`;
    }
    if (Array.isArray(v)) {
      for (const item of v) queue.push({ key, parent, v: item });
      continue;
    }
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      for (const [k, child] of Object.entries(obj)) {
        if (child && typeof child === 'object') {
          parentKey.set(child as object, k);
        }
        queue.push({ key: k, parent: obj, v: child });
      }
    }
  }
  return null;
}

/**
 * Build a debug-friendly preview of an Abacus response: trim long strings,
 * redact obvious base64 blobs, and cap depth so logs stay readable.
 */
function previewPayload(value: unknown, depth = 0): unknown {
  if (depth > 4) return '…';
  if (typeof value === 'string') {
    if (value.length > 500) return `${value.slice(0, 200)}…(${value.length} chars)…${value.slice(-50)}`;
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((v) => previewPayload(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = previewPayload(v, depth + 1);
    }
    return out;
  }
  return value;
}
