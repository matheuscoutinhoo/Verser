import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedEffect } from '../../src/hooks/useDebouncedEffect';

describe('useDebouncedEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires the callback after the delay using the latest value', () => {
    const cb = vi.fn();
    const { rerender } = renderHook(({ value }) => useDebouncedEffect(value, cb, 100), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('c');
  });

  it('does not schedule when disabled', () => {
    const cb = vi.fn();
    renderHook(() => useDebouncedEffect('x', cb, 100, false));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
