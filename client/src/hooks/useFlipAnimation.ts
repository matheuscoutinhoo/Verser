import { useCallback, useLayoutEffect, useRef } from 'react';

export interface UseFlipAnimationOptions {
  /** Animation duration in ms. Default: 320. */
  duration?: number;
  /** Easing function. Default: 'cubic-bezier(0.22, 1, 0.36, 1)' — easeOutQuint. */
  easing?: string;
  /** Skip the animation when the user prefers reduced motion. Default: true. */
  respectReducedMotion?: boolean;
}

/**
 * FLIP animation hook for list reordering.
 *
 * FLIP = First, Last, Invert, Play.
 *
 *   1. First  — caller calls `snapshot()` BEFORE changing the order.
 *      We record every tracked element's bounding rect.
 *   2. Last   — React commits the new order; the browser computes
 *      the new layout.
 *   3. Invert — in `useLayoutEffect`, for each tracked element we
 *      diff old vs new rect and apply an instant
 *      `transform: translate(dx, dy)` that visually pins it back to
 *      where it was.
 *   4. Play   — clear the transform with a CSS transition; the
 *      element slides smoothly from the inverted position to its
 *      real new spot.
 *
 * Why an explicit `snapshot()` instead of relying on the render cycle?
 * Because React calls the `ref` callback only AFTER the DOM is already
 * in its new position — by the time `useLayoutEffect` runs, the
 * "before" rect would have been overwritten. Calling `snapshot()`
 * synchronously, right before the state update, gives us a reliable
 * "before" measurement.
 *
 * Usage:
 *
 *   const flip = useFlipAnimation();
 *   const handleSwap = () => {
 *     flip.snapshot();           // capture First positions
 *     setItems(reorder(items));  // trigger React commit (Last)
 *   };
 *   <li ref={(el) => flip.register(item.id, el)} />
 *   // Invert + Play happen automatically inside the next layout effect.
 */
export function useFlipAnimation(options: UseFlipAnimationOptions = {}) {
  const {
    duration = 320,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    respectReducedMotion = true,
  } = options;

  const nodes = useRef(new Map<string, HTMLElement>());
  // Set by `snapshot()`; consumed and cleared by the next layout effect.
  const pendingRects = useRef<Map<string, DOMRect> | null>(null);

  const snapshot = useCallback(() => {
    const map = new Map<string, DOMRect>();
    for (const [key, el] of nodes.current) {
      map.set(key, el.getBoundingClientRect());
    }
    pendingRects.current = map;
  }, []);

  // Runs after EVERY commit. If a snapshot is pending, animate the deltas.
  useLayoutEffect(() => {
    const before = pendingRects.current;
    if (!before) return;
    pendingRects.current = null;

    if (
      respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    for (const [key, el] of nodes.current) {
      const prev = before.get(key);
      if (!prev) continue;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) continue;

      // Cancel any animation already in flight so back-to-back swaps
      // don't visually queue up. The fresh getBoundingClientRect above
      // already reflects the current on-screen position.
      el.getAnimations?.().forEach((a) => a.cancel());

      // Lift the moving card above its neighbours during the slide so
      // overlapping cards read as "passing through" instead of stacked.
      const prevZIndex = el.style.zIndex;
      const prevWillChange = el.style.willChange;
      el.style.willChange = 'transform';
      el.style.zIndex = '5';

      const animation = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration,
          easing,
          fill: 'both',
        },
      );

      const cleanup = () => {
        el.style.willChange = prevWillChange;
        el.style.zIndex = prevZIndex;
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    }
  });

  const register = useCallback((key: string, el: HTMLElement | null) => {
    if (el) {
      nodes.current.set(key, el);
    } else {
      nodes.current.delete(key);
    }
  }, []);

  return { snapshot, register };
}
