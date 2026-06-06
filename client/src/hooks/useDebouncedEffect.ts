import { useEffect, useRef } from 'react';

/**
 * Calls `callback(value)` once `delay` milliseconds elapse since the last
 * change to `value`, but only when `value` differs from the most recently
 * persisted snapshot. Pass `enabled=false` to skip scheduling.
 */
export function useDebouncedEffect<T>(
  value: T,
  callback: (value: T) => void | Promise<void>,
  delay: number,
  enabled = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => {
      void callbackRef.current(value);
    }, delay);
    return () => window.clearTimeout(id);
  }, [value, delay, enabled]);
}
