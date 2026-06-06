export function isApiError<T>(
  response: { data: T } | { error: { code: string; message: string } },
): response is { error: { code: string; message: string } } {
  return 'error' in response;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Counts whitespace-separated tokens in `text` after collapsing all whitespace.
 * Returns 0 for empty/null/undefined.
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/u).length;
}
