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
