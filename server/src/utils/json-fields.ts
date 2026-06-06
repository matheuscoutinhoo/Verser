import { safeJsonParse, safeJsonStringify } from '@verser/shared';

export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  return safeJsonParse(value, fallback);
}

export function stringifyJsonField(value: unknown): string | null {
  if (value === undefined) return null;
  if (value === null) return null;
  return safeJsonStringify(value);
}
